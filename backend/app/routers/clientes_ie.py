from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.maestros import ClienteIE, MaestroFito
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(
    prefix="/api/v1/maestros/clientes-ie",
    tags=["Maestros - Clientes IE"]
)

# --- Schemas ---
class MaestroFitoSchema(BaseModel):
    id: Optional[int] = None
    consignatario_fito: str
    direccion_fito: str

    class Config:
        from_attributes = True

class ClienteIESchema(BaseModel):
    id: Optional[int] = None
    nombre_legal: str
    cultivo: Optional[str] = None
    pais: str
    destino: str
    consignatario_bl: Optional[str] = None
    direccion_consignatario: Optional[str] = None
    notify_bl: Optional[str] = None
    direccion_notify: Optional[str] = None
    eori_consignatario: Optional[str] = None
    eori_notify: Optional[str] = None
    emision_bl: Optional[str] = None
    estado: Optional[str] = "ACTIVO"
    fito_id: Optional[int] = None
    fitosanitario: Optional[MaestroFitoSchema] = None

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/", response_model=List[ClienteIESchema])
def list_clientes_ie(db: Session = Depends(get_db)):
    """Listado completo de maestros de Clientes para Instrucciones de Embarque."""
    return db.query(ClienteIE).order_by(ClienteIE.nombre_legal.asc()).all()

@router.post("/")
def create_cliente_ie(req: ClienteIESchema, db: Session = Depends(get_db)):
    """Registro de nuevo cliente IE y gestión inteligente de Fitos."""
    # 1. Gestionar Fitosanitario
    fito_id = req.fito_id
    if req.fitosanitario:
        # Buscar si ya existe este fito
        existing_fito = db.query(MaestroFito).filter(
            MaestroFito.consignatario_fito == req.fitosanitario.consignatario_fito.upper(),
            MaestroFito.direccion_fito == req.fitosanitario.direccion_fito.upper()
        ).first()
        
        if existing_fito:
            fito_id = existing_fito.id
        else:
            new_fito = MaestroFito(
                consignatario_fito=req.fitosanitario.consignatario_fito.upper(),
                direccion_fito=req.fitosanitario.direccion_fito.upper()
            )
            db.add(new_fito)
            db.flush()
            fito_id = new_fito.id

    # 2. Crear Cliente
    new_cliente = ClienteIE(
        nombre_legal=req.nombre_legal.upper(),
        cultivo=req.cultivo.upper() if req.cultivo else None,
        pais=req.pais.upper(),
        destino=req.destino.upper() if req.destino else None,
        consignatario_bl=req.consignatario_bl.upper() if req.consignatario_bl else None,
        direccion_consignatario=req.direccion_consignatario.upper() if req.direccion_consignatario else None,
        notify_bl=req.notify_bl.upper() if req.notify_bl else None,
        direccion_notify=req.direccion_notify.upper() if req.direccion_notify else None,
        eori_consignatario=req.eori_consignatario.upper() if req.eori_consignatario else None,
        eori_notify=req.eori_notify.upper() if req.eori_notify else None,
        emision_bl=req.emision_bl.upper() if req.emision_bl else None,
        fito_id=fito_id
    )
    
    try:
        db.add(new_cliente)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error: Esta combinación de Cliente/Ruta ya existe")

    return {"status": "success", "id": new_cliente.id}

@router.put("/{id}")
def update_cliente_ie(id: int, req: ClienteIESchema, db: Session = Depends(get_db)):
    """Actualización integral de datos BL y Fitosanitarios."""
    cliente = db.query(ClienteIE).filter(ClienteIE.id == id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Maestro no encontrado")
    
    # Actualizar cabecera
    for key, value in req.dict(exclude={'id', 'fitosanitario'}).items():
        setattr(cliente, key, value.upper() if isinstance(value, str) else value)
    
    # Actualizar o Crear Fitosanitario
    if req.fitosanitario:
        if cliente.fitosanitario:
            cliente.fitosanitario.consignatario_fito = req.fitosanitario.consignatario_fito
            cliente.fitosanitario.direccion_consignatario_fito = req.fitosanitario.direccion_consignatario_fito
        else:
            new_fito = ClienteIEFito(
                cliente_ie_id=id,
                consignatario_fito=req.fitosanitario.consignatario_fito,
                direccion_consignatario_fito=req.fitosanitario.direccion_consignatario_fito
            )
            db.add(new_fito)
            
    db.commit()
    return {"status": "success"}

@router.patch("/{id}/toggle-status")
def toggle_cliente_ie_status(id: int, db: Session = Depends(get_db)):
    """Cambia el estado del cliente entre ACTIVO e INACTIVO."""
    cliente = db.query(ClienteIE).filter(ClienteIE.id == id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Maestro no encontrado")
    
    cliente.estado = "INACTIVO" if cliente.estado == "ACTIVO" else "ACTIVO"
    db.commit()
    return {"status": "success", "new_status": cliente.estado}

@router.delete("/{id}")
def delete_cliente_ie(id: int, db: Session = Depends(get_db)):
    """Eliminación lógica o física del maestro."""
    cliente = db.query(ClienteIE).filter(ClienteIE.id == id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Maestro no encontrado")
    
    db.delete(cliente) # Cascade borrará fito automáticamente
    db.commit()
    return {"status": "success"}

@router.get("/maestro-fitos", response_model=List[MaestroFitoSchema])
def list_maestro_fitos(db: Session = Depends(get_db)):
    """Listado de Fitos para selección en el catálogo."""
    return db.query(MaestroFito).all()

@router.post("/{id}/duplicate")
def duplicate_cliente_ie(id: int, db: Session = Depends(get_db)):
    """Clonación de maestros para facilitar la creación por nuevas rutas 💎."""
    original = db.query(ClienteIE).filter(ClienteIE.id == id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Maestro no encontrado")
    
    new_cliente = ClienteIE(
        nombre_legal=original.nombre_legal,
        cultivo=original.cultivo,
        pais=original.pais + " (CLONE)",
        destino=original.destino,
        consignatario_bl=original.consignatario_bl,
        direccion_consignatario=original.direccion_consignatario,
        notify_bl=original.notify_bl,
        direccion_notify=original.direccion_notify,
        eori_consignatario=original.eori_consignatario,
        eori_notify=original.eori_notify,
        emision_bl=original.emision_bl,
        fito_id=original.fito_id
    )
    db.add(new_cliente)
    db.commit()
    return {"status": "success", "new_id": new_cliente.id}
