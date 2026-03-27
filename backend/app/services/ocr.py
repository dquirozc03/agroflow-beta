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

    def preprocess_image(self, image):
        """Mejora la imagen para un mejor reconocimiento: escala de grises y umbralización."""
        # Convertir a arreglo numpy (OpenCV)
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Escala de grises
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Eliminar ruido (opcional, pero sirve para fotos de baja calidad)
        # gray = cv2.medianBlur(gray, 3)
        
        # Aplicar umbral adaptativo (hace el texto más negro y el fondo más blanco)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        
        return Image.fromarray(thresh)

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
            for img in images:
                processed_img = self.preprocess_image(img)
                text = pytesseract.image_to_string(processed_img, config=self.config)
                full_text += text + "\n"
            
            return full_text
        except Exception as e:
            logger.error(f"Error en extracción de texto: {e}")
            return ""

    def parse_transportista_data(self, text):
        """Busca patrones específicos en el texto extraído."""
        data = {
            "nombre_transportista": None,
            "ruc": None,
            "partida_registral": None,
            "certificado_vehicular": None,
            "placa": None,
            "marca": None,
            "dimensiones": {
                "largo": None,
                "ancho": None,
                "alto": None
            }
        }

        # 1. Buscar RUC (11 dígitos, usualmente empieza con 20)
        ruc_match = re.search(r'\b(10|20)\d{9}\b', text)
        if ruc_match:
            data["ruc"] = ruc_match.group(0)

        # 2. Buscar Certificado Vehicular (Patrón: N° 15M...)
        cert_match = re.search(r'N[°º]\s*([A-Z0-9]+)', text, re.IGNORECASE)
        if cert_match:
            data["certificado_vehicular"] = cert_match.group(1)

        # 3. Buscar Placa (Patrón: PLACA N° ABC123)
        placa_match = re.search(r'PLACA\s*N[°º]?\s*([A-Z0-9]{3}[- ]?[A-Z0-9]{3})', text, re.IGNORECASE)
        if placa_match:
            data["placa"] = re.sub(r'[^A-Z0-9]', '', placa_match.group(1).upper())

        # 4. Buscar Dimensiones (Patrón: LARGO (MTS.) 7.26)
        largo_match = re.search(r'LARGO\s*\(?MTS\.?\)?\s*(\d+[\.,]\d+)', text, re.IGNORECASE)
        ancho_match = re.search(r'ANCHO\s*\(?MTS\.?\)?\s*(\d+[\.,]\d+)', text, re.IGNORECASE)
        alto_match = re.search(r'ALTO\s*\(?MTS\.?\)?\s*(\d+[\.,]\d+)', text, re.IGNORECASE)

        if largo_match: data["dimensiones"]["largo"] = largo_match.group(1).replace(',', '.')
        if ancho_match: data["dimensiones"]["ancho"] = ancho_match.group(1).replace(',', '.')
        if alto_match: data["dimensiones"]["alto"] = alto_match.group(1).replace(',', '.')

        # 5. Nombre del Transportista (Usualmente está entre 'RAZON SOCIAL' y 'RUC')
        name_match = re.search(r'(?:NOMBRE O RAZ[OÓ]N SOCIAL|DEL TRANSPORTISTA)[:\s]+(.*?)(?:\n|RUC|PARTIDA)', text, re.IGNORECASE | re.DOTALL)
        if name_match:
            data["nombre_transportista"] = name_match.group(1).strip()

        # 6. Partida Registral
        partida_match = re.search(r'PARTIDA\s*REGISTRAL[:\s]+(\w+)', text, re.IGNORECASE)
        if partida_match:
            data["partida_registral"] = partida_match.group(1)

        return data

ocr_service = OCRService()
