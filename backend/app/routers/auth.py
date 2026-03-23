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

# ... (El resto de funciones se mantienen iguales)
