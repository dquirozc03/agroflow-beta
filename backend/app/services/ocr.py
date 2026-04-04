import google.generativeai as genai
import json
import re
from app.utils.logging import logger
from app.configuracion import settings

class OCRService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self._setup()

    def _setup(self):
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("Motor IA Gemini (V4-Indestructible) inicializado.")
        else:
            self.model = None

    def parse_licencia_data(self, image_bytes, is_pdf=False, mime_type="image/jpeg"):
        """Extracción directa enviando datos crudos a Google."""
        if not self.api_key:
             return {"error": "API Key no configurada"}
            
        # Re-check de configuración por si cambió en caliente
        if not hasattr(self, 'model') or not self.model:
            self._setup()

        prompt = (
            "Eres el motor de identidad de Agroflow. Analiza esta imagen de Licencia MTC Peruana. "
            "Extrae: nombres, apellido_paterno, apellido_materno, dni, licencia. "
            "Responde ÚNICAMENTE un objeto JSON plano. "
            "No uses markdown, no digas nada más. "
            'Estructura: {"dni": "...", "nombres": "...", "paterno": "...", "materno": "...", "licencia": "..."}'
        )

        try:
            # Enviamos como diccionario de bytes directamente (Más robusto que Pillow en Render)
            image_data = {
                "mime_type": "application/pdf" if is_pdf else mime_type,
                "data": image_bytes
            }
            
            response = self.model.generate_content([prompt, image_data])
            
            if not response or not response.text:
                logger.error("IA devolvió respuesta vacía o bloqueada.")
                return {}

            raw_text = response.text.strip()
            logger.info(f"IA Respuesta Raw (V4): {raw_text}")
            return self._clean_json(raw_text)

        except Exception as e:
            logger.error(f"Fallo crítico en OCR Gemini V4: {str(e)}")
            return {"error": str(e)}

    def parse_embarque_data(self, image_bytes, is_pdf=False):
        """Especializado para DAM y Contenedor."""
        image_data = {"mime_type": "application/pdf" if is_pdf else "image/jpeg", "data": image_bytes}
        prompt = 'Extrae DAM (formato 000-0000-00-000000) y Contenedor (4 letras 7 números). JSON: {"dam": "...", "contenedor": "..."}'
        try:
            response = self.model.generate_content([prompt, image_data])
            return self._clean_json(response.text)
        except: return {}

    def extract_text(self, image_bytes, is_pdf=False):
        image_data = {"mime_type": "application/pdf" if is_pdf else "image/jpeg", "data": image_bytes}
        try:
            response = self.model.generate_content(["Extrae texto", image_data])
            return response.text
        except: return ""

    def _clean_json(self, text):
        if not text: return {}
        try:
            # Extraer solo lo que está entre llaves
            match = re.search(r'(\{.*\})', text.replace('\n', ''), re.DOTALL)
            if not match: return {}
            
            data = json.loads(match.group(1))
            
            # Normalización estándar para Agroflow
            normalized = {
                "dni": str(data.get("dni", "")).strip(),
                "nombres": str(data.get("nombres", "")).strip().upper(),
                "apellido_paterno": str(data.get("paterno", data.get("apellido_paterno", ""))).strip().upper(),
                "apellido_materno": str(data.get("materno", data.get("apellido_materno", ""))).strip().upper(),
                "licencia": str(data.get("licencia", data.get("brevete", ""))).strip().upper()
            }
            return normalized
        except Exception as e:
            logger.warning(f"Error parseando JSON IA: {e}")
            return {}

ocr_service = OCRService()
