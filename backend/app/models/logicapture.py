from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base

class LogiCaptureRegistro(Base):
    """
    Tabla maestra para el registro integral de salidas LogiCapture.
    Contiene la cabecera de la operación y los datos de transporte.
    """
    __tablename__ = "logicapture_registros"

    id = Column(Integer, primary_key=True, index=True)
    
    # Datos de Embarque (Identificadores del despacho)
    booking = Column(String(50), index=True)
    orden_beta = Column(String(50), index=True) 
    contenedor = Column(String(50), index=True) 
    dam = Column(String(50), index=True)
    tratamiento_buque = Column(Boolean, default=False)
    
    # Datos de Transporte
    dni_chofer = Column(String(20))
    placa_tracto = Column(String(20))
    placa_carreta = Column(String(20))
    empresa_transporte = Column(String(200))
    
    # Datos de Precintos (Consolidado JSON para lectura rápida)
    precinto_aduana = Column(JSON)
    precinto_operador = Column(JSON)
    precinto_senasa = Column(JSON)
    precinto_linea = Column(JSON)
    precintos_beta = Column(JSON)
    termografos = Column(JSON)
    
    # Metadatos del Negocio (Auditoría y Gestión)
    status = Column(String(50), default="PENDIENTE", index=True) # PENDIENTE, PROCESADO, ANULADO
    motivo_anulacion = Column(String(200), nullable=True)
    fecha_embarque = Column(DateTime(timezone=True), nullable=True)
    
    # Datos del Maestro de Posicionamiento (Captura reactiva)
    planta = Column(String(100), nullable=True, index=True)
    cultivo = Column(String(100), nullable=True, index=True)
    codigo_sap = Column(String(50), nullable=True)
    
    # Datos Extendidos de Transporte (Trazabilidad)
    ruc_transportista = Column(String(20), nullable=True)
    marca_tracto = Column(String(50), nullable=True)
    cert_tracto = Column(String(50), nullable=True)
    cert_carreta = Column(String(50), nullable=True)
    nombre_chofer = Column(String(200), nullable=True)
    licencia_chofer = Column(String(100), nullable=True)
    partida_registral = Column(String(100), nullable=True)

    # Metadatos de Sistema
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    usuario_registro = Column(String(100), nullable=True)

class LogiCaptureDetalle(Base):
    """
    Tabla de detalle para asegurar la unicidad sistémica de precintos y termógrafos.
    Evita que un mismo precinto sea registrado en dos salidas diferentes.
    """
    __tablename__ = "logicapture_detalles"

    id = Column(Integer, primary_key=True, index=True)
    registro_id = Column(Integer, ForeignKey("logicapture_registros.id", ondelete="CASCADE"))
    
    categoria = Column(String(50)) # PRECINTO, TERMOGRAFO
    tipo = Column(String(50)) # ADUANA, BETA, LINEA, etc.
    codigo = Column(String(100), unique=True, index=True) # BLINDAJE: Código irrepetible en el sistema
