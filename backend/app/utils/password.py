"""
Helpers de contraseña usando bcrypt directamente (evita incompatibilidad passlib/bcrypt).
"""
import bcrypt


def hash_password(plain: str) -> str:
    """Genera hash bcrypt de la contraseña (máx. 72 bytes)."""
    raw = (plain or "").encode("utf-8")[:72]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Comprueba si la contraseña en claro coincide con el hash."""
    if not hashed:
        return False
    try:
        raw = (plain or "").encode("utf-8")
        return bcrypt.checkpw(raw, hashed.encode("utf-8"))
    except Exception:
        return False
