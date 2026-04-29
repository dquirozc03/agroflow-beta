from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class EmisionPackingList(Base):
    """
    Historial de generación de Packing Lists Customizados (OGL).
    """
    __tablename__ = "emision_packing_list"

    id = Column(Integer, primary_key=True, index=True)
    fecha_generacion = Column(DateTime(timezone=True), server_default=func.now())
    usuario = Column(String(100), nullable=True)
    nave = Column(String(200), index=True)
    estado = Column(String(20), default="ACTIVO", index=True) # ACTIVO, ANULADO
    motivo_anulacion = Column(String(500), nullable=True)
    usuario_anulacion = Column(String(100), nullable=True)
    archivo_nombre = Column(String(500), nullable=True)
    
    detalles = relationship("DetalleEmisionPackingList", back_populates="emision")

class DetalleEmisionPackingList(Base):
    """
    Detalle de qué órdenes/bookings entraron en un Packing List.
    """
    __tablename__ = "detalle_emision_packing_list"

    id = Column(Integer, primary_key=True, index=True)
    emision_id = Column(Integer, ForeignKey("emision_packing_list.id"))
    booking = Column(String(100), index=True)
    
    emision = relationship("EmisionPackingList", back_populates="detalles")
