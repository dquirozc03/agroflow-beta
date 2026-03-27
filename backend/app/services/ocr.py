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
        """Heurística de alta precisión para MTC: Filtra etiquetas irrelevantes."""
        def fix_ocr_errors(t):
            return t.replace('O', '0').replace('o', '0').replace('I', '1').replace('i', '1').replace('l', '1').replace('S', '5').replace('B', '8')

        data = {
            "nombre_transportista": None,
            "ruc": None,
            "partida_registral": None,
            "certificado_vehicular": None,
            "placa": None
        }

        lines = [l.strip() for l in text.split('\n') if len(l.strip()) > 3]
        clean_text_full = " ".join(lines)

        # --- 1. Buscador de RUC (Prioridad: el que sigue a la palabra RUC) ---
        ruc_search = re.search(r'RUC[:\s\-]*([0-9\sOlI]{11,15})', clean_text_full, re.IGNORECASE)
        if ruc_search:
            raw_ruc = re.sub(r'[^0-9OolISsB]', '', ruc_search.group(1))
            fixed_ruc = fix_ocr_errors(raw_ruc)
            if len(fixed_ruc) >= 11:
                data["ruc"] = fixed_ruc[:11]
        
        if not data["ruc"]:
            all_digits = re.sub(r'[^0-9]', '', clean_text_full[50:]) 
            ruc_matches = re.findall(r'(?:10|20)\d{9}', all_digits)
            if ruc_matches: data["ruc"] = ruc_matches[0]

        # --- 2. Razón Social (Excluimos Modalidad/Sustento) ---
        empresa_patterns = [r'S\.?A\.?C\.?', r'S\.?A\.?$', r'S\.?R\.?L\.?', r'E\.?I\.?R\.?L\.?', r'LOGISTIC', r'TRANSPORT', r'INVERSIONES']
        exclude_words = ["MODALIDAD", "SUSTENTO", "VIGENTE", "DOCUMENTO", "HASTA", "DESDE"]
        
        for line in lines:
            line_up = line.upper()
            if any(word in line_up for word in exclude_words):
                continue
                
            if any(re.search(p, line_up) for p in empresa_patterns) or "SOCIAL" in line_up:
                name = re.sub(r'^(?:NOMBRE|RAZON|SOCIAL|DEL|TRANSPORTISTA)[:\s\-]*', '', line, flags=re.IGNORECASE).strip()
                if len(name) > 4:
                    data["nombre_transportista"] = name
                    break

        # --- 3. Partida ---
        partida_match = re.search(r'PARTIDA\s*(?:REGISTRAL)?[:\s\-]*([A-Z0-9]{8,12})', clean_text_full, re.IGNORECASE)
        if partida_match:
            data["partida_registral"] = partida_match.group(1)

        # --- 4. Certificado ---
        cert_match = re.search(r'N[°º\s\-]+([A-Z0-9]{8,15})', clean_text_full, re.IGNORECASE)
        if cert_match: data["certificado_vehicular"] = cert_match.group(1)

        # --- 5. Placa ---
        placa_match = re.search(r'([A-Z0-9]{3}[- ]?[A-Z0-9]{3})', clean_text_full)
        if placa_match:
            data["placa"] = re.sub(r'[^A-Z0-9]', '', placa_match.group(0))

        return data

ocr_service = OCRService()
