from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Literal
import re
from io import BytesIO

from PIL import Image, ImageOps
import pytesseract

router = APIRouter(prefix="/api/v1/ocr", tags=["OCR"])

TipoOCR = Literal["DNI", "PS_BETA", "TERMOGRAFO", "BOOKING", "O_BETA", "AWB"]

# Si en tu entorno tesseract no está en PATH, descomenta y ajusta:
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def _preprocess(img: Image.Image) -> Image.Image:
    """
    Preproceso robusto para códigos en capturas pegadas:
    - grayscale
    - autocontrast
    - upscale si viene pequeño
    - binarización suave
    """
    img = img.convert("L")
    img = ImageOps.autocontrast(img)

    w, h = img.size
    if max(w, h) < 1200:
        img = img.resize((w * 2, h * 2), Image.Resampling.LANCZOS)

    # umbral (ajustable)
    img = img.point(lambda p: 255 if p > 160 else 0)
    return img


def ocr_imagen_pil(img: Image.Image) -> str:
    """
    OCR orientado a códigos.
    """
    try:
        img = _preprocess(img)
        config = "--oem 3 --psm 6"
        return pytesseract.image_to_string(img, lang="eng", config=config) or ""
    except pytesseract.TesseractNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="OCR no disponible: Tesseract no está instalado/configurado en el servidor."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error OCR: {e}")


def _normalize(s: str) -> str:
    s = (s or "").upper()
    # normaliza espacios
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _dedupe_keep_order(vals: list[str]) -> list[str]:
    seen = set()
    out = []
    for v in vals:
        if v not in seen:
            seen.add(v)
            out.append(v)
    return out


def _normalize_contenedor(prefix: str, six: str, check: str) -> str:
    # Formato final requerido: "SEKU 942643-3"
    return f"{prefix} {six}-{check}"


def extraer_valores(texto: str, tipo: TipoOCR) -> list[str]:
    t = _normalize(texto)

    if tipo == "DNI":
        return re.findall(r"\b\d{8}\b", t)

    if tipo == "PS_BETA":
        vals = re.findall(r"\b[A-Z0-9\-]{6,20}\b", t)
        blacklist = {"BETA", "SENASA", "BOOKING", "AWB"}
        return [v for v in vals if v not in blacklist]

    if tipo == "TERMOGRAFO":
        return re.findall(r"\b[A-Z0-9]{6,30}\b", t)

    if tipo == "BOOKING":
        vals = re.findall(r"\b[A-Z0-9\-]{6,20}\b", t)
        blacklist = {"BOOKING", "BETA", "AWB"}
        return [v for v in vals if v not in blacklist]

    if tipo == "O_BETA":
        return re.findall(r"\b[A-Z]{2,4}\d{3,8}\b", t)

    if tipo == "AWB":
        """
        En tu negocio, AWB = CONTENEDOR con formato final:
          AAAA 123456-7

        Aceptamos variaciones OCR:
          - SEKU 942643-3
          - SEKU942643-3
          - SEKU 9426433
          - SEKU9426433
          - SEKU 942643 3 (espacios raros)
        """
        out: list[str] = []

        # 1) Caso ideal: 4 letras + (espacios) + 6 dígitos + (espacios) + "-" + (espacios) + 1 dígito
        m1 = re.findall(r"\b([A-Z]{4})\s*(\d{6})\s*-\s*(\d)\b", t)
        for prefix, six, check in m1:
            out.append(_normalize_contenedor(prefix, six, check))

        # 2) Caso pegado: 4 letras + 7 dígitos (SEKU9426433)
        m2 = re.findall(r"\b([A-Z]{4})(\d{7})\b", t)
        for prefix, seven in m2:
            six, check = seven[:6], seven[6:]
            out.append(_normalize_contenedor(prefix, six, check))

        # 3) Caso con guion pero sin espacio: SEKU942643-3
        m3 = re.findall(r"\b([A-Z]{4})(\d{6})-\s*(\d)\b", t)
        for prefix, six, check in m3:
            out.append(_normalize_contenedor(prefix, six, check))

        # 4) Caso con espacios raros: SEKU 942643 3 (sin guion)
        m4 = re.findall(r"\b([A-Z]{4})\s*(\d{6})\s+(\d)\b", t)
        for prefix, six, check in m4:
            out.append(_normalize_contenedor(prefix, six, check))

        return _dedupe_keep_order(out)

    return []


@router.post("/extraer")
async def extraer(
    tipo: TipoOCR = Query(...),
    archivo: UploadFile = File(...)
):
    nombre = (archivo.filename or "").lower()
    data = await archivo.read()

    if not data:
        raise HTTPException(status_code=400, detail="Archivo vacío")

    texto = ""

    # Imagen
    if nombre.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp")):
        try:
            img = Image.open(BytesIO(data))
        except Exception:
            raise HTTPException(status_code=400, detail="No se pudo leer la imagen (archivo inválido/corrupto)")
        texto = ocr_imagen_pil(img)

    # PDF (primera página)
    elif nombre.endswith(".pdf"):
        try:
            from pdf2image import convert_from_bytes
        except Exception:
            raise HTTPException(status_code=500, detail="Falta instalar pdf2image o dependencias para PDF")

        try:
            paginas = convert_from_bytes(data, first_page=1, last_page=1)
            if not paginas:
                raise HTTPException(status_code=400, detail="No se pudo convertir el PDF a imagen")
            texto = ocr_imagen_pil(paginas[0])
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error procesando PDF: {e}")

    else:
        raise HTTPException(status_code=415, detail="Formato no soportado. Usa imagen o PDF.")

    valores = extraer_valores(texto, tipo)

    return {
        "tipo": tipo,
        "texto": texto,
        "valores_detectados": valores,
        "mejor_valor": valores[0] if valores else None
    }
