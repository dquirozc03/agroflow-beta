from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class EmisionInstruccion(Base):
    """
    Registro histórico de cada Instrucción de Embarque generada.
    Almacena los datos exactos utilizados para permitir trazabilidad y anulación.
    """
    __tablename__ = "ope_instrucciones_emisiones"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificadores principales
    booking = Column(String(50), index=True)
    orden_beta = Column(String(50), index=True)
    cliente = Column(String(200))
    cultivo = Column(String(100))
    
    # Datos técnicos (Snapshot de lo que se imprimió)
    data_snapshot = Column(JSON, nullable=True)
    
    # Auditoría
    usuario = Column(String(100))
    status = Column(String(20), default="ACTIVO") # ACTIVO, ANULADO
    motivo_anulacion = Column(String(255), nullable=True)
    
    fecha_emision = Column(DateTime(timezone=True), server_default=func.now())
    fecha_anulacion = Column(DateTime(timezone=True), nullable=True)
