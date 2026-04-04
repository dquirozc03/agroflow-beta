import requests
import json
import re
import base64
from app.utils.logging import logger
from app.configuracion import settings

class OCRService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY.strip() if settings.GOOGLE_API_KEY else None
        # Lista exhaustiva de variantes para vencer al 404
        self.models = [
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-pro-vision"
        ]

    def parse_licencia_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        """Versión Universal (V7.3): Intenta v1 y v1beta con todas las variantes de modelo."""
        if not self.api_key:
            return {"error": "API Key no configurada."}

        prompt = (
            "Extracción de datos de Licencia MTC Perú. Responde ÚNICAMENTE en JSON: "
            "dni, nombres, apellido_paterno, apellido_materno, licencia."
        )

        img_b64 = base64.b64encode(image_bytes).decode('utf-8')
        mime = "application/pdf" if is_pdf else (content_type or "image/jpeg")

        errors = []
        # Probamos primero con v1 (más estable para facturación activa)
        # y luego con v1beta
        for version in ["v1", "v1beta"]:
            for model in self.models:
                try:
                    url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={self.api_key}"
                    
                    payload = {
                        "contents": [{"parts": [{"text": prompt}, {"inline_data": {"mime_type": mime, "data": img_b64}}]}],
                        "generationConfig": {"temperature": 0.1}
                    }

                    response = requests.post(url, json=payload, timeout=15)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if 'candidates' in data and len(data['candidates']) > 0:
                            text = data['candidates'][0]['content']['parts'][0]['text']
                            logger.info(f"Éxito con {version}/{model}!")
                            return self._clean_json(text)
                    
                    errors.append(f"{version}/{model}: {response.status_code}")

                except Exception as e:
                    errors.append(f"Falla {version}/{model}: {str(e)}")

        return {"error": "Google no encontró modelos disponibles en su cuenta.", "detalles": errors}

    def parse_embarque_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        return self.parse_licencia_data(image_bytes, is_pdf, content_type)

    def extract_text(self, image_bytes, is_pdf=False):
        return "Srv V7.3 Activo"

    def _clean_json(self, text):
        try:
            clean_text = text.replace('```json', '').replace('```', '').strip()
            match = re.search(r'(\{.*\})', clean_text.replace('\n', ' '), re.DOTALL)
            json_str = match.group(1) if match else clean_text
            data = json.loads(json_str)
            return {
                "dni": str(data.get("dni", "")).strip(),
                "nombres": str(data.get("nombres", "")).strip().upper(),
                "apellido_paterno": str(data.get("apellido_paterno", data.get("paterno", ""))).strip().upper(),
                "apellido_materno": str(data.get("apellido_materno", data.get("materno", ""))).strip().upper(),
                "licencia": str(data.get("licencia", data.get("brevete", ""))).strip().upper()
            }
        except: return {}

ocr_service = OCRService()
