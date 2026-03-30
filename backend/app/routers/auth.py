# =============================================================================
# AGROFLOW — backend/app/routers/auth.py (Diagnóstico Activo)
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import traceback # Para ver el error real

from app.database import get_db
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

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# ========== Endpoints ==========

@router.post("/login", response_model=LoginResponse)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    """Login con Diagnóstico de Errores."""
    try:
        # 1. Intentar Autenticar
        user = auth_service.autenticar_usuario(db, payload)
        
        # 2. Intentar Generar Token
        token = create_access_token(usuario=user.usuario, rol=user.rol, user_id=user.id)
        
        # 3. Devolver Respuesta
        return LoginResponse(
            access_token=token,
            usuario=user.usuario,
            nombre=user.nombre,
            rol=user.rol,
            requiere_cambio_password=getattr(user, "requiere_cambio_password", False),
        )
    except HTTPException as he:
        # Errores normales (contraseña mal, etc) se pasan tal cual
        raise he
    except Exception as e:
        # ERROR 500: ¡Lo capturamos para ver qué es!
        error_msg = f"ERROR CRITICO EN BACKEND: {str(e)} --- {traceback.format_exc()}"
        print(error_msg) # Se verá en los logs de Render
        raise HTTPException(
            status_code=500, 
            detail=f"Causa del Error 500: {str(e)}" # Se verá en tu navegador
        )

@router.get("/me", response_model=MeResponse)
def me(current_user: CurrentUser):
    return current_user


@router.post("/cambiar-password")
def cambiar_password(body: CambiarPasswordPropiaBody, current_user: CurrentUser, db: Session = Depends(get_db)):
    """Permite al usuario cambiar su propia contraseña."""
    auth_service.cambiar_password_propia(db, current_user, body)
    return {"status": "success", "message": "Contraseña actualizada correctamente"}


# ========== Endpoints de ADMINISTRACIÓN (Solo Admin) ==========

@router.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios(current_user: CurrentUser, db: Session = Depends(get_db)):
    """Lista todos los usuarios (Solo Admin)."""
    if current_user.rol != "ADMIN":
        raise PermisoInsuficienteError()
    return auth_service.listar_usuarios(db)


@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(payload: UsuarioCreate, current_user: CurrentUser, db: Session = Depends(get_db)):
    """Crea un nuevo usuario (Solo Admin)."""
    if current_user.rol != "ADMIN":
        raise PermisoInsuficienteError()
    return auth_service.crear_usuario(db, payload, current_user.usuario)


@router.patch("/usuarios/{id}", response_model=UsuarioResponse)
def actualizar_usuario(id: int, payload: UsuarioUpdate, current_user: CurrentUser, db: Session = Depends(get_db)):
    """Actualiza datos de un usuario (Solo Admin)."""
    if current_user.rol != "ADMIN":
        raise PermisoInsuficienteError()
    return auth_service.actualizar_usuario(db, id, payload, current_user.usuario)


@router.post("/usuarios/{id}/reset-password")
def reset_password(id: int, body: RestablecerPasswordBody, current_user: CurrentUser, db: Session = Depends(get_db)):
    """Resetea la contraseña de un usuario a 123456 (Solo Admin)."""
    if current_user.rol != "ADMIN":
        raise PermisoInsuficienteError()
    auth_service.restablecer_password(db, id, body, current_user.usuario)
    return {"status": "success", "message": "Contraseña reseteada correctamente"}


@router.patch("/usuarios/{id}/desbloquear")
def desbloquear_usuario(id: int, current_user: CurrentUser, db: Session = Depends(get_db)):
    """Desbloquea a un usuario (Solo Admin)."""
    if current_user.rol != "ADMIN":
        raise PermisoInsuficienteError()
    # Buscar usuario por ID primero para obtener su login
    from app.models.auth import Usuario
    user = db.query(Usuario).filter(Usuario.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    auth_service.desbloquear_usuario(db, user.usuario)
    return {"status": "success", "message": "Usuario desbloqueado correctamente"}
