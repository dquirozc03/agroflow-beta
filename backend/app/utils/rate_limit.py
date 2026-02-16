"""
Rate limit sencillo por IP (en memoria). Para login u otros endpoints sensibles.
En producción con varios workers considerar Redis u otro almacén compartido.
"""
import time
from collections import defaultdict
from threading import Lock

# ip -> lista de timestamps de intentos
_attempts: dict[str, list[float]] = defaultdict(list)
_lock = Lock()

# Máximo de intentos y ventana en segundos (ej. 10 intentos por 15 min)
LOGIN_MAX_ATTEMPTS = 10
LOGIN_WINDOW_SECONDS = 15 * 60


def _get_client_ip(request) -> str:
    """IP del cliente; respeta X-Forwarded-For si está detrás de proxy."""
    try:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip() or "unknown"
        if getattr(request, "client", None) and request.client:
            return request.client.host or "unknown"
    except Exception:
        pass
    return "unknown"


def _clean_old(now: float, window: int) -> None:
    """Elimina intentos fuera de la ventana."""
    cutoff = now - window
    to_del = [ip for ip, ts_list in _attempts.items() if not ts_list or all(t < cutoff for t in ts_list)]
    for ip in to_del:
        del _attempts[ip]
    for ip in list(_attempts.keys()):
        _attempts[ip] = [t for t in _attempts[ip] if t >= cutoff]


def login_rate_limit(request) -> None:
    """
    Verifica si la IP ha superado el límite de intentos de login.
    Lanza HTTPException 429 si se excede.
    """
    from fastapi import HTTPException, status

    ip = _get_client_ip(request)
    now = time.time()
    with _lock:
        _clean_old(now, LOGIN_WINDOW_SECONDS)
        recent = [t for t in _attempts[ip] if t >= now - LOGIN_WINDOW_SECONDS]
        if len(recent) >= LOGIN_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados intentos de acceso. Espere unos minutos e intente de nuevo.",
            )
        _attempts[ip].append(now)

