from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class CuadroPedido(Base):
    """Información del Cuadro de Pedidos Excel"""
    __tablename__ = "packing_cuadro_pedidos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    orden_beta: Mapped[str] = mapped_column(String(50), index=True) # BAM-xxxx
    product: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    peso_caja: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # Carton Content (Peso por caja)
    house_gln: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # Pack. House GLN
    cajas_por_pallet: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # Quantity per pallet
    carton_content: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # Tipo de Caja
    additional_info: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # Notes
    
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PackingConfirmacion(Base):
    """Detalle extraído de los archivos de Confirmación"""
    __tablename__ = "packing_confirmaciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    orden_beta: Mapped[str] = mapped_column(String(50), index=True)
    pallet_id: Mapped[str] = mapped_column(String(100), index=True) # ID PALLET (HU)
    calibre: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    peso_neto: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # TOTAL KILOS
    fecha_cosecha: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    fecha_proceso: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    lote_ogl: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # LOTE CLIENTE (OGL)
    total_cajas: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # Quantity per grower (cartons)
    codigo_trazabilidad: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    archivo_nombre: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PackingTermografo(Base):
    """Datos de códigos de termógrafo por pallet"""
    __tablename__ = "packing_termografos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    orden_beta: Mapped[str] = mapped_column(String(50), index=True)
    pallet_id: Mapped[str] = mapped_column(String(100), index=True) # Para vincular con la confirmación
    codigo_termografo: Mapped[str] = mapped_column(String(100))
    
    fecha_subida: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
