import requests
import json
import re
import base64
from app.utils.logging import logger
from app.configuracion import settings

class OCRService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY.strip() if settings.GOOGLE_API_KEY else None
        # Probamos con la versión V1 (Estable) por defecto
        self.api_url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"

    def parse_licencia_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        """Versión REST Purista (V7): Evita errores de librería de Google."""
        if not self.api_key:
            return {"error": "API Key no configurada en el servidor."}

        prompt = (
            "Eres el motor de identidad de Agroflow. Analiza esta Licencia de Conducir Peruana. "
            "Extrae en JSON: nombres, apellido_paterno, apellido_materno, dni, licencia. "
            "Responde solo el objeto JSON, nada más."
        )

        try:
            # Preparar el cuerpo de la petición (Formato Google REST)
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
                    "topP": 0.95,
                    "topK": 40,
                    "maxOutputTokens": 1024,
                    "responseMimeType": "application/json"
                }
            }

            # Llamada directa a Google (Sin líbrerías intermedias)
            response = requests.post(f"{self.api_url}?key={self.api_key}", json=payload, timeout=30)
            
            # Auditoría de logs
            logger.info(f"Google REST Status: {response.status_code}")
            
            if response.status_code != 200:
                # Si V1 falla (404), intentamos V1BETA como fallback automático
                if response.status_code == 404:
                    logger.warning("V1 falló con 404, reintentando con V1BETA...")
                    alt_url = self.api_url.replace("/v1/", "/v1beta/")
                    response = requests.post(f"{alt_url}?key={self.api_key}", json=payload, timeout=30)
                
                if response.status_code != 200:
                    return {"error": f"Error Google ({response.status_code}): {response.text[:200]}"}

            # Procesar respuesta
            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                text = data['candidates'][0]['content']['parts'][0]['text']
                return self._clean_json(text)
            
            return {"error": "La IA no devolvió candidatos válidos."}

        except Exception as e:
            logger.error(f"Error OCR REST V7: {str(e)}")
            return {"error": f"Fallo de conexión: {str(e)}"}

    def parse_embarque_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        """Análogo para embarques."""
        # Se podría unificar, pero mantenemos compatibilidad de firma
        return self.parse_licencia_data(image_bytes, is_pdf, content_type)

    def extract_text(self, image_bytes, is_pdf=False):
        # Mantenemos para compatibilidad de firma si se usa en otros routers
        return "Texto extraído mediante motor V7 rest."

    def _clean_json(self, text):
        try:
            # Gemini con responseMimeType suele devolver JSON limpio, pero cubrimos casos extraños
            match = re.search(r'(\{.*\})', text.replace('\n', ' '), re.DOTALL)
            data = json.loads(match.group(1)) if match else json.loads(text)
            
            return {
                "dni": str(data.get("dni", data.get("documento", ""))).strip(),
                "nombres": str(data.get("nombres", data.get("nombre", ""))).strip().upper(),
                "apellido_paterno": str(data.get("apellido_paterno", data.get("paterno", ""))).strip().upper(),
                "apellido_materno": str(data.get("apellido_materno", data.get("materno", ""))).strip().upper(),
                "licencia": str(data.get("licencia", data.get("brevete", data.get("numero_licencia", "")))).strip().upper()
            }
        except: return {}

ocr_service = OCRService()
