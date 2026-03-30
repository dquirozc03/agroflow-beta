from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base
import re

def clean_container_code(code: str) -> str:
    """
    Sanitización integral de códigos de contenedor:
    - Remueve espacios, guiones, puntos y caracteres especiales.
    - Convierte a MAYÚSCULAS para consistencia en la DB.
    """
    if not code:
        return ""
    # Regex que mantiene solo caracteres alfanuméricos
    cleaned = re.sub(r'[^A-Z0-9]', '', str(code).upper())
    return cleaned

class ControlEmbarque(Base):
    __tablename__ = "control_embarque"

    id = Column(Integer, primary_key=True, index=True)
    
    # booking: No es necesariamente único (un booking puede tener múltiples DAMs/Contenedores)
    booking = Column(String(50), index=True, nullable=False)
    
    # dam: Identificador único del despacho aduanero
    dam = Column(String(50), unique=True, index=True, nullable=False)
    
    # contenedor: Identificadr físico del equipo
    contenedor = Column(String(20), index=True, nullable=False)
    
    # Metadatos de auditoría
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __init__(self, **kwargs):
        # Aseguramos la limpieza del contenedor en el constructor
        if 'contenedor' in kwargs:
            kwargs['contenedor'] = clean_container_code(kwargs['contenedor'])
        super(ControlEmbarque, self).__init__(**kwargs)

class ReporteEmbarques(Base):
    """
    Tabla para reporte de embarques de exportaciones proveniente de SharePoint 
    "Reporte Embarques de Exportaciones - Granada 2026"
    """
    __tablename__ = "reporte_embarques"

    id = Column(Integer, primary_key=True, index=True)
    booking = Column(String(100), index=True)
    nave_arribo = Column(String(200))

