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

# --- Utils ---
def safe_to_upper(val: str) -> str:
    if not val:
        return ""
    return "".join(c if c == 'ß' else c.upper() for c in str(val))

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
    destino: Optional[str] = None
    consignatario_bl: Optional[str] = None
    direccion_consignatario: Optional[str] = None
    notify_bl: Optional[str] = None
    direccion_notify: Optional[str] = None
    eori_consignatario: Optional[str] = None
    eori_notify: Optional[str] = None
    po: Optional[str] = None
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
            MaestroFito.consignatario_fito == safe_to_upper(req.fitosanitario.consignatario_fito),
            MaestroFito.direccion_fito == safe_to_upper(req.fitosanitario.direccion_fito)
        ).first()
        
        if existing_fito:
            fito_id = existing_fito.id
        else:
            new_fito = MaestroFito(
                consignatario_fito=safe_to_upper(req.fitosanitario.consignatario_fito),
                direccion_fito=safe_to_upper(req.fitosanitario.direccion_fito)
            )
            db.add(new_fito)
            db.flush()
            fito_id = new_fito.id

    # 2. Crear Cliente
    new_cliente = ClienteIE(
        nombre_legal=safe_to_upper(req.nombre_legal),
        cultivo=safe_to_upper(req.cultivo) if req.cultivo else None,
        pais=safe_to_upper(req.pais),
        destino=safe_to_upper(req.destino) if req.destino else None,
        consignatario_bl=safe_to_upper(req.consignatario_bl) if req.consignatario_bl else None,
        direccion_consignatario=safe_to_upper(req.direccion_consignatario) if req.direccion_consignatario else None,
        notify_bl=safe_to_upper(req.notify_bl) if req.notify_bl else None,
        direccion_notify=safe_to_upper(req.direccion_notify) if req.direccion_notify else None,
        eori_consignatario=safe_to_upper(req.eori_consignatario) if req.eori_consignatario else None,
        eori_notify=safe_to_upper(req.eori_notify) if req.eori_notify else None,
        po=safe_to_upper(req.po) if req.po else None,
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
    
    # Gestionar Fitosanitario primero
    fito_id = req.fito_id
    if req.fitosanitario:
        target_consig = safe_to_upper(req.fitosanitario.consignatario_fito)
        target_dir = safe_to_upper(req.fitosanitario.direccion_fito)
        
        # Buscar si esta combinación exacta ya existe en la base de datos
        existing_match = db.query(MaestroFito).filter(
            MaestroFito.consignatario_fito == target_consig,
            MaestroFito.direccion_fito == target_dir
        ).first()
        
        if existing_match:
            # Si existe, reutilizamos ese ID (evita UniqueViolation y no afecta a otros clientes)
            fito_id = existing_match.id
        else:
            # Si es totalmente nuevo, lo creamos
            new_fito = MaestroFito(
                consignatario_fito=target_consig,
                direccion_fito=target_dir
            )
            db.add(new_fito)
            db.flush()
            fito_id = new_fito.id
            
    # Actualizar campos de forma explícita 🎯
    cliente.nombre_legal = safe_to_upper(req.nombre_legal)
    cliente.cultivo = safe_to_upper(req.cultivo) if req.cultivo else None
    cliente.pais = safe_to_upper(req.pais)
    cliente.destino = safe_to_upper(req.destino) if req.destino else None
    cliente.consignatario_bl = safe_to_upper(req.consignatario_bl) if req.consignatario_bl else None
    cliente.direccion_consignatario = safe_to_upper(req.direccion_consignatario) if req.direccion_consignatario else None
    cliente.notify_bl = safe_to_upper(req.notify_bl) if req.notify_bl else None
    cliente.direccion_notify = safe_to_upper(req.direccion_notify) if req.direccion_notify else None
    cliente.eori_consignatario = safe_to_upper(req.eori_consignatario) if req.eori_consignatario else None
    cliente.eori_notify = safe_to_upper(req.eori_notify) if req.eori_notify else None
    cliente.po = safe_to_upper(req.po) if req.po else None
    cliente.fito_id = fito_id
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error: Esta combinación de Cliente/Ruta ya existe")

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
def list_maestro_fitos(q: Optional[str] = None, db: Session = Depends(get_db)):
    """Listado de Fitos para selección en el catálogo."""
    query = db.query(MaestroFito)
    if q:
        query = query.filter(MaestroFito.consignatario_fito.ilike(f"%{q}%"))
    return query.limit(10).all()

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
        po=original.po,
        fito_id=original.fito_id
    )
    db.add(new_cliente)
    db.commit()
    return {"status": "success", "new_id": new_cliente.id}
