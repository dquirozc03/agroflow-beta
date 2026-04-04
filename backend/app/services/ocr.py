import google.generativeai as genai
import json
import re
from app.utils.logging import logger
from app.configuracion import settings

class OCRService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self.model_name = 'models/gemini-1.5-flash' # Prefijo models/ para evitar 404
        self.model = None
        self._setup()

    def _setup(self):
        if not self.api_key:
            return

        try:
            genai.configure(api_key=self.api_key.strip())
            
            # Auto-detección de modelos disponibles para evitar errores 404
            try:
                available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
                logger.info(f"Modelos disponibles: {available_models}")
                
                # Probar nombres conocidos
                for candidate in ['models/gemini-1.5-flash', 'models/gemini-1.5-pro']:
                    if candidate in available_models:
                        self.model_name = candidate
                        break
            except Exception as e:
                logger.warning(f"Error listando modelos: {e}")

            self.model = genai.GenerativeModel(self.model_name)
            logger.info(f"IA configurada con: {self.model_name}")
        except Exception as e:
            logger.error(f"Error setup IA: {e}")
            self.model = None

    def parse_licencia_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        if not self.model: self._setup()
        if not self.model: return {"error": "IA no disponible"}

        prompt = "Extrae de este brevete Peruano: nombres, apellido_paterno, apellido_materno, dni, licencia. JSON plano."
        try:
            mime = "application/pdf" if is_pdf else (content_type or "image/jpeg")
            response = self.model.generate_content([prompt, {"mime_type": mime, "data": image_bytes}])
            return self._clean_json(response.text)
        except Exception as e:
            if "404" in str(e): self.model = None
            return {"error": str(e)}

    def parse_embarque_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        if not self.model: self._setup()
        try:
            mime = "application/pdf" if is_pdf else (content_type or "image/jpeg")
            prompt = 'Extrae DAM y Contenedor. JSON: {"dam": "...", "contenedor": "..."}'
            response = self.model.generate_content([prompt, {"mime_type": mime, "data": image_bytes}])
            return self._clean_json(response.text)
        except Exception as e: return {"error": str(e)}

    def extract_text(self, image_bytes, is_pdf=False):
        if not self.model: self._setup()
        try:
            mime = "application/pdf" if is_pdf else "image/jpeg"
            response = self.model.generate_content(["Texto íntegro", {"mime_type": mime, "data": image_bytes}])
            return response.text
        except: return ""

    def _clean_json(self, text):
        try:
            match = re.search(r'(\{.*\})', text.replace('\n', ' '), re.DOTALL)
            if not match: return {}
            data = json.loads(match.group(1))
            return {
                "dni": str(data.get("dni", "") or "").strip(),
                "nombres": str(data.get("nombres", "") or "").strip().upper(),
                "apellido_paterno": str(data.get("apellido_paterno", data.get("paterno", ""))).strip().upper(),
                "apellido_materno": str(data.get("apellido_materno", data.get("materno", ""))).strip().upper(),
                "licencia": str(data.get("licencia", data.get("brevete", ""))).strip().upper()
            }
        except: return {}

ocr_service = OCRService()
