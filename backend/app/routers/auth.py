# =============================================================================
# AGROFLOW — backend/app/routers/auth.py
#
# PROPÓSITO:
#   Router HTTP de autenticación y gestión de usuarios.
#   Este módulo solo contiene endpoints (lógica HTTP).
#   Los schemas Pydantic viven en app/schemas/auth.py
#   La lógica de negocio compleja está en app/services/auth_service.py (TAREA-B03)
#
# PREFIJO: /api/v1/auth — cumple con el estándar de versionado de la API
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.rate_limit import login_rate_limit
from app.dependencies.auth import create_access_token, CurrentUser
from app.core.exceptions import PermisoInsuficienteError
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    UsuarioCreate,
    UsuarioResponse,
    UsuarioUpdate,
    RestablecerPasswordBody,
    CambiarPasswordPropiaBody,
)
from app.services import auth_service

# Prefijo /api/v1/auth — el /api/v1 garantiza compatibilidad futura si se crea una v2
router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


# ========== Endpoints ==========
@router.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios(
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Lista todos los usuarios. Solo administradores."""
    if current_user.rol != "administrador":
        raise PermisoInsuficienteError("No tiene permisos para listar usuarios")
    
    return auth_service.listar_usuarios(db)


@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(
    payload: UsuarioCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Crea un nuevo usuario. Solo administradores."""
    if current_user.rol != "administrador":
        raise PermisoInsuficienteError("Solo un administrador puede crear usuarios")
    
    return auth_service.crear_usuario(db, payload, admin_user=current_user.usuario)


@router.delete("/usuarios/{usuario_id}")
def toggle_usuario_status(
    usuario_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db)
):
    """Activa/Desactiva un usuario. Solo administradores."""
    if current_user.rol != "administrador":
        raise PermisoInsuficienteError("Solo un administrador puede modificar usuarios")
    
    estado = auth_service.toggle_usuario_status(db, usuario_id, current_user.usuario, current_user.id)
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
        raise PermisoInsuficienteError("No tienes permisos para editar usuarios")
    
    return auth_service.actualizar_usuario(db, usuario_id, payload, current_user.usuario)


@router.post("/login", response_model=LoginResponse)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    """Login real: valida usuario/contraseña contra la BD. Máximo 3 intentos, luego bloqueo."""
    try:
        login_rate_limit(request)
    except HTTPException:
        raise
    except Exception:
        pass
    
    user = auth_service.autenticar_usuario(db, payload)
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
        raise PermisoInsuficienteError("Solo un administrador puede restablecer contraseñas")
    
    user = auth_service.restablecer_password(db, usuario_id, body, current_user.usuario)
    return {"ok": True, "mensaje": f"Contraseña de {user.usuario} actualizada. Se requerirá cambio al iniciar sesión."}


@router.post("/cambiar-password-propia")
def cambiar_password_propia(
    body: CambiarPasswordPropiaBody,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Permite al usuario cambiar su propia contraseña."""
    auth_service.cambiar_password_propia(db, current_user, body)
    return {"ok": True, "mensaje": "Tu contraseña ha sido actualizada correctamente"}


@router.patch("/usuarios/{usuario}/desbloquear")
def desbloquear_usuario(
    usuario: str,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Desbloquea una cuenta. Solo administrador."""
    if current_user.rol != "administrador":
        raise PermisoInsuficienteError("Solo un administrador puede desbloquear cuentas")
    
    auth_service.desbloquear_usuario(db, usuario)
    return {"ok": True, "mensaje": "Usuario desbloqueado"}
