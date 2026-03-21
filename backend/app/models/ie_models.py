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
    ubigeo: Mapped[str | None] = mapped_column(String(20), nullable=True)

class CatClienteIE(Base):
    """Base de datos de clientes para Instrucciones de Embarque"""
    __tablename__ = "cat_clientes_ie"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Cruce principal
    nombre_comercial: Mapped[str] = mapped_column(String(200), index=True)
    destino: Mapped[str | None] = mapped_column(String(200), index=True, nullable=True)
    cultivo: Mapped[str] = mapped_column(String(50), index=True) # Granada, Arandano, etc.

    pais: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Consignatario
    codigo_sap_cliente: Mapped[str | None] = mapped_column(String(50), nullable=True)
    eori_consignatario: Mapped[str | None] = mapped_column(String(100), nullable=True)
    consignatario_bl: Mapped[str | None] = mapped_column(Text, nullable=True)
    datos_referenciales_consignatario: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Notificante
    codigo_sap_notify: Mapped[str | None] = mapped_column(String(50), nullable=True)
    eori_notify: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notificante_bl: Mapped[str | None] = mapped_column(Text, nullable=True)
    datos_referenciales_notify: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    emision_bl: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cliente_fito: Mapped[str | None] = mapped_column(Text, nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

class RegistroIE(Base):
    """Historial de Instrucciones de Embarque generadas"""
    __tablename__ = "ie_registros_historial"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    o_beta: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cultivo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cliente: Mapped[str | None] = mapped_column(String(200), nullable=True)
    
    fecha_generacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    estado: Mapped[str] = mapped_column(String(50), server_default='ACTIVO', nullable=False)
    
    creado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
