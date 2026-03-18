# =============================================================================
# AGROFLOW — backend/app/schemas/auth.py
#
# PROPÓSITO:
#   Centraliza todos los modelos Pydantic relacionados con autenticación
#   y gestión de usuarios. Siguiendo el principio de responsabilidad única,
#   los schemas viven aquí y los routers solo los importan.
#
# ¿POR QUÉ SEPARAR SCHEMAS DE ROUTERS?
#   - Los routers deben ser "delgados": solo reciben HTTP y devuelven respuesta.
#   - Si los schemas están en el router, son difíciles de reutilizar en
#     servicios, tests y otros módulos.
#   - Esta separación también mejora la legibilidad del código: cuando alguien
#     abre routers/auth.py, ve solo la lógica HTTP, no definiciones de tipos.
#
# USO:
#   from app.schemas.auth import LoginRequest, LoginResponse, UsuarioCreate ...
# =============================================================================

from typing import Optional
from pydantic import BaseModel


# -----------------------------------------------------------------------------
# SCHEMAS DE AUTENTICACIÓN (login / tokens)
# -----------------------------------------------------------------------------

class LoginRequest(BaseModel):
    """
    Datos que el cliente envía al endpoint POST /api/v1/auth/login.
    Ambos campos son obligatorios. El router los valida con Pydantic
    antes de ejecutar cualquier lógica de negocio.
    """
    usuario: str
    password: str


class LoginResponse(BaseModel):
    """
    Respuesta exitosa del endpoint de login.
    Contiene el token JWT y los datos básicos del usuario para que
    el frontend pueda mostrar el nombre y ajustar la UI según el rol,
    sin necesidad de hacer una segunda llamada a /me.

    Nota sobre 'requiere_cambio_password':
      Si es True, el frontend debe redirigir al usuario a la pantalla
      de cambio de contraseña antes de permitirle acceder al sistema.
    """
    access_token: str
    token_type: str = "bearer"
    usuario: str
    nombre: str
    rol: str
    requiere_cambio_password: Optional[bool] = False


class MeResponse(BaseModel):
    """
    Respuesta del endpoint GET /api/v1/auth/me.
    Retorna los datos del usuario autenticado según el token JWT.
    Este endpoint es el que el frontend debe usar para obtener el rol
    del usuario — NUNCA leer el rol desde variables de entorno del cliente.

    'from_attributes = True' permite convertir directamente el modelo
    ORM (SQLAlchemy) a este schema Pydantic sin mapeo manual.
    """
    id: Optional[int] = None
    usuario: str
    nombre: str
    rol: str
    requiere_cambio_password: Optional[bool] = False

    class Config:
        from_attributes = True  # Habilita conversión desde modelo SQLAlchemy


# -----------------------------------------------------------------------------
# SCHEMAS DE GESTIÓN DE USUARIOS (CRUD de administrador)
# -----------------------------------------------------------------------------

class UsuarioCreate(BaseModel):
    """
    Datos para crear un nuevo usuario. Solo el administrador puede usar
    el endpoint que recibe este schema (POST /api/v1/auth/usuarios).

    'password' tiene valor por defecto '123456' porque tras la creación
    el sistema asigna 'requiere_cambio_password=True', obligando al nuevo
    usuario a cambiar su contraseña en el primer inicio de sesión.
    """
    usuario: str
    nombre: str
    password: str = "123456"  # Contraseña temporal; se fuerza cambio en primer login
    rol: str


class UsuarioResponse(BaseModel):
    """
    Representación pública de un usuario. Nunca incluye password_hash
    ni otros campos sensibles. Usada en todas las respuestas que
    devuelven datos de usuario al cliente.
    """
    id: int
    usuario: str
    nombre: str
    rol: str
    activo: bool
    requiere_cambio_password: Optional[bool] = False

    class Config:
        from_attributes = True  # Permite conversión desde ORM SQLAlchemy


class UsuarioUpdate(BaseModel):
    """
    Datos para actualizar un usuario existente (PATCH /api/v1/auth/usuarios/{id}).
    Todos los campos son opcionales: solo se actualizan los que se envíen.
    Esto implementa el patrón "partial update" — más seguro que reemplazar
    todo el objeto porque evita borrar campos no enviados por accidente.
    """
    nombre: Optional[str] = None
    rol: Optional[str] = None
    usuario: Optional[str] = None


# -----------------------------------------------------------------------------
# SCHEMAS DE GESTIÓN DE CONTRASEÑAS
# -----------------------------------------------------------------------------

class RestablecerPasswordBody(BaseModel):
    """
    Body del endpoint PATCH /api/v1/auth/usuarios/{id}/password-reset.
    Solo el administrador puede usar este endpoint para resetear la
    contraseña de cualquier usuario.

    Tras el reset, el sistema marca 'requiere_cambio_password=True' en el
    usuario, forzándolo a elegir una nueva contraseña en su próximo login.
    """
    nueva_password: str = "123456"  # Contraseña temporal por defecto


class CambiarPasswordPropiaBody(BaseModel):
    """
    Body del endpoint POST /api/v1/auth/cambiar-password-propia.
    Permite al usuario autenticado cambiar su propia contraseña.

    Lógica de 'password_actual':
      - Si 'requiere_cambio_password=True' (primer login o reset reciente),
        NO se exige 'password_actual' porque el usuario no tiene una real.
      - En cualquier otro caso, sí se exige para confirmar que quien cambia
        la contraseña es efectivamente el dueño de la cuenta.
    """
    password_actual: Optional[str] = None  # None si es primer login o tras reset
    nueva_password: str
