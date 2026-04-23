from sqlalchemy import Column, Integer, String, Date, Time, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Posicionamiento(Base):
    __tablename__ = "posicionamientos"

    id = Column(Integer, primary_key=True, index=True)
    planta_llenado = Column(String(100), nullable=True)
    cultivo = Column(String(50), nullable=True)
    booking = Column(String(50), unique=True, index=True, nullable=False)
    nave = Column(String(100), nullable=True)
    etd = Column(Date, nullable=True)
    eta = Column(Date, nullable=True)
    pol = Column(String(50), nullable=True)
    orden_beta = Column(String(50), nullable=True)
    precinto_senasa = Column(String(100), nullable=True)
    operador_logistico = Column(String(100), nullable=True)
    naviera = Column(String(100), nullable=True)
    termoregistros = Column(String(100), nullable=True)
    ac = Column(String(50), nullable=True)
    ct = Column(String(50), nullable=True)
    ventilacion = Column(String(50), nullable=True)
    temperatura = Column(String(50), nullable=True)
    humedad = Column(String(50), nullable=True)
    filtros = Column(String(100), nullable=True)
    fecha_programada = Column(Date, nullable=True)
    hora_programada = Column(Time, nullable=True)
    fecha_llenado_reporte = Column(Date, nullable=True)
    hora_llenado_reporte = Column(Time, nullable=True)
    destino_booking = Column(String(100), nullable=True)
    tipo_tecnologia = Column(String(100), nullable=True)
    etiqueta_caja = Column(String(100), nullable=True)
    cajas_vacias = Column(Integer, nullable=True)
    estado = Column(String(20), default="PROGRAMADO")
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
