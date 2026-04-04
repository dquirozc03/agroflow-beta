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
            # Configuración de seguridad: Permitir todo para documentos operativos
            self.safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]
            logger.info("IA Gemini 1.5 Flash (V3-Secure-Bypass) lista.")
        else:
            logger.error("No se detectó GOOGLE_API_KEY en la configuración.")
            self.model = None

    def _get_image_from_bytes(self, image_bytes, is_pdf=False):
        try:
            if is_pdf:
                images = convert_from_bytes(image_bytes)
                return images[0] if images else None
            else:
                img = Image.open(io.BytesIO(image_bytes))
                logger.info(f"Imagen preparada para IA: {img.size} px")
                return img
        except Exception as e:
            logger.error(f"Error procesando imagen: {e}")
            return None

    def _call_gemini(self, image, prompt):
        if not self.model or not image: 
            logger.error("Modelo o imagen no disponibles para la llamada.")
            return None
        try:
            # Llamada con settings de seguridad relajados para documentos
            response = self.model.generate_content(
                [prompt, image],
                safety_settings=self.safety_settings
            )
            
            if not response or not response.candidates:
                logger.warning("Gemini no devolvió candidatos (posible bloqueo de seguridad).")
                return None
                
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error crítico en Gemini API: {str(e)}")
            return f"ERROR_IA: {str(e)}"

    def parse_licencia_data(self, image_bytes, is_pdf=False):
        image = self._get_image_from_bytes(image_bytes, is_pdf)
        prompt = (
            "Eres el motor de identidad de Agroflow. De esta Licencia de Conducir Peruana (MTC), extrae: "
            "1. nombres, 2. apellido_paterno, 3. apellido_materno, 4. dni, 5. licencia. "
            "Responde ÚNICAMENTE un objeto JSON plano. "
            'Estructura: {"dni": "...", "nombres": "...", "apellido_paterno": "...", "apellido_materno": "...", "licencia": "..."}'
        )
        raw_response = self._call_gemini(image, prompt)
        
        if not raw_response or "ERROR_IA" in raw_response:
             logger.error(f"IA no pudo responder: {raw_response}")
             return {}
             
        logger.info(f"IA Respuesta Raw (V3): {raw_response}")
        return self._clean_json(raw_response)

    def parse_embarque_data(self, image_bytes, is_pdf=False):
        image = self._get_image_from_bytes(image_bytes, is_pdf)
        prompt = (
            "Extrae DAM y Número de Contenedor. Responde solo JSON. "
            'Estructura: {"dam": "...", "contenedor": "..."}'
        )
        raw_response = self._call_gemini(image, prompt)
        return self._clean_json(raw_response)

    def extract_text(self, image_bytes, is_pdf=False):
        image = self._get_image_from_bytes(image_bytes, is_pdf)
        prompt = "Extract text from image."
        return self._call_gemini(image, prompt) or ""

    def _clean_json(self, text):
        if not text: return {}
        try:
            # Limpieza agresiva de bloques de código
            clean_text = re.sub(r'```[a-z]*\s*', '', text).replace('```', '').strip()
            
            start = clean_text.find('{')
            end = clean_text.rfind('}') + 1
            if start != -1 and end != 0:
                clean_text = clean_text[start:end]
            
            data = json.loads(clean_text)
            
            # Normalización
            normalized = {}
            for k, v in data.items():
                key = k.lower().replace(" ", "_")
                normalized[key] = str(v).upper() if v else None
            
            # Asegurar mapeo de apellidos si Gemini los unió
            if "apellidos" in normalized and not normalized.get("apellido_paterno"):
                aps = str(normalized["apellidos"]).split()
                if len(aps) >= 1: normalized["apellido_paterno"] = aps[0]
                if len(aps) >= 2: normalized["apellido_materno"] = aps[1]

            return normalized
        except Exception as e:
            logger.warning(f"Falla parseo JSON V3: {e}. Texto: {text}")
            return {}

ocr_service = OCRService()
