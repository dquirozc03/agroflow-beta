import requests
import json
import base64
import re
from app.utils.logging import logger
from app.configuracion import settings

class OCRService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY.strip() if settings.GOOGLE_API_KEY else None
        self.vision_url = "https://vision.googleapis.com/v1/images:annotate"
        self.gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    def parse_licencia_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        """Motor Dual V10: Intenta Vision Expert y si falla (403/404) salta a Gemini."""
        if not self.api_key:
            return {"error": "Falta llave en Render."}

        # --- INTENTO 1: GOOGLE VISION ---
        try:
            logger.info("Probando Motor 1: Google Vision Expert...")
            v_payload = {"requests": [{"image": {"content": base64.b64encode(image_bytes).decode('utf-8')}, "features": [{"type": "TEXT_DETECTION"}]}]}
            v_res = requests.post(f"{self.vision_url}?key={self.api_key}", json=v_payload, timeout=15)
            
            if v_res.status_code == 200:
                data = v_res.json()
                text = data.get('responses', [])[0].get('fullTextAnnotation', {}).get('text', "").upper()
                if text:
                    logger.info("Éxito con Motor Vision!")
                    return self._extract_fields_regex(text)
            else:
                logger.warning(f"Vision falló ({v_res.status_code}). Saltando a Motor Gemini...")

        except Exception as e:
            logger.warning(f"Error en Vision: {str(e)}. Saltando a Gemini...")

        # --- INTENTO 2: GOOGLE GEMINI (EL CEREBRO) ---
        try:
            logger.info("Probando Motor 2: Google Gemini Flash...")
            img_b64 = base64.b64encode(image_bytes).decode('utf-8')
            g_payload = {
                "contents": [{"parts": [{"text": "Extrae JSON: dni, nombres, apellido_paterno, apellido_materno, licencia."}, {"inline_data": {"mime_type": content_type or "image/jpeg", "data": img_b64}}]}],
                "generationConfig": {"temperature": 0.1}
            }
            g_res = requests.post(f"{self.gemini_url}?key={self.api_key}", json=g_payload, timeout=15)
            
            if g_res.status_code == 200:
                text = g_res.json()['candidates'][0]['content']['parts'][0]['text']
                logger.info("Éxito con Motor Gemini!")
                return self._clean_gemini_json(text)
            
            return {"error": f"Ambos motores fallaron. Último error (Gemini): {g_res.status_code}", "detalles": g_res.text}

        except Exception as e:
            return {"error": f"Falla total de infraestructura: {str(e)}"}

    def parse_embarque_data(self, image_bytes, is_pdf=False, content_type="image/jpeg"):
        return self.parse_licencia_data(image_bytes, is_pdf, content_type)

    def extract_text(self, image_bytes, is_pdf=False):
        return "Motor Dual V10 Activo"

    def _extract_fields_regex(self, text):
        # Lógica para Motor Vision (Regex)
        dni = re.search(r'(\d{8})', text)
        lic = re.search(r'([A-Z]\d{8,9})', text)
        return {
            "dni": dni.group(1) if dni else "",
            "nombres": "CAPTURADO POR VISION (VER FOTO)",
            "apellido_paterno": "VER FOTO",
            "apellido_materno": "VER FOTO",
            "licencia": lic.group(1) if lic else "",
            "metodo": "Vision Expert"
        }

    def _clean_gemini_json(self, text):
        # Lógica para Motor Gemini (Json)
        try:
            match = re.search(r'(\{.*\})', text.replace('\n', ' '), re.DOTALL)
            data = json.loads(match.group(1)) if match else {}
            return {
                "dni": str(data.get("dni", "")),
                "nombres": str(data.get("nombres", "")).upper(),
                "apellido_paterno": str(data.get("apellido_paterno", "")).upper(),
                "apellido_materno": str(data.get("apellido_materno", "")).upper(),
                "licencia": str(data.get("licencia", "")).upper(),
                "metodo": "Gemini Flash"
            }
        except: return {"error": "Error de parseo"}

ocr_service = OCRService()
