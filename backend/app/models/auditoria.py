from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from app.database import Base

class RegistroEvento(Base):
    __tablename__ = "ope_registro_eventos"

    id = Column(Integer, primary_key=True, index=True)
    registro_id = Column(Integer, nullable=True)
    accion = Column(String(50), nullable=False)
    antes = Column(JSON, nullable=True)
    despues = Column(JSON, nullable=True)
    motivo = Column(String(255), nullable=True)
    usuario = Column(String(50), nullable=True)
    fecha_evento = Column(DateTime(timezone=True), server_default=func.now())
