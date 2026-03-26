from sqlalchemy import Column, Integer, String, Date, Time, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Posicionamiento(Base):
    __tablename__ = "posicionamientos"

    ID = Column(Integer, primary_key=True, index=True)
    PLANTA_LLENADO = Column(String(100), nullable=True)
    CULTIVO = Column(String(50), nullable=True)
    BOOKING = Column(String(50), unique=True, index=True, nullable=False)
    NAVE = Column(String(100), nullable=True)
    ETD = Column(Date, nullable=True)
    ETA = Column(Date, nullable=True)
    POL = Column(String(50), nullable=True)
    ORDEN_BETA = Column(String(50), nullable=True)
    PRECINTO_SENASA = Column(String(100), nullable=True)
    OPERADOR_LOGISTICO = Column(String(100), nullable=True)
    NAVIERA = Column(String(100), nullable=True)
    TERMOREGISTROS = Column(String(100), nullable=True)
    AC = Column(String(50), nullable=True)
    CT = Column(String(50), nullable=True)
    VENTILACION = Column(String(50), nullable=True)
    TEMPERATURA = Column(String(50), nullable=True)
    HUMEDAD = Column(String(50), nullable=True)
    FILTROS = Column(String(100), nullable=True)
    FECHA_PROGRAMADA = Column(Date, nullable=True)
    HORA_PROGRAMADA = Column(Time, nullable=True)
    CAJAS_VACIAS = Column(Integer, nullable=True)
    ESTADO = Column(String(20), default="PROGRAMADO")
    FECHA_CREACION = Column(DateTime(timezone=True), server_default=func.now())
