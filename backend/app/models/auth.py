from sqlalchemy import String, Integer, DateTime, Boolean, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Usuario(Base):
    """Usuarios del sistema para login real (auth) con permisos granulares."""
    __tablename__ = "auth_usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    rol: Mapped[str] = mapped_column(String(50), nullable=False)  # Nombre del rol (ej: ADMIN, OPERATIVO, ...)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    requiere_cambio_password: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    intentos_fallidos: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bloqueado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # NUEVO: Control granular por módulos (logicapture, maestros, operaciones, sistema)
    permisos: Mapped[dict] = mapped_column(JSON, default=lambda: {"logicapture": True, "maestros": True, "operaciones": True, "sistema": False}, nullable=False)
    
    creado_en: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RolMaster(Base):
    """Maestro de Roles con plantillas de permisos."""
    __tablename__ = "auth_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre_rol: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Plantilla de permisos por defecto para este rol
    permisos_plantilla: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    creado_en: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
