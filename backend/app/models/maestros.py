from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Transportista(Base):
    __tablename__ = "transportistas"

    id = Column(Integer, primary_key=True, index=True)
    ruc = Column(String(20), unique=True, index=True, nullable=False)
    nombre_transportista = Column(String(255), nullable=False)
    partida_registral = Column(String(50), nullable=True)
    codigo_sap = Column(String(50), nullable=True)
    estado = Column(String(20), default="ACTIVO")
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relaciones
    tractos = relationship("VehiculoTracto", back_populates="transportista", cascade="all, delete-orphan")
    carretas = relationship("VehiculoCarreta", back_populates="transportista", cascade="all, delete-orphan")

class VehiculoTracto(Base):
    __tablename__ = "vehiculos_tracto"

    id = Column(Integer, primary_key=True, index=True)
    transportista_id = Column(Integer, ForeignKey("transportistas.id", ondelete="CASCADE"))
    
    placa_tracto = Column(String(20), unique=True, index=True, nullable=False)
    marca = Column(String(100), nullable=True)
    certificado_vehicular_tracto = Column(String(100), nullable=True)
    largo_tracto = Column(Numeric(10, 2), nullable=True)
    ancho_tracto = Column(Numeric(10, 2), nullable=True)
    alto_tracto = Column(Numeric(10, 2), nullable=True)
    numero_ejes = Column(Integer, nullable=True)
    peso_neto_tracto = Column(Numeric(10, 2), nullable=True)
    estado = Column(String(20), default="ACTIVO")

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación inversa
    transportista = relationship("Transportista", back_populates="tractos")

class VehiculoCarreta(Base):
    __tablename__ = "vehiculos_carreta"

    id = Column(Integer, primary_key=True, index=True)
    transportista_id = Column(Integer, ForeignKey("transportistas.id", ondelete="CASCADE"))
    
    placa_carreta = Column(String(20), unique=True, index=True, nullable=False)
    certificado_vehicular_carreta = Column(String(100), nullable=True)
    largo_carreta = Column(Numeric(10, 2), nullable=True)
    ancho_carreta = Column(Numeric(10, 2), nullable=True)
    alto_carreta = Column(Numeric(10, 2), nullable=True)
    numero_ejes = Column(Integer, nullable=True)
    peso_neto_carreta = Column(Numeric(10, 2), nullable=True)
    estado = Column(String(20), default="ACTIVO")

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación inversa
    transportista = relationship("Transportista", back_populates="carretas")

class Chofer(Base):
    __tablename__ = "choferes"

    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String(20), unique=True, index=True, nullable=False)
    nombres = Column(String(100), nullable=False)
    apellido_paterno = Column(String(100), nullable=False)
    apellido_materno = Column(String(100), nullable=True)
    licencia = Column(String(50), nullable=True)
    estado = Column(String(20), default="ACTIVO")
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def nombre_operativo(self):
        """Formato: {Primer Nombre} {Apellido Paterno} {Inicial Materno}."""
        if not self.nombres or not self.apellido_paterno:
            return "N/D"
        
        primer_nombre = self.nombres.split()[0].upper()
        ape_pat = self.apellido_paterno.upper()
        ape_mat_inic = f"{self.apellido_materno[0].upper()}." if self.apellido_materno else ""
        
        return f"{primer_nombre} {ape_pat} {ape_mat_inic}".strip()

class ClienteIE(Base):
    __tablename__ = "clientes_ie"

    id = Column(Integer, primary_key=True, index=True)
    nombre_legal = Column(String(255), nullable=False)
    cultivo = Column(String(100), nullable=True)
    pais = Column(String(100), nullable=False)
    destino = Column(String(100), nullable=True)
    
    # Datos BL
    consignatario_bl = Column(String(500), nullable=True)
    direccion_consignatario = Column(String(1000), nullable=True)
    notify_bl = Column(String(500), nullable=True)
    direccion_notify = Column(String(1000), nullable=True)
    eori_consignatario = Column(String(100), nullable=True)
    eori_notify = Column(String(100), nullable=True)
    emision_bl = Column(String(100), nullable=True)
    
    estado = Column(String(20), default="ACTIVO")
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación con Maestro Fito (Muchos a Uno: Varios clientes pueden usar el mismo Fito)
    fito_id = Column(Integer, ForeignKey("maestro_fitos.id", ondelete="SET NULL"), nullable=True)
    fitosanitario = relationship("MaestroFito", back_populates="clientes")

    __table_args__ = (
        UniqueConstraint('nombre_legal', 'cultivo', 'pais', 'destino', name='_cliente_ruta_uc'),
    )

class MaestroFito(Base):
    __tablename__ = "maestro_fitos"

    id = Column(Integer, primary_key=True, index=True)
    consignatario_fito = Column(String(500), nullable=False)
    direccion_fito = Column(String(1000), nullable=False)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relación inversa
    clientes = relationship("ClienteIE", back_populates="fitosanitario")

    __table_args__ = (
        UniqueConstraint('consignatario_fito', 'direccion_fito', name='_fito_data_uc'),
    )

class Planta(Base):
    __tablename__ = "plantas"

    id = Column(Integer, primary_key=True, index=True)
    planta = Column(String(100), unique=True, nullable=False)
    direccion = Column(String(500), nullable=False)
    ubigeo = Column(String(50), nullable=False)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
