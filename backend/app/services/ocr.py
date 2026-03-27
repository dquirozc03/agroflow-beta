import pytesseract
import cv2
import numpy as np
import re
from PIL import Image
import io
from pdf2image import convert_from_bytes
from app.utils.logging import logger

import platform
import shutil

class OCRService:
    def __init__(self):
        # Configuramos tesseract para español
        self.config = '--psm 3 -l spa'
        
        # Lógica dinámica según el sistema operativo (Ticket Arquitectura)
        if platform.system() == "Windows":
            # Fallback desarrollo local en Windows
            pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        else:
            # Entorno Linux / Docker / Render
            tesseract_path = shutil.which("tesseract")
            if tesseract_path:
                pytesseract.pytesseract.tesseract_cmd = tesseract_path
            else:
                logger.error("Tesseract no encontrado en el PATH del sistema Linux")

    def preprocess_image(self, image):
        """Mejora la imagen para un mejor reconocimiento: escala de grises y ajuste de contraste."""
        # Convertir a arreglo numpy (OpenCV)
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # 1. Redimensionar si es muy pequeña (mejora OCR)
        height, width = img.shape[:2]
        if width < 1000:
            img = cv2.resize(img, (None, None), fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

        # 2. Escala de grises
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 3. Aumentar contraste (CLAHE es excelente para documentos con sellos)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # 4. Desenfoque suave para reducir ruido
        blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
        
        return Image.fromarray(blurred)

    def extract_text(self, image_bytes, is_pdf=False):
        """Extrae texto con varios intentos (Original y Procesado)."""
        try:
            images = []
            if is_pdf:
                images = convert_from_bytes(image_bytes)
            else:
                images = [Image.open(io.BytesIO(image_bytes))]

            full_results = []
            for i, img in enumerate(images):
                # Intento 1: Con procesamiento OpenCV (mejor para fotos)
                processed_img = self.preprocess_image(img)
                text_p = pytesseract.image_to_string(processed_img, config=self.config)
                
                # Intento 2: Con la imagen original (mejor para scans claros)
                text_o = pytesseract.image_to_string(img, config=self.config)
                
                full_results.append(text_p)
                full_results.append(text_o)
            
            combined_text = "\n---\n".join(full_results)
            logger.info(f"Texto extraído ({len(combined_text)} caracteres)")
            return combined_text
        except Exception as e:
            logger.error(f"Error en extracción de texto: {e}")
            return ""

    def parse_transportista_data(self, text):
        """Heurística de precisión quirúrgica: Elimina etiquetas y ruidos residuales."""
        def fix_ocr_errors(t, is_ruc=False):
            t = t.replace('O', '0').replace('o', '0').replace('I', '1').replace('i', '1').replace('l', '1').replace('S', '5').replace('B', '8')
            if is_ruc:
                # Corregir 208 por 206 (error común de sombra en MTC)
                if t.startswith('208') and len(t) == 11: t = '206' + t[3:]
                # Si empieza por 80 corregir a 20
                if t.startswith('80'): t = '20' + t[2:]
            return t

        data = {
            "nombre_transportista": None,
            "ruc": None,
            "partida_registral": None,
            "certificado_vehicular": None,
            "placa": None
        }

        # Limpieza de líneas
        lines = [l.strip() for l in text.split('\n') if len(l.strip()) > 3]
        clean_text_full = "\n".join(lines)

        # --- 1. RUC (Buscamos patrón estricto después de RUC) ---
        ruc_search = re.search(r'RUC[:\s\-]*([0-9\sOlIBS]{10,15})', clean_text_full, re.IGNORECASE)
        if ruc_search:
            raw_ruc = re.sub(r'[^0-9OolISsB]', '', ruc_search.group(1))
            data["ruc"] = fix_ocr_errors(raw_ruc, is_ruc=True)[:11]

        # --- 2. Razón Social (Limpieza multi-capa y agresiva) ---
        # Palabras que NO deben estar en el nombre final (basura de etiquetas)
        trash_words = ["NOMBRE", "RAZON", "RAZÓN", "SOCIAL", "TRANSPORTISTA", "DEL", "MTC", "TARJETA", "CIRCULACION"]
        
        for i, line in enumerate(lines):
            line_up = line.upper()
            if "SOCIAL" in line_up or "TRANSPORTISTA" in line_up:
                # Intentamos extraer lo que esté después de SOCIAL o TRANSPORTISTA o los dos puntos
                name = re.sub(r'(?i).*(SOCIAL|TRANSPORTISTA|[:\-\.])\s*', '', line).strip()
                
                # Si el nombre quedó vacío o sospechoso, buscamos en la línea de abajo
                if len(name) < 4 and i+1 < len(lines):
                    next_line = lines[i+1].strip()
                    if not any(x in next_line.upper() for x in ["RUC", "PARTIDA", "MODALIDAD"]):
                        name = next_line
                
                # Limpieza iterativa: borramos palabras de etiqueta que hayan quedado
                for word in trash_words:
                    name = re.sub(r'(?i)\b' + re.escape(word) + r'\b', '', name).strip()
                
                # Limpieza final de caracteres basura al inicio/fin
                name = re.sub(r'^[|\[\]\s\-\.O0]+', '', name).strip()
                
                if len(name) > 4:
                    data["nombre_transportista"] = name.upper()
                    break

        # --- 3. Partida ---
        part_search = re.search(r'PARTIDA\s*(?:REGISTRAL)?[:\s\-]*([A-Z0-9]{8,12})', clean_text_full, re.IGNORECASE)
        if part_search:
            p = part_search.group(1)
            if p.startswith('AB'): p = '15' + p[2:]
            data["partida_registral"] = p

        # --- 4. Certificado ---
        cert_search = re.search(r'N[°º\s\-]+([A-Z0-9]{8,15})', clean_text_full, re.IGNORECASE)
        if cert_search: data["certificado_vehicular"] = cert_search.group(1)

        # --- 5. LOGICA DE DETECCION DIRECTA (Fallback) ---
        # Si no se encontró nada con etiquetas, pero el texto es corto, identificamos por patrón
        if not data["ruc"] and not data["partida_registral"] and len(clean_text_full) < 30:
            # Buscar algo que parezca un RUC (11 dígitos)
            maybe_ruc = re.search(r'\b(10|15|17|20)[0-9]{9}\b', clean_text_full)
            if maybe_ruc:
                data["ruc"] = maybe_ruc.group(0)
            
            # Buscar algo que parezca una Partida (8-12 caracteres alfanuméricos)
            # Evitamos que sea lo mismo que el RUC
            maybe_partida = re.search(r'\b[A-Z0-9]{8,12}\b', clean_text_full.upper())
            if maybe_partida and maybe_partida.group(0) != data["ruc"]:
                data["partida_registral"] = maybe_partida.group(0)

        return data

    def parse_tiv_data(self, text):
        """Parser especializado en Tarjetas de Identificación Vehicular (MTC/SUNARP)."""
        data = {
            "placa": None,
            "marca": None,
            "modelo": None,
            "numero_ejes": None,
            "peso_neto": None
        }
        
        lines = [l.strip().upper() for l in text.split('\n') if len(l.strip()) > 2]
        full_text = "\n".join(lines)

        # 1. Placa (Regex estricto de Perú: ABC-123 o A1-BC2)
        placa_search = re.search(r'\b([A-Z0-9]{3}[-\s]?[A-Z0-9]{3})\b', full_text)
        if placa_search:
            data["placa"] = re.sub(r'[^A-Z0-9]', '', placa_search.group(1))

        # 2. Marca / Modelo
        for i, line in enumerate(lines):
            if "MARCA" in line:
                data["marca"] = re.sub(r'MARCA\s*[:\-]*\s*', '', line).strip()
            if "MODELO" in line:
                data["modelo"] = re.sub(r'MODELO\s*[:\-]*\s*', '', line).strip()
            if "EJES" in line:
                ejes_search = re.search(r'(\d+)', line)
                if ejes_search: data["numero_ejes"] = int(ejes_search.group(1))
            if "PESO NETO" in line or "P. NETO" in line:
                peso_search = re.search(r'(\d+[\.,]?\d*)', line)
                if peso_search:
                    raw_peso = peso_search.group(1).replace(',', '.')
                    try:
                        data["peso_neto"] = float(raw_peso)
                    except:
                        pass

        return data

    def parse_licencia_data(self, text):
        """Parser especializado en Licencias de Conducir (Brevete PDF/Foto)."""
        data = {
            "dni": None,
            "apellido_paterno": None,
            "apellido_materno": None,
            "nombres": None,
            "licencia": None
        }
        
        lines = [l.strip().upper() for l in text.split('\n') if len(l.strip()) > 3]
        full_text = "\n".join(lines)

        # 1. DNI (8 dígitos)
        dni_search = re.search(r'\b(\d{8})\b', full_text)
        if dni_search: data["dni"] = dni_search.group(1)

        # 2. Licencia (Pattern variable, a veces es el DNI)
        lic_search = re.search(r'LICENCIA\s*[:\-]*\s*([A-Z0-9\s-]{8,12})', full_text)
        if lic_search: 
            data["licencia"] = re.sub(r'[^A-Z0-9]', '', lic_search.group(1)).strip()
        else:
            # Fallback: si tenemos DNI, la licencia suele ser el mismo número
            if data["dni"]: data["licencia"] = data["dni"]

        # 3. Nombres y Apellidos (Basado en etiquetas comunes en licencias peruanas)
        for i, line in enumerate(lines):
            if i < len(lines) - 1:
                # Si la línea dice APELLIDOS, la de abajo suele ser el dato
                if any(x in line for x in ["APELLIDOS", "APELLIDO"]):
                    full_aps = lines[i+1].split()
                    if len(full_aps) >= 2:
                        data["apellido_paterno"] = full_aps[0]
                        data["apellido_materno"] = full_aps[1]
                    elif len(full_aps) == 1:
                        data["apellido_paterno"] = full_aps[0]
                
                # Si la línea dice NOMBRES, la de abajo suele ser el dato
                if any(x in line for x in ["NOMBRES", "NOMBRE"]):
                    data["nombres"] = lines[i+1].strip()

        return data

ocr_service = OCRService()
