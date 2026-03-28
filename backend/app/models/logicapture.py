from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base

class LogiCaptureRegistro(Base):
    __tablename__ = "logicapture_registros"

    id = Column(Integer, primary_key=True, index=True)
    
    # Datos de Embarque
    booking = Column(String(50), index=True)
    orden_beta = Column(String(50))
    contenedor = Column(String(50))
    dam = Column(String(50))
    
    # Datos de Transporte
    dni_chofer = Column(String(20))
    placa_tracto = Column(String(20))
    placa_carreta = Column(String(20))
    empresa_transporte = Column(String(200))
    
    # Datos de Precintos (JSONB para Postgres, JSON para SQLite/Base)
    precinto_aduana = Column(JSON)
    precinto_operador = Column(JSON)
    precinto_senasa = Column(JSON)
    precinto_linea = Column(JSON)
    precintos_beta = Column(JSON)
    termografos = Column(JSON)
    
    # Metadatos
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    usuario_registro = Column(String(100), nullable=True) # Para futura expansión de roles
