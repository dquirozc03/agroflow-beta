# =============================================================================
# AGROFLOW — backend/app/core/exceptions.py
#
# PROPÓSITO:
#   Centraliza las excepciones HTTP personalizadas del sistema (TAREA-B05).
#   Esto asegura mensajes de error consistentes (DRY) y facilita
#   cambiar el mensaje en toda la API editando solo aquí.
# =============================================================================

from fastapi import HTTPException, status


class PermisoInsuficienteError(HTTPException):
    """Lanzada cuando un usuario intenta una acción sin el rol adecuado (403)."""
    def __init__(self, detail: str = "No tiene permisos para realizar esta acción"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class UsuarioNoEncontradoError(HTTPException):
    """Lanzada cuando se busca modificar un usuario que no existe (404)."""
    def __init__(self, detail: str = "Usuario no encontrado"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class CredencialesInvalidasError(HTTPException):
    """Lanzada durante login fallido por password o usuario erróneo (401)."""
    def __init__(self, detail: str = "Usuario o contraseña incorrectos"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class CuentaBloqueadaError(HTTPException):
    """Lanzada si la cuenta está bloqueada por demasiados intentos (423)."""
    def __init__(self, detail: str = "Cuenta bloqueada por múltiples intentos fallidos. Contacte al administrador."):
        super().__init__(status_code=status.HTTP_423_LOCKED, detail=detail)


class RecursoDuplicadoError(HTTPException):
    """Lanzada al intentar crear un recurso (ej. usuario) que ya existe (400)."""
    def __init__(self, detail: str = "El recurso ya existe o el identificador está en uso"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
