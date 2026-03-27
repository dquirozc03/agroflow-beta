import pytesseract
import cv2
import numpy as np
import re
from PIL import Image
import io
from pdf2image import convert_from_bytes
from app.utils.logging import logger

class OCRService:
    def __init__(self):
        # Configuramos tesseract para español
        self.config = '--psm 3 -l spa'
        # En Windows, a veces es necesario especificar la ruta explícitamente
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

    def preprocess_image(self, image):
        """Mejora la imagen para un mejor reconocimiento: escala de grises y ajuste de contraste."""
        # Convertir a arreglo numpy (OpenCV)
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # 1. Redimensionar si es muy pequeña (mejora OCR)
        height, width = img.shape[:2]
        if width < 1000:
            img = cv2.resize(img, (None, None), fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

        # 2. Escala de grises
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 3. Aumentar contraste (CLAHE es excelente para documentos con sellos)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 4. Desenfoque suave para reducir ruido
        blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
        
        return Image.fromarray(blurred)

    def extract_text(self, image_bytes, is_pdf=False):
        """Extrae texto con varios intentos (Original y Procesado)."""
        try:
            images = []
            if is_pdf:
                images = convert_from_bytes(image_bytes)
            else:
                images = [Image.open(io.BytesIO(image_bytes))]

            full_results = []
            for i, img in enumerate(images):
                # Intento 1: Con procesamiento OpenCV (mejor para fotos)
                processed_img = self.preprocess_image(img)
                text_p = pytesseract.image_to_string(processed_img, config=self.config)
                
                # Intento 2: Con la imagen original (mejor para scans claros)
                text_o = pytesseract.image_to_string(img, config=self.config)
                
                full_results.append(text_p)
                full_results.append(text_o)
            
            combined_text = "\n---\n".join(full_results)
            logger.info(f"Texto extraído ({len(combined_text)} caracteres)")
            return combined_text
        except Exception as e:
            logger.error(f"Error en extracción de texto: {e}")
            return ""

    def parse_transportista_data(self, text):
        """Heurística de precisión quirúrgica: Ignora acentos y limpia etiquetas residuales."""
        def fix_ocr_errors(t, is_ruc=False):
            t = t.replace('O', '0').replace('o', '0').replace('I', '1').replace('i', '1').replace('l', '1').replace('S', '5').replace('B', '8')
            if is_ruc:
                # Corregir 208 por 206 (error común de sombra en MTC)
                if t.startswith('208') and len(t) == 11: t = '206' + t[3:]
                # Si empieza por 80 corregir a 20
                if t.startswith('80'): t = '20' + t[2:]
            return t

        data = {
            "nombre_transportista": None,
            "ruc": None,
            "partida_registral": None,
            "certificado_vehicular": None,
            "placa": None
        }

        # Limpieza de líneas
        lines = [l.strip() for l in text.split('\n') if len(l.strip()) > 3]
        clean_text_full = "\n".join(lines)

        # --- 1. RUC (Buscamos patrón estricto después de RUC) ---
        ruc_search = re.search(r'RUC[:\s\-]*([0-9\sOlIBS]{10,15})', clean_text_full, re.IGNORECASE)
        if ruc_search:
            raw_ruc = re.sub(r'[^0-9OolISsB]', '', ruc_search.group(1))
            data["ruc"] = fix_ocr_errors(raw_ruc, is_ruc=True)[:11]

        # --- 2. Razón Social (Limpieza multi-capa) ---
        # Patrón que ignora acentos (N[OÓ]MBRE, RAZ[OÓ]N)
        label_pattern = r'(?i).*(NOMBRE|RAZ[OÓ]N|SOCIAL|TRANSPORTISTA)[:\s\-]*'
        
        for i, line in enumerate(lines):
            line_up = line.upper()
            if "SOCIAL" in line_up or "TRANSPORTISTA" in line_up:
                # Limpiamos la etiqueta con regex flexible
                name = re.sub(label_pattern, '', line).strip()
                
                # Si el nombre quedó vacío o muy corto, buscamos en la línea de abajo
                if len(name) < 5 and i+1 < len(lines):
                    next_line = lines[i+1].strip()
                    if not any(x in next_line.upper() for x in ["RUC", "PARTIDA", "MODALIDAD"]):
                        name = next_line
                
                # Limpieza final de nombre (quitar ruidos típicos de orillas)
                name = re.sub(r'^[|\[\]\s\-\.]+', '', name)
                if len(name) > 4:
                    data["nombre_transportista"] = name.upper()
                    break

        # --- 3. Partida ---
        part_search = re.search(r'PARTIDA\s*(?:REGISTRAL)?[:\s\-]*([A-Z0-9]{8,12})', clean_text_full, re.IGNORECASE)
        if part_search:
            p = part_search.group(1)
            if p.startswith('AB'): p = '15' + p[2:]
            data["partida_registral"] = p

        # --- 4. Certificado ---
        cert_search = re.search(r'N[°º\s\-]+([A-Z0-9]{8,15})', clean_text_full, re.IGNORECASE)
        if cert_search: data["certificado_vehicular"] = cert_search.group(1)

        return data

ocr_service = OCRService()
