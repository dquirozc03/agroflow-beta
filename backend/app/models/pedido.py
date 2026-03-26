from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func
from app.database import Base

class PedidoComercial(Base):
    __tablename__ = "pedidos_comerciales"

    ID = Column(Integer, primary_key=True, index=True)
    PLANTA = Column(String(100), nullable=True)
    ORDEN_BETA = Column(String(50), index=True, nullable=True)
    PO = Column(String(100), nullable=True)
    CULTIVO = Column(String(50), nullable=True)
    CLIENTE = Column(String(200), nullable=True)
    CONSIGNATARIO = Column(String(200), nullable=True)
    RECIBIDOR = Column(String(200), nullable=True)
    PORT_ID_ORIGEN = Column(String(100), nullable=True)
    PAIS = Column(String(100), nullable=True)
    POD = Column(String(100), nullable=True)
    PORT_ID_DESTINO = Column(String(100), nullable=True)
    PRESENTACION = Column(String(100), nullable=True)
    VARIEDAD = Column(String(100), nullable=True)
    PRODUCT = Column(String(150), nullable=True)
    PESO_POR_CAJA = Column(Numeric(10, 2), nullable=True)
    ADDITIONAL_INFO = Column(String(500), nullable=True)
    CAJA_POR_PALLET = Column(Numeric(10, 2), nullable=True)
    TOTAL_PALLETS = Column(Numeric(10, 2), nullable=True)
    TOTAL_CAJAS = Column(Numeric(10, 2), nullable=True)
    INCOTERM = Column(String(50), nullable=True)
    TIPO_PRECIO = Column(String(50), nullable=True)
    
    FECHA_ACTUALIZACION = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
