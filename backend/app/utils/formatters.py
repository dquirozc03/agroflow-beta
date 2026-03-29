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
