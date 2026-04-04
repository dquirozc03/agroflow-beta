from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
import pandas as pd
import io
import re

from app.database import get_db
from app.models.maestros import Transportista, VehiculoTracto, VehiculoCarreta, Chofer
from app.models.embarque import ControlEmbarque, clean_container_code
from app.utils.logging import logger
from app.utils.formatters import clean_booking
from app.services.ocr import ocr_service
from pydantic import BaseModel

class TransportistaCreate(BaseModel):
    ruc: str
    nombre_transportista: str
    partida_registral: Optional[str] = None
    codigo_sap: Optional[str] = None
    estado: Optional[str] = "ACTIVO"

class TransportistaResponse(BaseModel):
    id: int
    ruc: str
    nombre_transportista: str
    partida_registral: Optional[str] = None
    codigo_sap: Optional[str] = None
    estado: str
    
    class Config:
        from_attributes = True

class ChoferCreate(BaseModel):
    dni: str
    nombres: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    licencia: Optional[str] = None
    estado: Optional[str] = "ACTIVO"

class ChoferResponse(ChoferCreate):
    id: int
    nombre_operativo: str
    
    class Config:
        from_attributes = True

class PaginatedChoferResponse(BaseModel):
    items: List[ChoferResponse]
    total: int
    page: int
    size: int
    total_pages: int

class EmbarqueCreate(BaseModel):
    booking: str
    dam: Optional[str] = None
    contenedor: str

class EmbarqueResponse(EmbarqueCreate):
    id: int
    
    class Config:
        from_attributes = True

class PaginatedEmbarqueResponse(BaseModel):
    items: List[EmbarqueResponse]
    total_records: int
    page: int
    total_pages: int

router = APIRouter(
    prefix="/api/v1/maestros",
    tags=["Maestros"]
)

def clean_plate(plate: str) -> str:
    """Elimina guiones y espacios de una placa, convirtiéndola a mayúsculas."""
    if not plate: return ""
    return re.sub(r'[^A-Z0-9]', '', str(plate).upper())

@router.post("/bulk-upload")
async def bulk_upload_transportistas(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Carga masiva de transportistas y vehículos desde el Excel 'ASIGNACION DE UNIDADES'.
    Mapeo:
    - Columna B (Indice 1): Booking
    - Columna C (Indice 2): DAM (Única)
    - Columna D (Indice 3): Contenedor
    - Columna E (Indice 4): Empresa de Transporte
    - Columna F (Indice 5): RUC
    - Columna G (Indice 6): Licencia
    - Columna H (Indice 7): Conductor
    - Columna I (Indice 8): Placas (Tracto/Carreta)
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")

    try:
        contents = await file.read()
        # 1. Ajuste de lectura: Saltamos hasta las cabeceras reales
        df = pd.read_excel(io.BytesIO(contents), header=None, skiprows=4)
        
        processed_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                # Extraer datos por índices corregidos según Excel
                ruc = str(row[5]).strip() if pd.notna(row[5]) else None
                nombre_empresa = str(row[4]).strip() if pd.notna(row[4]) else None
                licencia_raw = str(row[6]).strip() if pd.notna(row[6]) else None
                conductor_raw = str(row[7]).strip() if pd.notna(row[7]) else None
                placas_raw = str(row[8]).strip() if pd.notna(row[8]) else ""
                
                # Datos de Embarque
                booking_raw = str(row[1]).strip() if pd.notna(row[1]) else None
                dam_raw = str(row[2]).strip() if pd.notna(row[2]) else None
                contenedor_raw = str(row[3]).strip() if pd.notna(row[3]) else None

                # Saltar filas vacías o la fila de cabeceras
                if not ruc or ruc == "nan" or ruc.upper() == "RUC":
                    continue

                # 1. Buscar o Crear Transportista
                transportista = db.query(Transportista).filter(Transportista.ruc == ruc).first()
                if not transportista:
                    transportista = Transportista(
                        ruc=ruc,
                        nombre_transportista=nombre_empresa or "DESCONOCIDO",
                        estado="ACTIVO"
                    )
                    db.add(transportista)
                    db.flush() # Para obtener el ID
                else:
                    if nombre_empresa:
                        transportista.nombre_transportista = nombre_empresa
                
                # 2. Registrar/Actualizar Chofer
                if licencia_raw and licencia_raw.lower() != "nan":
                    # Extraer DNI de la licencia (limpiar caracteres no numéricos)
                    dni_extract = re.sub(r'[^0-9]', '', licencia_raw)
                    if len(dni_extract) >= 8:
                        # Si el DNI es muy largo (ej: 11 dígitos de RUC?), tomamos los últimos 8 o 9
                        dni_final = dni_extract[-8:] 
                        
                        chofer = db.query(Chofer).filter(Chofer.dni == dni_final).first()
                        
                        # Parsear nombre: Dividir por espacios
                        # Suponemos: [Nombres] [ApellidoPaterno] [ApellidoMaterno]
                        nombres_part = "CONDUCTOR"
                        ape_pat = "DESCONOCIDO"
                        ape_mat = ""
                        
                        if conductor_raw and conductor_raw.lower() != "nan":
                            words = conductor_raw.split()
                            if len(words) >= 3:
                                # Caso estándar JOSE SANTOS SALCEDO QUISPE
                                ape_mat = words[-1]
                                ape_pat = words[-2]
                                nombres_part = " ".join(words[:-2])
                            elif len(words) == 2:
                                ape_pat = words[-1]
                                nombres_part = words[0]
                            else:
                                nombres_part = words[0]
                        
                        if not chofer:
                            chofer = Chofer(
                                dni=dni_final,
                                nombres=nombres_part.upper(),
                                apellido_paterno=ape_pat.upper(),
                                apellido_materno=ape_mat.upper(),
                                licencia=licencia_raw.upper(),
                                estado="ACTIVO"
                            )
                            db.add(chofer)
                        else:
                            # Actualizar licencia y nombres si cambiaron
                            chofer.licencia = licencia_raw.upper()
                            chofer.nombres = nombres_part.upper()
                            chofer.apellido_paterno = ape_pat.upper()
                            chofer.apellido_materno = ape_mat.upper()

                # 3. Registrar/Actualizar Control de Embarque
                if dam_raw and dam_raw.lower() != "nan":
                    # DAM es única, buscamos si ya existe
                    embarque = db.query(ControlEmbarque).filter(ControlEmbarque.dam == dam_raw).first()
                    
                    if not embarque:
                        new_emb = ControlEmbarque(
                            booking=clean_booking(booking_raw) or "SIN BOOKING",
                            dam=dam_raw,
                            contenedor=contenedor_raw or "SIN CONTENEDOR"
                        )
                        db.add(new_emb)
                    else:
                        # Actualizar datos si la DAM ya existe
                        if booking_raw: embarque.booking = clean_booking(booking_raw)
                        if contenedor_raw: embarque.contenedor = clean_container_code(contenedor_raw)

                # 4. Procesar Placas (Tracto/Carreta)
                # Formato esperado: PLACA1/PLACA2 o solo PLACA1
                partes = placas_raw.split('/')
                placa_t = clean_plate(partes[0]) if len(partes) > 0 else ""
                placa_c = clean_plate(partes[1]) if len(partes) > 1 else ""

                # Registrar Tracto
                if placa_t:
                    tracto = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == placa_t).first()
                    if not tracto:
                        tracto = VehiculoTracto(
                            transportista_id=transportista.id,
                            placa_tracto=placa_t,
                            estado="ACTIVO"
                        )
                        db.add(tracto)
                    else:
                        tracto.transportista_id = transportista.id # Asegurar asociación

                # Registrar Carreta
                if placa_c:
                    carreta = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == placa_c).first()
                    if not carreta:
                        carreta = VehiculoCarreta(
                            transportista_id=transportista.id,
                            placa_carreta=placa_c,
                            estado="ACTIVO"
                        )
                        db.add(carreta)
                    else:
                        carreta.transportista_id = transportista.id # Asegurar asociación

                processed_count += 1

            except Exception as e:
                errors.append(f"Error en fila {index + 5}: {str(e)}")

        db.commit()
        return {
            "status": "success",
            "mensaje": f"Se procesaron {processed_count} filas exitosamente.",
            "errores": errors
        }

    except Exception as e:
        logger.error(f"Error crítico en carga masiva: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error procesando el archivo: {str(e)}")

@router.get("/transportistas", response_model=List[TransportistaResponse])
def list_transportistas(db: Session = Depends(get_db)):
    return db.query(Transportista).all()

@router.patch("/transportistas/{id}/estado")
def patch_estado_transportista(id: int, estado: str, db: Session = Depends(get_db)):
    t = db.query(Transportista).filter(Transportista.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    t.estado = estado.upper()
    db.commit()
    return {"status": "success", "nuevo_estado": t.estado}

@router.post("/transportistas")
def create_transportista(data: TransportistaCreate, db: Session = Depends(get_db)):
    # Verificar si ya existe el RUC
    existing = db.query(Transportista).filter(Transportista.ruc == data.ruc).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"El RUC {data.ruc} ya está registrado")
    
    new_t = Transportista(**data.model_dump())
    db.add(new_t)
    db.commit()
    db.refresh(new_t)
    return new_t

@router.put("/transportistas/{id}")
def update_transportista(id: int, data: TransportistaCreate, db: Session = Depends(get_db)):
    t = db.query(Transportista).filter(Transportista.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    for key, value in data.model_dump().items():
        setattr(t, key, value)
    
    db.commit()
    db.refresh(t)
    return t

@router.post("/ocr/transportista")
async def ocr_transportista(
    file: UploadFile = File(...),
):
    """
    Escaneo OCR de una Tarjeta de Circulación del MTC.
    """
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.pdf')):
        raise HTTPException(status_code=400, detail="Formato de archivo no soportado (PNG, JPG, PDF)")

    try:
        contents = await file.read()
        is_pdf = file.filename.lower().endswith('.pdf')
        
        # Invocación directa a la Inteligencia Artificial (Gemini Vision) especializada en MTC
        parsed_data = ocr_service.parse_transportista_data(
            contents, 
            is_pdf=is_pdf, 
            content_type=file.content_type
        )
        
        return {
            "status": "success",
            "data": parsed_data,
            "raw_text": "Análisis IA MTC completado exitosamente."
        }

    except Exception as e:
        logger.error(f"Error en OCR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINTS CHOFERES ---

@router.get("/choferes", response_model=PaginatedChoferResponse)
def list_choferes(
    page: int = 1, 
    size: int = 10, 
    q: Optional[str] = None, 
    order: str = "asc",
    db: Session = Depends(get_db)
):
    """Listado paginado con búsqueda y orden A-Z / Z-A."""
    query = db.query(Chofer)
    
    if q:
        search = f"%{q.strip().upper()}%"
        query = query.filter(
            (Chofer.nombres.ilike(search)) |
            (Chofer.apellido_paterno.ilike(search)) |
            (Chofer.apellido_materno.ilike(search)) |
            (Chofer.dni.ilike(search))
        )
    
    # Ordenamiento alfabético por nombres (Inge Daniel Special)
    if order.lower() == "desc":
        query = query.order_by(Chofer.nombres.desc())
    else:
        query = query.order_by(Chofer.nombres.asc())
        
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    
    total_pages = (total + size - 1) // size
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.post("/choferes", response_model=ChoferResponse)
def create_chofer(data: ChoferCreate, db: Session = Depends(get_db)):
    # Validar DNI único
    existing = db.query(Chofer).filter(Chofer.dni == data.dni).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"El DNI {data.dni} ya está registrado")
    
    new_c = Chofer(**data.model_dump())
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return new_c

@router.put("/choferes/{id}", response_model=ChoferResponse)
def update_chofer(id: int, data: ChoferCreate, db: Session = Depends(get_db)):
    c = db.query(Chofer).filter(Chofer.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")
    
    for key, value in data.model_dump().items():
        setattr(c, key, value)
    
    db.commit()
    db.refresh(c)
    return c

@router.patch("/choferes/{id}/estado")
def patch_estado_chofer(id: int, estado: str, db: Session = Depends(get_db)):
    c = db.query(Chofer).filter(Chofer.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")
    
    c.estado = estado.upper()
    db.commit()
    return {"status": "success", "nuevo_estado": c.estado}

@router.post("/ocr/licencia")
async def ocr_licencia(file: UploadFile = File(...)):
    """Scanner de Licencias de Conducir (Brevete)."""
    try:
        contents = await file.read()
        is_pdf = file.filename.lower().endswith('.pdf')
        
        # Invocación directa a la Inteligencia Artificial (Gemini Vision)
        parsed_data = ocr_service.parse_licencia_data(
            contents, 
            is_pdf=is_pdf, 
            content_type=file.content_type
        )
        
        return {
            "status": "success", 
            "data": parsed_data, 
            "raw_text": "Extraído mediante IA Gemini Vision 1.5 Flash"
        }
    except Exception as e:
        logger.error(f"Error crítico en OCR Licencia (Gemini): {e}")
        raise HTTPException(status_code=500, detail="Error al procesar identidad con IA.")
@router.post("/ocr/embarque")
async def ocr_embarque(file: UploadFile = File(...)):
    """
    Scanner de Control de Embarque:
    Busca patrones de DAM (18-20 chars) y Contenedor ISO (4 letras + 7 números).
    """
    try:
        contents = await file.read()
        is_pdf = file.filename.lower().endswith('.pdf')
        
        # Invocación directa a Gemini para análisis de documento logístico
        parsed_data = ocr_service.parse_embarque_data(
            contents, 
            is_pdf=is_pdf, 
            content_type=file.content_type
        )
        
        return {
            "status": "success",
            "data": parsed_data, # Contiene 'dam' y 'contenedor' detectados por IA
            "raw_text": "Análisis logístico IA completado."
        }
    except Exception as e:
        logger.error(f"Error en OCR Embarque (Gemini): {e}")
        raise HTTPException(status_code=500, detail="Fallo en análisis IA de embarque.")
@router.get("/embarques", response_model=PaginatedEmbarqueResponse)
def list_embarques(
    page: int = 1, 
    size: int = 10, 
    q: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """Listado paginado de contenedores y DAMs ordenados cronológicamente."""
    query = db.query(ControlEmbarque)
    
    if q:
        search = f"%{q.strip().upper()}%"
        query = query.filter(
            (ControlEmbarque.booking.ilike(search)) |
            (ControlEmbarque.dam.ilike(search)) |
            (ControlEmbarque.contenedor.ilike(search))
        )
        
    total_records = query.count()
    total_pages = (total_records + size - 1) // size
    
    items = query.order_by(ControlEmbarque.fecha_creacion.desc()).offset((page - 1) * size).limit(size).all()
    
    return {
        "items": items,
        "total_records": total_records,
        "page": page,
        "total_pages": total_pages
    }

@router.post("/embarques", response_model=EmbarqueResponse)
def create_embarque(data: EmbarqueCreate, db: Session = Depends(get_db)):
    # Validar DAM único (Solo si viene una DAM real)
    ignore_values = ["**", "***", "****", "-", "S/P", "N/A", "PENDIENTE", "", None]
    if data.dam and data.dam.strip().upper() not in ignore_values:
        existing = db.query(ControlEmbarque).filter(ControlEmbarque.dam == data.dam).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"La DAM {data.dam} ya está registrada")
    
    # Normalización de DAM: Si es vacío o marcador, guardar como None para evitar colisiones únicas
    clean_dam = data.dam.strip().upper() if data.dam else None
    if not clean_dam or clean_dam in ignore_values:
        clean_dam = None
        
    try:
        new_data = data.model_dump()
        new_data['dam'] = clean_dam
        new_data['booking'] = clean_booking(data.booking)
        
        new_e = ControlEmbarque(**new_data)
        db.add(new_e)
        db.commit()
        db.refresh(new_e)
        return new_e
    except Exception as e:
        db.rollback()
        logger.error(f"Error crítico guardando maestro: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno al guardar en Base de Datos. Verifique unicidad de datos.")

@router.put("/embarques/{id}", response_model=EmbarqueResponse)
def update_embarque(id: int, data: EmbarqueCreate, db: Session = Depends(get_db)):
    e = db.query(ControlEmbarque).filter(ControlEmbarque.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Embarque no encontrado")
    
    # Aplicar limpieza al contenedor explícitamente si se actualiza
    v_data = data.model_dump()
    v_data['contenedor'] = clean_container_code(v_data['contenedor'])
    v_data['booking'] = clean_booking(v_data['booking'])
    
    for key, value in v_data.items():
        setattr(e, key, value)
    
    db.commit()
    return e

@router.delete("/embarques/{id}")
def delete_embarque(id: int, db: Session = Depends(get_db)):
    e = db.query(ControlEmbarque).filter(ControlEmbarque.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Embarque no encontrado")
    
    db.delete(e)
    db.commit()
    return {"status": "success"}
