from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.posicionamiento import Posicionamiento
from app.models.embarque import ControlEmbarque
from app.models.maestros import Chofer, VehiculoTracto, VehiculoCarreta, Transportista
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/logicapture",
    tags=["LogiCapture Core"]
)

class LookupResponse(BaseModel):
    booking: str
    orden_beta: Optional[str] = None
    dam: Optional[str] = None
    contenedor: Optional[str] = None
    status: str

@router.get("/lookup/{booking}", response_model=LookupResponse)
def lookup_booking_data(booking: str, db: Session = Depends(get_db)):
    """
    Motor de resolución de datos de embarque:
    Cruza la información de Posicionamientos (Plan Maestro) con el 
    Control de Embarque (Registro Operativo) para autocompletar el formulario.
    """
    clean_booking = booking.strip().upper()
    
    # 1. Buscar en Posicionamientos (Orden Beta / Plan Maestro)
    pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == clean_booking).first()
    
    # 2. Buscar en Control de Embarque (DAM / Contenedor)
    emb = db.query(ControlEmbarque).filter(ControlEmbarque.booking == clean_booking).first()
    
    if not pos and not emb:
        raise HTTPException(
            status_code=404, 
            detail=f"No se encontró información maestra para el Booking: {clean_booking}"
        )
    
    return {
        "booking": clean_booking,
        "orden_beta": pos.ORDEN_BETA if pos else "PENDIENTE",
        "dam": emb.dam if emb else "PENDIENTE",
        "contenedor": emb.contenedor if emb else "PENDIENTE",
        "status": "success"
    }

@router.get("/driver/{dni}")
def get_driver_data(dni: str, db: Session = Depends(get_db)):
    """Busca chofer en maestros por DNI."""
    clean_dni = dni.strip().upper()
    driver = db.query(Chofer).filter(Chofer.dni == clean_dni).first()
    
    if not driver:
        raise HTTPException(status_code=404, detail=f"Chofer con DNI {clean_dni} no registrado")
        
    return {
        "dni": driver.dni,
        "nombres": driver.nombres,
        "apellido_paterno": driver.apellido_paterno,
        "apellido_materno": driver.apellido_materno,
        "licencia": driver.licencia,
        "nombre_operativo": driver.nombre_operativo
    }

@router.get("/vehicle/{placa}")
def get_vehicle_data(placa: str, db: Session = Depends(get_db)):
    """Busca vehículo y su transportista por placa."""
    clean_placa = placa.strip().upper().replace("-", "")
    vehicle = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == clean_placa).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehículo con Placa {clean_placa} no registrado")
        
    return {
        "placa": vehicle.placa_tracto,
        "marca": vehicle.marca,
        "transportista": {
            "nombre_transportista": vehicle.transportista.nombre_transportista,
            "ruc": vehicle.transportista.ruc
        }
    }
@router.get("/trailer/{placa}")
def get_trailer_data(placa: str, db: Session = Depends(get_db)):
    """Busca carreta en maestros por placa."""
    clean_placa = placa.strip().upper().replace("-", "")
    trailer = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == clean_placa).first()
    
    if not trailer:
        raise HTTPException(status_code=404, detail=f"Carreta con Placa {clean_placa} no registrada")
        
    return {
        "placa": trailer.placa_carreta,
        "status": "success"
    }
