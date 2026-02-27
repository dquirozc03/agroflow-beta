from datetime import datetime, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.configuracion import settings
from app.database import get_db
from app.models.auth import Usuario

security = HTTPBearer(auto_error=False)

# En desarrollo se usa un valor por defecto; en producción debe estar definido en env (validado al arranque).
JWT_SECRET = (settings.JWT_SECRET or "dev-secret-cambiar-en-produccion").strip() or "dev-secret-cambiar-en-produccion"
JWT_ALGORITHM = settings.JWT_ALGORITHM
JWT_EXPIRE_MINUTES = settings.JWT_EXPIRE_MINUTES


def create_access_token(usuario: str, rol: str, user_id: int) -> str:
    from datetime import timedelta
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "usuario": usuario, "rol": rol, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Session = Depends(get_db),
) -> Usuario | None:
    """Devuelve el usuario si hay token válido; si no, None (para APIs que pueden ser públicas)."""
    if not credentials or not credentials.credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or "sub" not in payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    try:
        uid = int(user_id)
    except ValueError:
        return None
    user = db.query(Usuario).filter(Usuario.id == uid, Usuario.activo == True).first()
    return user


async def get_current_user(
    user: Annotated[Usuario | None, Depends(get_current_user_optional)],
) -> Usuario:
    """Exige usuario autenticado; 401 si no hay token o es inválido."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado. Inicie sesión.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user



def require_role(allowed_roles: list[str]):
    """
    Retorna una dependencia que valida si el usuario tiene uno de los roles permitidos.
    """
    def role_checker(current_user: Usuario = Depends(get_current_user)):
        if current_user.rol and current_user.rol.lower() not in [r.lower() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos suficientes para realizar esta acción.",
            )
        return current_user

    return role_checker


# Tipo para inyectar en rutas
CurrentUser = Annotated[Usuario, Depends(get_current_user)]
OptionalUser = Annotated[Usuario | None, Depends(get_current_user_optional)]
