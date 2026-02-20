from typing import Optional, Annotated
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
from app.utils.audit import registrar_evento

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
    requiere_cambio_password: Optional[bool] = False


class MeResponse(BaseModel):
    id: Optional[int] = None
    usuario: str
    nombre: str
    rol: str
    requiere_cambio_password: Optional[bool] = False

    class Config:
        from_attributes = True


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
    requiere_cambio_password: Optional[bool] = False

    class Config:
        from_attributes = True


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[str] = None
    usuario: Optional[str] = None


class RestablecerPasswordBody(BaseModel):
    nueva_password: str


class CambiarPasswordPropiaBody(BaseModel):
    password_actual: Optional[str] = None
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
        activo=True,
        requiere_cambio_password=True
    )
    
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    registrar_evento(
        db,
        registro_id=None,
        accion="USUARIO_CREAR",
        antes=None,
        despues={
            "usuario": nuevo.usuario,
            "nombre": nuevo.nombre,
            "rol": nuevo.rol
        },
        usuario=current_user.usuario
    )
    db.commit()
    
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
    
    registrar_evento(
        db,
        registro_id=None,
        accion="USUARIO_ESTADO",
        antes={"usuario": user.usuario, "activo": not user.activo},
        despues={"usuario": user.usuario, "activo": user.activo},
        usuario=current_user.usuario
    )
    db.commit()
    
    return {"ok": True, "mensaje": f"Usuario {estado} correctamente"}


@router.patch("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: int,
    payload: UsuarioUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Actualiza datos básicos de un usuario (nombre, rol). Solo administradores."""
    if current_user.rol != "administrador":
        raise HTTPException(status_code=403, detail="No tienes permisos para editar usuarios")
    
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    antes = {
        "nombre": user.nombre,
        "rol": user.rol,
        "usuario": user.usuario
    }
    
    if payload.nombre is not None:
        user.nombre = payload.nombre.strip()
    if payload.rol is not None:
        user.rol = payload.rol.strip()
    if payload.usuario is not None:
        new_usuario = payload.usuario.strip()
        if new_usuario != user.usuario:
            # Verificar si el nuevo ID ya está en uso
            existente = db.query(Usuario).filter(Usuario.usuario == new_usuario).first()
            if existente:
                raise HTTPException(status_code=400, detail="El ID de usuario ya está en uso por otro colaborador")
            user.usuario = new_usuario
        
    db.commit()
    db.refresh(user)

    registrar_evento(
        db,
        registro_id=None,
        accion="USUARIO_EDITAR",
        antes=antes,
        despues={
            "nombre": user.nombre,
            "rol": user.rol,
            "usuario": user.usuario
        },
        usuario=current_user.usuario
    )
    db.commit()
    
    return user


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
        requiere_cambio_password=getattr(user, "requiere_cambio_password", False),
    )


@router.get("/me", response_model=MeResponse)
def me(current_user: CurrentUser):
    """Devuelve el usuario actual (token válido)."""
    return current_user


@router.patch("/usuarios/{usuario_id}/password-reset")
def restablecer_password_v2(
    usuario_id: int,
    body: RestablecerPasswordBody,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """
    Restablece la contraseña de un usuario usando su ID. Solo administrador.
    """
    if current_user.rol != "administrador":
        raise HTTPException(status_code=403, detail="Solo un administrador puede restablecer contraseñas")
    
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    pwd = (body.nueva_password or "").strip()
    if len(pwd) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    
    user.password_hash = hash_password(pwd)
    user.intentos_fallidos = 0
    user.bloqueado = False
    user.requiere_cambio_password = True
    db.commit()

    registrar_evento(
        db,
        registro_id=None,
        accion="USUARIO_PASSWORD_RESET",
        antes={"usuario": user.usuario},
        despues={"usuario": user.usuario, "requiere_cambio_password": True},
        usuario=current_user.usuario
    )
    db.commit()
    
    return {"ok": True, "mensaje": f"Contraseña de {user.usuario} actualizada. Se requerirá cambio al iniciar sesión."}


@router.post("/cambiar-password-propia")
def cambiar_password_propia(
    body: CambiarPasswordPropiaBody,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Permite al usuario cambiar su propia contraseña."""
    if not current_user.requiere_cambio_password:
        if not body.password_actual or not verify_password(body.password_actual, current_user.password_hash):
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    
    pwd = body.nueva_password.strip()
    if len(pwd) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
    
    current_user.password_hash = hash_password(pwd)
    current_user.requiere_cambio_password = False
    db.commit()

    registrar_evento(
        db,
        registro_id=None,
        accion="USUARIO_CAMBIAR_PASSWORD",
        antes={"usuario": current_user.usuario},
        despues={"usuario": current_user.usuario, "requiere_cambio_password": False},
        usuario=current_user.usuario
    )
    db.commit()
    
    return {"ok": True, "mensaje": "Tu contraseña ha sido actualizada correctamente"}


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
