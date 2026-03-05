from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class CatPlanta(Base):
    """Mapeo de nombres de plantas a direcciones físicas"""
    __tablename__ = "cat_plantas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    direccion: Mapped[str] = mapped_column(String(500))

class CatClienteIE(Base):
    """Base de datos de clientes para Instrucciones de Embarque"""
    __tablename__ = "cat_clientes_ie"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Campo para cruzar con el 'cliente' del posicionamiento
    nombre_comercial: Mapped[str] = mapped_column(String(200), index=True)
    cultivo: Mapped[str] = mapped_column(String(50), index=True) # Granada, Arandano, etc.

    consignatario_bl: Mapped[str | None] = mapped_column(Text, nullable=True)
    notificante_bl: Mapped[str | None] = mapped_column(Text, nullable=True)
    cliente_fito: Mapped[str | None] = mapped_column(Text, nullable=True)

    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
