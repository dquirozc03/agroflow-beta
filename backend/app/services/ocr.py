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
        """Busca patrones específicos en el texto extraído con máxima flexibilidad."""
        # Limpieza inicial: eliminamos pipes y ruidos comunes de OCR en bordes
        clean_text = text.replace('|', '').replace('[', '').replace(']', '')
        
        data = {
            "nombre_transportista": None,
            "ruc": None,
            "partida_registral": None,
            "certificado_vehicular": None,
            "placa": None
        }

        # 1. Buscar RUC (11 dígitos) - Más agresivo: buscamos secuencias de dígitos que sumen 11
        # Primero quitamos espacios solo para la búsqueda de RUC
        digits_only = re.sub(r'\D', '', clean_text)
        ruc_matches = re.findall(r'(10|20)\d{9}', digits_only)
        if ruc_matches:
            # Reconstruimos el primer RUC encontrado (10/20 + los 9 dígitos capturados)
            # Nota: findall con grupos devuelve solo los grupos. Ajustamos:
            full_ruc_match = re.search(r'(10|20)\d{9}', digits_only)
            if full_ruc_match:
                data["ruc"] = full_ruc_match.group(0)

        # 2. Nombre del Transportista
        # El MTC pone: NOMBRE O RAZON SOCIAL [ESPACIOS] NOMBRE EMPRESA
        # O lo pone en la siguiente línea después de DEL TRANSPORTISTA
        lines = [l.strip() for l in clean_text.split('\n') if l.strip()]
        for i, line in enumerate(lines):
            if "RAZON SOCIAL" in line.upper() or "SOCIAL DEL" in line.upper():
                # Intentamos sacar lo que está a la derecha en la misma línea
                potential_name = re.sub(r'.*(?:SOCIAL|TRANSPORTISTA)[:\s\-]+', '', line, flags=re.IGNORECASE).strip()
                if len(potential_name) > 4:
                    data["nombre_transportista"] = potential_name
                    break
                # Si no hay nada a la derecha, probamos con la siguiente línea
                if i + 1 < len(lines):
                    data["nombre_transportista"] = lines[i+1].strip()
                    break

        # 3. Partida Registral
        partida_match = re.search(r'PARTIDA\s*REGISTRAL[:\s\-]+([A-Z0-9]+)', clean_text, re.IGNORECASE)
        if partida_match:
            data["partida_registral"] = partida_match.group(1)

        # 4. Certificado Vehicular
        cert_match = re.search(r'N[°º\s]+([A-Z0-9]{10,15})', clean_text, re.IGNORECASE)
        if cert_match:
            data["certificado_vehicular"] = cert_match.group(1)

        # 5. Placa
        placa_match = re.search(r'PLACA\s*N[°º\s]+([A-Z0-9]{3}[- ]?[A-Z0-9]{3})', clean_text, re.IGNORECASE)
        if placa_match:
            data["placa"] = re.sub(r'[^A-Z0-9]', '', placa_match.group(1).upper())

        return data

ocr_service = OCRService()
