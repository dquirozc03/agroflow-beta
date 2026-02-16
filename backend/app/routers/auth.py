from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.rate_limit import login_rate_limit
from app.models.auth import Usuario
from app.dependencies.auth import (
    create_access_token,
    get_current_user,
    CurrentUser,
)
from app.utils.password import hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


# ========== Schemas ==========
class LoginRequest(BaseModel):
    usuario: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: str
    nombre: str
    rol: str


class MeResponse(BaseModel):
    usuario: str
    nombre: str
    rol: str


class RestablecerPasswordBody(BaseModel):
    nueva_password: str


# ========== Endpoints ==========
@router.post("/login", response_model=LoginResponse)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    """Login real: valida usuario/contraseña contra la BD y devuelve JWT. Rate limit por IP."""
    try:
        login_rate_limit(request)
    except HTTPException:
        raise
    except Exception:
        pass  # Si falla el rate limit, permitir intentar login igual
    usuario = (payload.usuario or "").strip()
    if not usuario:
        raise HTTPException(status_code=400, detail="Usuario requerido")
    user = db.query(Usuario).filter(Usuario.usuario == usuario).first()
    if not user or not user.activo:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    if not verify_password(payload.password or "", user.password_hash):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    token = create_access_token(usuario=user.usuario, rol=user.rol, user_id=user.id)
    return LoginResponse(
        access_token=token,
        usuario=user.usuario,
        nombre=user.nombre,
        rol=user.rol,
    )


@router.get("/me", response_model=MeResponse)
def me(current_user: CurrentUser):
    """Devuelve el usuario actual (token válido)."""
    return MeResponse(
        usuario=current_user.usuario,
        nombre=current_user.nombre,
        rol=current_user.rol,
    )


@router.patch("/usuarios/{usuario}/password")
def restablecer_password(
    usuario: str,
    body: RestablecerPasswordBody,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """
    Restablece la contraseña de un usuario. Solo administrador puede hacerlo.
    Para recuperar contraseña: contactar a un administrador.
    """
    if current_user.rol != "administrador":
        raise HTTPException(status_code=403, detail="Solo un administrador puede restablecer contraseñas")
    user = db.query(Usuario).filter(Usuario.usuario == usuario.strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    pwd = (body.nueva_password or "").strip()
    if len(pwd) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    user.password_hash = hash_password(pwd)
    db.commit()
    return {"ok": True, "mensaje": "Contraseña actualizada"}
