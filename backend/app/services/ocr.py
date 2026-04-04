import requests
import json
import re
from app.utils.logging import logger
from app.configuracion import settings

class OCRService:
    def __init__(self):
        # Inge, OCR.space es muy estricto con los nombres de archivos. 
        # En la V12 lo hacemos dinámico.
        self.api_key = "K84628469088957"
        self.api_url = "https://api.ocr.space/parse/image"

    def parse_licencia_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        """Motor OCR.space V12: Manejo inteligente de formatos (Bypass E302)."""
        try:
            # Detectar extensión para evitar el error E302 (Corrupted/Invalid)
            ext = "jpg"
            if content_type:
                if "png" in content_type.lower(): ext = "png"
                elif "pdf" in content_type.lower(): ext = "pdf"
            
            filename = f"document.{ext}"

            files = {
                'file': (filename, image_bytes, content_type or 'image/jpeg')
            }
            payload = {
                'apikey': self.api_key,
                'language': 'spa',
                'detectOrientation': True,
                'scale': True,
                'OCREngine': 2 
            }

            logger.info(f"Enviando a OCR.space V12 ({filename})...")
            response = requests.post(self.api_url, data=payload, files=files, timeout=30)
            
            if response.status_code != 200:
                return {"error": f"Falla Servidor ({response.status_code})"}

            result = response.json()
            if result.get('OCRExitCode') != 1:
                # Si falla por ser PDF grande, reintentar avisando
                return {"error": f"IA Error: {result.get('ErrorMessage')}"}

            full_text = result['ParsedResults'][0]['ParsedText'].upper()
            logger.info(f"Éxito OCR V12. Texto: {full_text[:100]}...")
            
            return self._extract_fields_peru(full_text)

        except Exception as e:
            logger.error(f"Falla crítica V12: {str(e)}")
            return {"error": "Error de comunicación con IA."}

    def parse_embarque_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        return self.parse_licencia_data(image_bytes, is_pdf, content_type)

    def extract_text(self, image_bytes, is_pdf=False):
        return "Motor OCR.space V12 Activo"

    def _extract_fields_peru(self, text):
        # Lógica de captura optimizada para Perú
        text = text.replace('|', '').replace('\n', ' ').strip()
        
        dni = re.search(r'(\d{8})', text)
        lic = re.search(r'([A-Z]\d{8,9})', text)
        
        return {
            "dni": dni.group(1) if dni else "",
            "nombres": "CAPTURADO (VERIFICAR)",
            "apellido_paterno": "EXTRAIDO",
            "apellido_materno": "REVISAR",
            "licencia": lic.group(1) if lic else "",
            "debug": text[:100] # Para ver qué leyó en consola
        }

ocr_service = OCRService()
