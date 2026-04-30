from sqlalchemy import Column, Integer, String, Date, Time, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Posicionamiento(Base):
    __tablename__ = "posicionamientos"

    ID = Column("id", Integer, primary_key=True, index=True)
    PLANTA_LLENADO = Column("planta_llenado", String(100), nullable=True)
    CULTIVO = Column("cultivo", String(50), nullable=True)
    BOOKING = Column("booking", String(50), unique=True, index=True, nullable=False)
    NAVE = Column("nave", String(100), nullable=True)
    ETD = Column("etd", Date, nullable=True)
    ETA = Column("eta", Date, nullable=True)
    POL = Column("pol", String(50), nullable=True)
    ORDEN_BETA = Column("orden_beta", String(50), nullable=True)
    PRECINTO_SENASA = Column("precinto_senasa", String(100), nullable=True)
    OPERADOR_LOGISTICO = Column("operador_logistico", String(100), nullable=True)
    NAVIERA = Column("naviera", String(100), nullable=True)
    TERMOREGISTROS = Column("termoregistros", String(100), nullable=True)
    AC = Column("ac", String(50), nullable=True)
    CT = Column("ct", String(50), nullable=True)
    VENTILACION = Column("ventilacion", String(50), nullable=True)
    TEMPERATURA = Column("temperatura", String(50), nullable=True)
    HUMEDAD = Column("humedad", String(50), nullable=True)
    FILTROS = Column("filtros", String(100), nullable=True)
    FECHA_PROGRAMADA = Column("fecha_programada", Date, nullable=True)
    HORA_PROGRAMADA = Column("hora_programada", Time, nullable=True)
    CAJAS_VACIAS = Column("cajas_vacias", Integer, nullable=True)
    
    # Columnas adicionales del monorepo
    DESTINO_BOOKING = Column("destino_booking", String(200), nullable=True)
    FECHA_LLENADO_REPORTE = Column("fecha_llenado_reporte", Date, nullable=True)
    HORA_LLENADO_REPORTE = Column("hora_llenado_reporte", Time, nullable=True)
    TIPO_TECNOLOGIA = Column("tipo_tecnologia", String(100), nullable=True)
    ETIQUETA_CAJA = Column("etiqueta_caja", String(100), nullable=True)
    PAIS_BOOKING = Column("pais_booking", String(100), nullable=True)
    
    ESTADO = Column("estado", String(20), default="PROGRAMADO")
    FECHA_CREACION = Column("fecha_creacion", DateTime(timezone=True), server_default=func.now())
