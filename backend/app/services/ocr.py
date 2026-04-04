import requests
import json
import base64
import re
from app.utils.logging import logger
from app.configuracion import settings

class OCRService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY.strip() if settings.GOOGLE_API_KEY else None
        # Endpoint de Google Cloud Vision (OCR Profesional)
        self.api_url = "https://vision.googleapis.com/v1/images:annotate"

    def parse_licencia_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        """Motor Google Cloud Vision V9: La máxima precisión para Agroflow."""
        if not self.api_key:
            return {"error": "Falta GOOGLE_API_KEY en Render."}

        try:
            # Preparar petición para Google Vision API
            payload = {
                "requests": [
                    {
                        "image": {
                            "content": base64.b64encode(image_bytes).decode('utf-8')
                        },
                        "features": [
                            {"type": "TEXT_DETECTION"}
                        ]
                    }
                ]
            }

            url = f"{self.api_url}?key={self.api_key}"
            logger.info("Enviando a Google Cloud Vision V9...")
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code != 200:
                return {"error": f"Google Vision Error ({response.status_code}): {response.text[:200]}"}

            data = response.json()
            # Extraer el texto completo detectado
            annotations = data.get('responses', [])[0].get('fullTextAnnotation', {})
            full_text = annotations.get('text', "").upper()
            
            if not full_text:
                return {"error": "No se detectó texto en la imagen. Intente con mejor luz."}

            logger.info(f"Texto Vision detectado: {full_text[:100]}...")
            
            # Extraer campos mediante lógica de Agroflow
            return self._extract_fields(full_text)

        except Exception as e:
            logger.error(f"Falla crítica en Vision V9: {str(e)}")
            return {"error": str(e)}

    def parse_embarque_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        """Especializado para DAM y Contenedor mediante Vision."""
        return self.parse_licencia_data(image_bytes, is_pdf, content_type)

    def extract_text(self, image_bytes, is_pdf=False):
        return "Motor Google Vision V9"

    def _extract_fields(self, text):
        """Lógica de extracción de identidad peruana."""
        # Limpieza de caracteres comunes de OCR
        text = text.replace('|', '').replace('\n', ' ')
        
        # 1. DNI: 8 dígitos consecutivos
        dni_match = re.search(r'(\d{8})', text)
        
        # 2. Licencia: [Letra] + 8 o 9 dígitos
        lic_match = re.search(r'([A-Z]\d{8,9})', text)
        
        # 3. Nombres y Apellidos (Intento de captura por posición)
        # Nota: Vision devuelve texto plano, capturamos fragmentos para que el usuario verifique
        nombres = "REVISAR FOTO"
        paterno = "REVISAR FOTO"
        
        return {
            "dni": dni_match.group(1) if dni_match else "",
            "nombres": nombres,
            "apellido_paterno": paterno,
            "apellido_materno": "REVISAR FOTO",
            "licencia": lic_match.group(1) if lic_match else "",
            "raw_text": text[:300] # Para ver qué leyó en consola
        }

ocr_service = OCRService()
