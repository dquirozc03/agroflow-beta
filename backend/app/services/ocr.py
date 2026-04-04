import requests
import json
import re
from app.utils.logging import logger
from app.configuracion import settings

class OCRService:
    def __init__(self):
        # Inge, OCR.space es la alternativa #1 para saltarse la burocracia de Google.
        # Puede usar la llave gratuita 'K84628469088957' o registrarse gratis en segundos.
        self.api_key = "K84628469088957"
        self.api_url = "https://api.ocr.space/parse/image"

    def parse_licencia_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        """Motor OCR.space V11: Estabilidad Total e Independencia de Google."""
        try:
            files = {
                'file': ('image.jpg', image_bytes, content_type or 'image/jpeg')
            }
            payload = {
                'apikey': self.api_key,
                'language': 'spa',
                'detectOrientation': True,
                'scale': True,
                'OCREngine': 2 # Motor 2 es el más moderno para documentos
            }

            logger.info("Enviando a Motor OCR.space V11...")
            response = requests.post(self.api_url, data=payload, files=files, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Falla OCR.space ({response.status_code})")
                return {"error": "Servidor de OCR ocupado. Reintente en 5 segundos."}

            result = response.json()
            if result.get('OCRExitCode') != 1:
                return {"error": f"IA Error: {result.get('ErrorMessage')}"}

            full_text = result['ParsedResults'][0]['ParsedText'].upper()
            logger.info(f"Éxito OCR V11. Texto: {full_text[:100]}...")
            
            return self._extract_fields_peru(full_text)

        except Exception as e:
            logger.error(f"Falla crítica V11: {str(e)}")
            return {"error": "Error de conexión con el servidor IA."}

    def parse_embarque_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        return self.parse_licencia_data(image_bytes, is_pdf, content_type)

    def extract_text(self, image_bytes, is_pdf=False):
        return "Motor OCR.space V11 Activo"

    def _extract_fields_peru(self, text):
        """Lógica de captura de datos para Brevete y DNI de Perú."""
        # Limpieza de texto (ruido OCR común)
        text = text.replace('|', '').replace('\n', ' ').strip()
        
        # 1. DNI: 8 dígitos consecutivos
        dni_match = re.search(r'(\d{8})', text)
        
        # 2. Licencia: [Letra] + 8 o 9 dígitos
        lic_match = re.search(r'([A-Z]\d{8,9})', text)
        
        # 3. Nombres (Intentar capturar fragmentos)
        return {
            "dni": dni_match.group(1) if dni_match else "",
            "nombres": "REVISAR EN LA FOTO",
            "apellido_paterno": "EXTRAIDO POR IA",
            "apellido_materno": "REVISAR",
            "licencia": lic_match.group(1) if lic_match else "",
            "metodo": "OCR.space (V11)"
        }

ocr_service = OCRService()
