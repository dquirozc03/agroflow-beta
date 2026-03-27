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
        """Extrae texto de bytes de imagen o PDF."""
        try:
            images = []
            if is_pdf:
                # Convertimos PDF a lista de imágenes
                images = convert_from_bytes(image_bytes)
            else:
                images = [Image.open(io.BytesIO(image_bytes))]

            full_text = ""
            for i, img in enumerate(images):
                logger.info(f"Procesando página/imagen {i+1}...")
                processed_img = self.preprocess_image(img)
                text = pytesseract.image_to_string(processed_img, config=self.config)
                full_text += text + "\n"
            
            logger.info(f"Texto extraído ({len(full_text)} caracteres)")
            return full_text
        except Exception as e:
            logger.error(f"Error en extracción de texto: {e}")
            return ""

    def parse_transportista_data(self, text):
        """Heurística avanzada para extraer datos sin depender de etiquetas fijas."""
        # Limpieza profunda
        clean_text = re.sub(r'[|\[\]]', '', text)
        lines = [l.strip() for l in clean_text.split('\n') if len(l.strip()) > 2]
        
        data = {
            "nombre_transportista": None,
            "ruc": None,
            "partida_registral": None,
            "certificado_vehicular": None,
            "placa": None
        }

        # --- 1. Buscador Heurístico de RUC (Cualquier bloque de 11 dígitos que empiece con 10 o 20) ---
        # Buscamos en el texto limpio total (quitando espacios y guiones)
        all_digits = re.sub(r'[^0-9]', '', clean_text)
        ruc_matches = re.findall(r'(?:10|20)\d{9}', all_digits)
        if ruc_matches:
            data["ruc"] = ruc_matches[0]

        # --- 2. Buscador Heurístico de Razón Social ---
        # Buscamos líneas que contengan siglas de empresas peruanas
        empresa_patterns = [r'S\.?A\.?C\.?', r'S\.?A\.?$', r'S\.?R\.?L\.?', r'E\.?I\.?R\.?L\.?', r'LOGISTICA', r'TRANSPORTES?']
        for line in lines:
            line_up = line.upper()
            if any(re.search(p, line_up) for p in empresa_patterns):
                # Si la línea tiene "RAZON SOCIAL", limpiamos el prefijo
                clean_line = re.sub(r'.*SOCIAL[:\s\-]*', '', line, flags=re.IGNORECASE).strip()
                # Si lo que queda es muy corto, tal vez el nombre está en la siguiente línea
                if len(clean_line) > 5:
                    data["nombre_transportista"] = clean_line
                    break

        # --- 3. Partida Registral (Heurística: línea que empieza con 15 o similar después de 'PARTIDA') ---
        partida_match = re.search(r'PARTIDA\s*(?:REGISTRAL)?[:\s\-]+([A-Z0-9]{8,12})', clean_text, re.IGNORECASE)
        if partida_match:
            data["partida_registral"] = partida_match.group(1)

        # --- 4. Certificado (N° + cadena de ~10-15 caracteres) ---
        cert_match = re.search(r'N[°º\s]+([A-Z0-9]{10,14})', clean_text, re.IGNORECASE)
        if cert_match:
            data["certificado_vehicular"] = cert_match.group(1)

        # --- 5. Placa (ABC-123 o ABC 123) ---
        placa_matches = re.findall(r'[A-Z0-9]{3}[- ]?[A-Z0-9]{3}', clean_text)
        for p in placa_matches:
            # Una placa suele tener 3 letras y 3 números (o similar)
            clean_p = re.sub(r'[^A-Z0-9]', '', p)
            if len(clean_p) == 6:
                data["placa"] = clean_p
                break

        return data

ocr_service = OCRService()
