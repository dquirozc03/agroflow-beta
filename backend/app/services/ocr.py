import google.generativeai as genai
from PIL import Image
import io
import json
import re
from app.utils.logging import logger
from app.configuracion import settings
from pdf2image import convert_from_bytes

class OCRService:
    def __init__(self):
        # Configurar Gemini 1.5 Flash
        self.api_key = settings.GOOGLE_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("IA Gemini 1.5 Flash (V2-Refined) lista.")
        else:
            logger.error("No se encontró GOOGLE_API_KEY.")
            self.model = None

    def _get_image_from_bytes(self, image_bytes, is_pdf=False):
        try:
            if is_pdf:
                images = convert_from_bytes(image_bytes)
                return images[0] if images else None
            else:
                return Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            logger.error(f"Error procesando imagen: {e}")
            return None

    def _call_gemini(self, image, prompt):
        if not self.model or not image: return None
        try:
            response = self.model.generate_content([prompt, image])
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error Gemini API: {e}")
            return None

    def parse_licencia_data(self, image_bytes, is_pdf=False):
        """Versión Refinada para extraer nombres y apellidos con máxima prioridad."""
        image = self._get_image_from_bytes(image_bytes, is_pdf)
        prompt = (
            "Eres el motor de identidad de Agroflow. De esta Licencia de Conducir Peruana (MTC), extrae: "
            "1. nombres (todos), 2. apellido_paterno, 3. apellido_materno, 4. dni (8 dígitos), 5. licencia. "
            "IMPORTANTE: El apellido paterno y materno suelen estar juntos bajo la etiqueta 'APELLIDOS'. "
            "SEPÁRALOS CORRECTAMENTE. "
            "Responde ÚNICAMENTE un objeto JSON plano. "
            'Estructura obligatoria: {"dni": "...", "nombres": "...", "apellido_paterno": "...", "apellido_materno": "...", "licencia": "..."}'
        )
        raw_response = self._call_gemini(image, prompt)
        logger.info(f"IA Respuesta Raw: {raw_response}") # Log para auditoría
        return self._clean_json(raw_response)

    def parse_embarque_data(self, image_bytes, is_pdf=False):
        image = self._get_image_from_bytes(image_bytes, is_pdf)
        prompt = (
            "Identifica DAM y Número de Contenedor. Responde solo JSON. "
            'Estructura: {"dam": "...", "contenedor": "..."}'
        )
        raw_response = self._call_gemini(image, prompt)
        return self._clean_json(raw_response)

    def extract_text(self, image_bytes, is_pdf=False):
        image = self._get_image_from_bytes(image_bytes, is_pdf)
        prompt = "Extrae todo el texto de la imagen."
        return self._call_gemini(image, prompt) or ""

    def _clean_json(self, text):
        if not text: return {}
        try:
            # Eliminar basura de markdown
            clean_text = text.replace('```json', '').replace('```', '').strip()
            # Buscar el primer { y el último } por si la IA agregó texto extra
            start = clean_text.find('{')
            end = clean_text.rfind('}') + 1
            if start != -1 and end != 0:
                clean_text = clean_text[start:end]
            
            data = json.loads(clean_text)
            
            # Normalización de llaves (por si Gemini usa sinónimos)
            normalized = {}
            mapping = {
                "dni": "dni", "documento": "dni",
                "nombres": "nombres", "nombre": "nombres",
                "apellido_paterno": "apellido_paterno", "paterno": "apellido_paterno",
                "apellido_materno": "apellido_materno", "materno": "apellido_materno",
                "licencia": "licencia", "brevete": "licencia"
            }
            
            for k, v in data.items():
                key = k.lower().replace(" ", "_")
                if key in mapping:
                    normalized[mapping[key]] = str(v).upper() if v else None
                else:
                    normalized[key] = str(v).upper() if v else None
            
            return normalized
        except Exception as e:
            logger.warning(f"Falla parseo JSON: {e}")
            return {}

ocr_service = OCRService()
