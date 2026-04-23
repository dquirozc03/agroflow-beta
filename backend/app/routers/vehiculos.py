from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, condecimal
from decimal import Decimal

from app.database import get_db
from app.models.maestros import VehiculoTracto, VehiculoCarreta, Transportista
from app.utils.logging import logger

router = APIRouter(
    prefix="/api/v1/maestros/vehiculos",
    tags=["Vehiculos"]
)

# --- SCHEMAS ---
class VehiculoBase(BaseModel):
    transportista_id: int
    numero_ejes: Optional[int] = None
    estado: Optional[str] = "ACTIVO"

class TractoCreate(VehiculoBase):
    placa_tracto: str
    marca: Optional[str] = None
    peso_neto_tracto: Optional[Decimal] = None
    certificado_vehicular_tracto: Optional[str] = None
    largo_tracto: Optional[Decimal] = None
    ancho_tracto: Optional[Decimal] = None
    alto_tracto: Optional[Decimal] = None

class CarretaCreate(VehiculoBase):
    placa_carreta: str
    peso_neto_carreta: Optional[Decimal] = None
    certificado_vehicular_carreta: Optional[str] = None
    largo_carreta: Optional[Decimal] = None
    ancho_carreta: Optional[Decimal] = None
    alto_carreta: Optional[Decimal] = None

class TransportistaMinimal(BaseModel):
    id: int
    ruc: str
    nombre_transportista: str
    class Config:
        from_attributes = True

class TractoResponse(TractoCreate):
    id: int
    transportista: Optional[TransportistaMinimal] = None
    class Config:
        from_attributes = True

class CarretaResponse(CarretaCreate):
    id: int
    transportista: Optional[TransportistaMinimal] = None
    class Config:
        from_attributes = True

class PaginatedTractoResponse(BaseModel):
    items: List[TractoResponse]
    total: int
    page: int
    size: int
    total_pages: int

class PaginatedCarretaResponse(BaseModel):
    items: List[CarretaResponse]
    total: int
    page: int
    size: int
    total_pages: int

# --- ENDPOINTS TRACTOS ---

@router.get("/tractos", response_model=PaginatedTractoResponse)
def list_tractos(
    page: int = 1,
    size: int = 10,
    placa: Optional[str] = None,
    transportista_id: Optional[int] = None,
    incompletos: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    query = db.query(VehiculoTracto).join(Transportista)
    if placa:
        search = f"%{placa.strip().upper()}%"
        query = query.filter(
            (VehiculoTracto.placa_tracto.ilike(search)) |
            (Transportista.nombre_transportista.ilike(search))
        )
    if transportista_id:
        query = query.filter(VehiculoTracto.transportista_id == transportista_id)
        
    if incompletos:
        from sqlalchemy import or_
        query = query.filter(
            or_(
                VehiculoTracto.marca == None, VehiculoTracto.marca == "",
                VehiculoTracto.certificado_vehicular_tracto == None, VehiculoTracto.certificado_vehicular_tracto == "",
                VehiculoTracto.peso_neto_tracto == None,
                VehiculoTracto.largo_tracto == None,
                VehiculoTracto.ancho_tracto == None,
                VehiculoTracto.alto_tracto == None
            )
        )
        
    total = query.count()
    items = query.order_by(VehiculoTracto.placa_tracto.asc()).offset((page - 1) * size).limit(size).all()
    total_pages = (total + size - 1) // size if size > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.post("/tractos", response_model=TractoResponse)
def create_tracto(data: TractoCreate, db: Session = Depends(get_db)):
    # Validar duplicado
    existing = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == data.placa_tracto.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"La placa {data.placa_tracto} ya está registrada")
    
    # Validar transportista
    t = db.query(Transportista).filter(Transportista.id == data.transportista_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    new_v = VehiculoTracto(**data.model_dump())
    new_v.placa_tracto = data.placa_tracto.upper()
    db.add(new_v)
    db.commit()
    db.refresh(new_v)
    return new_v

# --- ENDPOINTS CARRETAS ---

@router.get("/carretas", response_model=PaginatedCarretaResponse)
def list_carretas(
    page: int = 1,
    size: int = 10,
    placa: Optional[str] = None,
    transportista_id: Optional[int] = None,
    incompletos: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    query = db.query(VehiculoCarreta).join(Transportista)
    if placa:
        search = f"%{placa.strip().upper()}%"
        query = query.filter(
            (VehiculoCarreta.placa_carreta.ilike(search)) |
            (Transportista.nombre_transportista.ilike(search))
        )
    if transportista_id:
        query = query.filter(VehiculoCarreta.transportista_id == transportista_id)
        
    if incompletos:
        from sqlalchemy import or_
        query = query.filter(
            or_(
                VehiculoCarreta.certificado_vehicular_carreta == None, VehiculoCarreta.certificado_vehicular_carreta == "",
                VehiculoCarreta.peso_neto_carreta == None,
                VehiculoCarreta.largo_carreta == None,
                VehiculoCarreta.ancho_carreta == None,
                VehiculoCarreta.alto_carreta == None
            )
        )
        
    total = query.count()
    items = query.order_by(VehiculoCarreta.placa_carreta.asc()).offset((page - 1) * size).limit(size).all()
    total_pages = (total + size - 1) // size if size > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.post("/carretas", response_model=CarretaResponse)
def create_carreta(data: CarretaCreate, db: Session = Depends(get_db)):
    # Validar duplicado
    existing = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == data.placa_carreta.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"La placa {data.placa_carreta} ya está registrada")
    
    # Validar transportista
    t = db.query(Transportista).filter(Transportista.id == data.transportista_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    new_v = VehiculoCarreta(**data.model_dump())
    new_v.placa_carreta = data.placa_carreta.upper()
    db.add(new_v)
    db.commit()
    db.refresh(new_v)
    return new_v

# --- ENDPOINTS GENERICOS EDICION ---

@router.patch("/{tipo}/{id}/estado")
def patch_estado_vehiculo(tipo: str, id: int, estado: str, db: Session = Depends(get_db)):
    if tipo == "tracto":
        v = db.query(VehiculoTracto).filter(VehiculoTracto.id == id).first()
    elif tipo == "carreta":
        v = db.query(VehiculoCarreta).filter(VehiculoCarreta.id == id).first()
    else:
        raise HTTPException(status_code=400, detail="Tipo de vehículo inválido")
    
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    v.estado = estado.upper()
    db.commit()
    return {"status": "success", "nuevo_estado": v.estado}

from fastapi import UploadFile, File
from app.services.ocr import ocr_service

@router.post("/ocr/tiv")
async def ocr_tiv(file: UploadFile = File(...)):
    """Scanner de Tarjeta de Identificación Vehicular (TIV)."""
    try:
        contents = await file.read()
        is_pdf = file.filename.lower().endswith('.pdf')
        raw_text = ocr_service.extract_text(contents, is_pdf=is_pdf)
        parsed_data = ocr_service.parse_tiv_data(raw_text)
        return {"status": "success", "data": parsed_data, "raw_text": raw_text}
    except Exception as e:
        logger.error(f"Error en OCR TIV: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{tipo}/{id}")
def update_vehiculo(tipo: str, id: int, data: dict, db: Session = Depends(get_db)):
    """Edición genérica de ficha técnica."""
    if tipo == "tracto":
        model = VehiculoTracto
    elif tipo == "carreta":
        model = VehiculoCarreta
    else:
        raise HTTPException(status_code=400, detail="Tipo de vehículo inválido")
    
    v = db.query(model).filter(model.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    for key, value in data.items():
        if hasattr(v, key):
            setattr(v, key, value)
    
    db.commit()
    db.refresh(v)
    return v
