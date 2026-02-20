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
    id: Optional[int] = None
    usuario: str
    nombre: str
    rol: str


class UsuarioCreate(BaseModel):
    usuario: str
    nombre: str
    password: str
    rol: str


class UsuarioResponse(BaseModel):
    id: int
    usuario: str
    nombre: str
    rol: str
    activo: bool

    class Config:
        from_attributes = True


class RestablecerPasswordBody(BaseModel):
    nueva_password: str


MAX_INTENTOS_LOGIN = 3


# ========== Endpoints ==========
@router.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios(
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Lista todos los usuarios. Solo administradores."""
    if current_user.rol != "administrador":
        raise HTTPException(status_code=403, detail="No tiene permisos para listar usuarios")
    
    return db.query(Usuario).order_by(Usuario.nombre).all()


@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(
    payload: UsuarioCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Crea un nuevo usuario. Solo administradores."""
    if current_user.rol != "administrador":
        raise HTTPException(status_code=403, detail="Solo un administrador puede crear usuarios")
    
    # Verificar si ya existe
    existente = db.query(Usuario).filter(Usuario.usuario == payload.usuario.strip()).first()
    if existente:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
    
    nuevo = Usuario(
        usuario=payload.usuario.strip(),
        nombre=payload.nombre.strip(),
        rol=payload.rol.strip(),
        password_hash=hash_password(payload.password),
        activo=True
    )
    
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.delete("/usuarios/{usuario_id}")
def toggle_usuario_status(
    usuario_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Activa/Desactiva un usuario. Solo administradores."""
    if current_user.rol != "administrador":
        raise HTTPException(status_code=403, detail="Solo un administrador puede modificar usuarios")
    
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
    
    user.activo = not user.activo
    db.commit()
    
    estado = "activado" if user.activo else "desactivado"
    return {"ok": True, "mensaje": f"Usuario {estado} correctamente"}


@router.post("/login", response_model=LoginResponse)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    """Login real: valida usuario/contraseña contra la BD. Máximo 3 intentos, luego bloqueo."""
    try:
        login_rate_limit(request)
    except HTTPException:
        raise
    except Exception:
        pass
    usuario = (payload.usuario or "").strip()
    if not usuario:
        raise HTTPException(status_code=400, detail="Usuario requerido")
    user = db.query(Usuario).filter(Usuario.usuario == usuario).first()
    if not user or not user.activo:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    if getattr(user, "bloqueado", False):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Cuenta bloqueada por múltiples intentos fallidos. Contacte al administrador.",
        )
    if not verify_password(payload.password or "", user.password_hash):
        intentos = getattr(user, "intentos_fallidos", 0) + 1
        user.intentos_fallidos = intentos
        if intentos >= MAX_INTENTOS_LOGIN:
            user.bloqueado = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Cuenta bloqueada tras 3 intentos fallidos. Contacte al administrador.",
            )
        db.commit()
        raise HTTPException(
            status_code=401,
            detail=f"Usuario o contraseña incorrectos. Intentos restantes: {MAX_INTENTOS_LOGIN - intentos}",
        )
    user.intentos_fallidos = 0
    user.bloqueado = False
    db.commit()
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
    user.intentos_fallidos = 0
    user.bloqueado = False
    db.commit()
    return {"ok": True, "mensaje": "Contraseña actualizada"}


@router.patch("/usuarios/{usuario}/desbloquear")
def desbloquear_usuario(
    usuario: str,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Desbloquea una cuenta. Solo administrador."""
    if current_user.rol != "administrador":
        raise HTTPException(status_code=403, detail="Solo un administrador puede desbloquear cuentas")
    user = db.query(Usuario).filter(Usuario.usuario == usuario.strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.intentos_fallidos = 0
    user.bloqueado = False
    db.commit()
    return {"ok": True, "mensaje": "Usuario desbloqueado"}
