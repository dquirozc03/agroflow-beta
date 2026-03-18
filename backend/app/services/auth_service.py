# =============================================================================
# AGROFLOW — backend/app/services/auth_service.py
#
# PROPÓSITO:
#   Capa de servicio para la lógica de autenticación y gestión de usuarios.
#   Aquí ocurre toda la interacción con la base de datos (SQLAlchemy) y la
#   lógica de negocio asociada (auditorías, validaciones extra).
#   
# BENEFICIO:
#   El router principal (routers/auth.py) ahora solo se ocupa de recibir
#   peticiones HTTP y devolver formatos Pydantic.
# =============================================================================

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.auth import Usuario
from app.utils.password import hash_password, verify_password
from app.utils.audit import registrar_evento
from app.schemas.auth import (
    LoginRequest,
    UsuarioCreate,
    UsuarioUpdate,
    RestablecerPasswordBody,
    CambiarPasswordPropiaBody,
)
from app.core.exceptions import (
    UsuarioNoEncontradoError,
    CredencialesInvalidasError,
    CuentaBloqueadaError,
    RecursoDuplicadoError,
)

MAX_INTENTOS_LOGIN = 3


def listar_usuarios(db: Session):
    """Retorna todos los usuarios ordenados por nombre."""
    return db.query(Usuario).order_by(Usuario.nombre).all()


def crear_usuario(db: Session, payload: UsuarioCreate, admin_user: str) -> Usuario:
    """Valida y crea un nuevo usuario en BD, registrando en auditoría."""
    existente = db.query(Usuario).filter(Usuario.usuario == payload.usuario.strip()).first()
    if existente:
        raise RecursoDuplicadoError("El nombre de usuario ya está en uso")
    
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
        usuario=admin_user
    )
    db.commit()
    
    return nuevo


def toggle_usuario_status(db: Session, usuario_id: int, admin_user: str, admin_id: int) -> str:
    """Invierte el estado 'activo' del usuario. Evita auto-desactivación."""
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise UsuarioNoEncontradoError()
    
    if user.id == admin_id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
    
    user.activo = not user.activo
    estado = "activado" if user.activo else "desactivado"
    
    registrar_evento(
        db,
        registro_id=None,
        accion="USUARIO_ESTADO",
        antes={"usuario": user.usuario, "activo": not user.activo},
        despues={"usuario": user.usuario, "activo": user.activo},
        usuario=admin_user
    )
    db.commit()
    
    return estado


def actualizar_usuario(db: Session, usuario_id: int, payload: UsuarioUpdate, admin_user: str) -> Usuario:
    """Implementa partial update para un usuario y registra en auditoría."""
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise UsuarioNoEncontradoError()
    
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
            existente = db.query(Usuario).filter(Usuario.usuario == new_usuario).first()
            if existente:
                raise RecursoDuplicadoError("El ID de usuario ya está en uso por otro colaborador")
            user.usuario = new_usuario
        
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
        usuario=admin_user
    )
    db.commit()
    
    return user


def autenticar_usuario(db: Session, payload: LoginRequest) -> Usuario:
    """Valida credenciales y gestiona bloqueos por intentos fallidos."""
    usuario = (payload.usuario or "").strip()
    if not usuario:
        raise HTTPException(status_code=400, detail="Usuario requerido")
    
    user = db.query(Usuario).filter(Usuario.usuario == usuario).first()
    if not user or not user.activo:
        raise CredencialesInvalidasError()
    
    if getattr(user, "bloqueado", False):
        raise CuentaBloqueadaError()
    
    if not verify_password(payload.password or "", user.password_hash):
        intentos = getattr(user, "intentos_fallidos", 0) + 1
        user.intentos_fallidos = intentos
        if intentos >= MAX_INTENTOS_LOGIN:
            user.bloqueado = True
            db.commit()
            raise CuentaBloqueadaError(detail="Cuenta bloqueada tras 3 intentos fallidos. Contacte al administrador.")
        db.commit()
        raise CredencialesInvalidasError(detail=f"Usuario o contraseña incorrectos. Intentos restantes: {MAX_INTENTOS_LOGIN - intentos}")
    
    user.intentos_fallidos = 0
    user.bloqueado = False
    db.commit()
    
    return user


def restablecer_password(db: Session, usuario_id: int, body: RestablecerPasswordBody, admin_user: str) -> Usuario:
    """Fuerza una nueva contraseña temporal desde panel de admin."""
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise UsuarioNoEncontradoError()
    
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
        usuario=admin_user
    )
    db.commit()
    
    return user


def cambiar_password_propia(db: Session, user: Usuario, body: CambiarPasswordPropiaBody) -> None:
    """Permite a un usuario logueado cambiar su password y quita la bandera de cambio forzoso."""
    if not user.requiere_cambio_password:
        if not body.password_actual or not verify_password(body.password_actual, user.password_hash):
            raise CredencialesInvalidasError(detail="La contraseña actual es incorrecta")
    
    pwd = body.nueva_password.strip()
    if len(pwd) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")
    
    user.password_hash = hash_password(pwd)
    user.requiere_cambio_password = False
    db.commit()

    registrar_evento(
        db,
        registro_id=None,
        accion="USUARIO_CAMBIAR_PASSWORD",
        antes={"usuario": user.usuario},
        despues={"usuario": user.usuario, "requiere_cambio_password": False},
        usuario=user.usuario
    )
    db.commit()


def desbloquear_usuario(db: Session, usuario: str) -> Usuario:
    """Quita bandera de bloqueo."""
    user = db.query(Usuario).filter(Usuario.usuario == usuario.strip()).first()
    if not user:
        raise UsuarioNoEncontradoError()
    user.intentos_fallidos = 0
    user.bloqueado = False
    db.commit()
    return user
