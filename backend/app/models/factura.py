from __future__ import annotations
from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, Date, Numeric, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class FacturaLogistica(Base):
    __tablename__ = "logistica_facturas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Proveedor (Emisor)
    proveedor_ruc: Mapped[str] = mapped_column(String(20), nullable=False)
    proveedor_razon_social: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Comprobante
    serie_correlativo: Mapped[str] = mapped_column(String(50), nullable=False)
    fecha_emision: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_pago: Mapped[date | None] = mapped_column(Date, nullable=True)
    moneda: Mapped[str] = mapped_column(String(10), nullable=False)
    
    # Subtotal (LineExtensionAmount)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    
    # Contenedor (extraído de Note o Description)
    contenedor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Forma de Pago y Advertencias de validación
    forma_pago: Mapped[str | None] = mapped_column(String(100), nullable=True)
    advertencia: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Campos de resumen para vista rápida
    descripcion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    unidad_medida: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Auditoría
    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Detalle de servicios
    detalles: Mapped[list["FacturaDetalleLogistica"]] = relationship("FacturaDetalleLogistica", back_populates="factura", cascade="all, delete-orphan")

    # Constraint para evitar duplicados en BD (Proveedor RUC y Serie-Correlativo)
    __table_args__ = (
        UniqueConstraint('proveedor_ruc', 'serie_correlativo', name='uq_factura_log_ruc_serie'),
    )


class FacturaDetalleLogistica(Base):
    __tablename__ = "logistica_factura_detalles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    factura_id: Mapped[int] = mapped_column(ForeignKey("logistica_facturas.id", ondelete="CASCADE"), nullable=False)

    descripcion: Mapped[str] = mapped_column(String(500), nullable=False)
    unidad_medida: Mapped[str] = mapped_column(String(10), nullable=False)
    valor_unitario: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    valor_item: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    factura: Mapped["FacturaLogistica"] = relationship("FacturaLogistica", back_populates="detalles")
