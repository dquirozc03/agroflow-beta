import requests
import json
import re
import base64
from app.utils.logging import logger
from app.configuracion import settings

class OCRService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY.strip() if settings.GOOGLE_API_KEY else None
        # Usamos V1 (Estable) por defecto para evitar exigencias de facturación de la Beta
        self.api_url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"

    def parse_licencia_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        """Versión REST V7.1: Simplificada para máxima compatibilidad y gratuidad."""
        if not self.api_key:
            return {"error": "API Key no configurada."}

        prompt = (
            "Analiza esta Licencia de Conducir Peruana y extrae en formato JSON: "
            "dni, nombres, apellido_paterno, apellido_materno, licencia. "
            "Responde solo el objeto JSON plano, sin markdown."
        )

        try:
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": "application/pdf" if is_pdf else (content_type or "image/jpeg"),
                                    "data": base64.b64encode(image_bytes).decode('utf-8')
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 800
                    # Eliminado responseMimeType para evitar el error 400
                }
            }

            url = f"{self.api_url}?key={self.api_key}"
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code != 200:
                return {"error": f"Google Error ({response.status_code}): {response.text[:200]}"}

            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                text = data['candidates'][0]['content']['parts'][0]['text']
                logger.info(f"IA Respuesta: {text[:100]}...")
                return self._clean_json(text)
            
            return {"error": "No se obtuvo respuesta de la IA."}

        except Exception as e:
            logger.error(f"Error OCR REST V7.1: {str(e)}")
            return {"error": f"Fallo de sistema: {str(e)}"}

    def parse_embarque_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        return self.parse_licencia_data(image_bytes, is_pdf, content_type)

    def extract_text(self, image_bytes, is_pdf=False):
        return "Servicio V7.1 activo."

    def _clean_json(self, text):
        try:
            # Limpieza robusta de la respuesta de texto a JSON
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
