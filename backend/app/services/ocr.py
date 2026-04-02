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
        # Configurar Gemini 1.5 Flash (Optimizado para Velocidad y Visión)
        self.api_key = settings.GOOGLE_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            logger.info("Cerebro IA Gemini 1.5 Flash configurado exitosamente.")
        else:
            logger.error("CRÍTICO: No se detectó GOOGLE_API_KEY. El motor de IA fallará.")
            self.model = None

    def _get_image_from_bytes(self, image_bytes, is_pdf=False):
        """Convierte bytes (Imagen o PDF) a una imagen de Pillow para Gemini."""
        try:
            if is_pdf:
                # Si es PDF, tomamos la primera página para el OCR
                images = convert_from_bytes(image_bytes)
                return images[0] if images else None
            else:
                return Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            logger.error(f"Error al procesar imagen/pdf: {e}")
            return None

    def _call_gemini(self, image, prompt):
        """Llamada base al modelo de visión."""
        if not self.model or not image:
            return None
        
        try:
            response = self.model.generate_content([prompt, image])
            return response.text.strip()
        except Exception as e:
            logger.error(f"Fallo en llamada a Gemini API: {e}")
            return None

    def extract_text(self, image_bytes, is_pdf=False):
        """Fallback para obtener texto plano de cualquier documento."""
        image = self._get_image_from_bytes(image_bytes, is_pdf)
        prompt = "Actúa como un OCR de alta precisión. Extrae todo el texto legible de esta imagen. No añadas comentarios, solo el texto extraído."
        return self._call_gemini(image, prompt) or ""

    def parse_licencia_data(self, image_bytes, is_pdf=False):
        """Especializado para Licencias de Conducir (Brevete) MTC."""
        image = self._get_image_from_bytes(image_bytes, is_pdf)
        prompt = (
            "Actúa como experto en logística de Agroflow. De esta Licencia de Conducir (Brevete/LICENCIA MTC), "
            "extrae EXACTAMENTE: nombres, apellido_paterno, apellido_materno, dni y numero_licencia. "
            "Responde ÚNICAMENTE en JSON plano. Si no detectas un campo, ponlo como null. "
            'Estructura: {"dni": "...", "nombres": "...", "apellido_paterno": "...", "apellido_materno": "...", "licencia": "..."}'
        )
        raw_response = self._call_gemini(image, prompt)
        return self._clean_json(raw_response)

    def parse_embarque_data(self, image_bytes, is_pdf=False):
        """Especializado para Control de Embarque (DAM y Contenedor)."""
        image = self._get_image_from_bytes(image_bytes, is_pdf)
        prompt = (
            "Identifica en este documento logístico el número de DAM (Declaración Aduanera de Mercancías) "
            "y el NÚMERO DE CONTENEDOR (4 letras + 7 números). Responde solo JSON plano. "
            'Estructura: {"dam": "...", "contenedor": "..."}'
        )
        raw_response = self._call_gemini(image, prompt)
        return self._clean_json(raw_response)

    def _clean_json(self, text):
        """Limpia el markdown y extrae el objeto JSON de la respuesta de la IA."""
        if not text: return {}
        try:
            # Eliminar bloques markdown ```json ... ```
            clean_text = re.sub(r'```json\s*|\s*```', '', text).strip()
            return json.loads(clean_text)
        except Exception as e:
            logger.warning(f"Error parseando JSON de Gemini: {e}. Texto crudo: {text}")
            # Intentar extracción por regex de último recurso
            match = re.search(r'(\{.*\})', text, re.DOTALL)
            if match:
                try: return json.loads(match.group(1))
                except: pass
            return {}

ocr_service = OCRService()
