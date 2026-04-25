from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func
from app.database import Base

class PedidoComercial(Base):
    __tablename__ = "pedidos_comerciales"

    id = Column(Integer, primary_key=True, index=True)
    planta = Column(String(100), nullable=True)
    orden_beta = Column(String(50), index=True, nullable=True)
    po = Column(String(100), nullable=True)
    cultivo = Column(String(50), nullable=True)
    cliente = Column(String(200), nullable=True)
    consignatario = Column(String(200), nullable=True)
    recibidor = Column(String(200), nullable=True)
    port_id_orig = Column(String(100), nullable=True)
    pais = Column(String(100), nullable=True)
    pod = Column(String(100), nullable=True)
    port_id_dest = Column(String(100), nullable=True)
    presentacion = Column(String(100), nullable=True)
    variedad = Column(String(100), nullable=True)
    product = Column(String(150), nullable=True)
    peso_por_caja = Column(Numeric(10, 2), nullable=True)
    additional_info = Column(String(500), nullable=True)
    caja_por_pallet = Column(Integer, nullable=True)
    total_pallets = Column(Integer, nullable=True)
    total_cajas = Column(Integer, nullable=True)
    incoterm = Column(String(50), nullable=True)
    tipo_precio = Column(String(50), nullable=True)
    semana_eta = Column(Integer, nullable=True)
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
