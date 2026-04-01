import re
from fastapi import HTTPException

def clean_booking(value: str) -> str:
    """Upper + Strip"""
    if not value: return ""
    return value.strip().upper()

def clean_plate(value: str) -> str:
    """Upper + No hyphens"""
    if not value: return ""
    return value.strip().upper().replace("-", "")

def clean_container(value: str) -> str:
    """ISO Regex"""
    if not value: return ""
    # Format AAAU1234567 
    clean_val = value.strip().upper()
    # Let's keep alphanumeric only to normalize
    clean_val = re.sub(r'[^A-Z0-9]', '', clean_val)
    # Simple validation for ISO standard structure: 4 letters + 7 numbers
    if clean_val and not re.match(r'^[A-Z]{4}\d{7}$', clean_val):
        # We won't raise error to keep UI flexible, but we clean it
        pass
    return clean_val

def clean_dni(value: str) -> str:
    """Strip + Validation"""
    if not value: return ""
    clean_val = value.strip().upper()
    return clean_val

def normalize_client_name(value: str) -> str:
    """
    Normaliza un nombre de cliente para match inteligente (v2.2 💎).
    - Quita contenido en paréntesis: (HAUSLADEN) -> ""
    - Quita ruido corporativo: GMBH, LTD, EX- ...
    - Limpia caracteres especiales y colapsa espacios.
    """
    if not value: return ""
    # 1. Upper + Quitar contenido entre paréntesis
    val = value.strip().upper()
    val = re.sub(r'\(.*?\)', '', val)
    # 2. Quitar ruidos comunes (delimitados por espacios o bordes)
    noise = [
        'LTD', 'INC', 'S.A.', 'S.R.L.', 'GMBH', 'SA', 'CORP', 
        'BV', 'B.V.', 'HOLLAND', 'EUROPE', 'USA', 'LLC', 'EX-', 
        'SA DE CV', 'SAC', 'EIRL', 'SARL'
    ]
    for n in noise:
        # Usamos regex para asegurar que sean palabras completas
        val = re.sub(rf'\b{n}\b', ' ', val)
    
    # 3. Quitar caracteres raros pero dejar espacios
    val = re.sub(r'[^A-Z0-9\s]', ' ', val)
    # 4. Colapsar espacios
    val = " ".join(val.split())
    return val
