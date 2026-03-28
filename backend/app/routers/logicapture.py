from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.posicionamiento import Posicionamiento
from app.models.embarque import ControlEmbarque
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
