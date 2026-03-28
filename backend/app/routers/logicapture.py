from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from datetime import datetime
import pandas as pd
import io
from fastapi.responses import StreamingResponse
from app.models.posicionamiento import Posicionamiento
from app.models.embarque import ControlEmbarque
from app.models.maestros import Chofer, VehiculoTracto, VehiculoCarreta, Transportista
from app.models.logicapture import LogiCaptureRegistro, LogiCaptureDetalle
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/logicapture",
    tags=["LogiCapture Core"]
)

class LogiCaptureSaveRequest(BaseModel):
    booking: str
    ordenBeta: str
    contenedor: str
    dam: str
    dni: str
    placaTracto: str
    placaCarreta: str
    empresa: str
    precintoAduana: list[str]
    precintoOperador: list[str]
    precintoSenasa: list[str]
    precintoLinea: list[str]
    precintosBeta: list[str]
    termografos: list[str]
    tratamientoBuque: bool = False
    
    # Nuevos campos del ticket premium
    planta: Optional[str] = None
    cultivo: Optional[str] = None
    codigo_sap: Optional[str] = None
    ruc_transportista: Optional[str] = None
    marca_tracto: Optional[str] = None
    cert_tracto: Optional[str] = None
    cert_carreta: Optional[str] = None
    fecha_embarque: Optional[str] = None # ISO Format
    
    # Nuevos campos v2
    nombreChofer: Optional[str] = None
    licenciaChofer: Optional[str] = None
    partidaRegistral: Optional[str] = None

class LookupResponse(BaseModel):
    booking: str
    orden_beta: Optional[str] = None
    dam: Optional[str] = None
    contenedor: Optional[str] = None
    status: str
    planta: Optional[str] = None
    cultivo: Optional[str] = None
    codigo_sap: Optional[str] = None

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
        # Jalar desde posicionamiento real
        "planta": pos.PLANTA_LLENADO if pos else None,
        "cultivo": pos.CULTIVO if pos else None,
        "codigo_sap": getattr(pos, 'CODIGO_SAP', None), # Si existe en el modelo
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
            "ruc_transportista": vehicle.transportista.ruc,
            "codigo_sap": vehicle.transportista.codigo_sap,
            "partida_registral": vehicle.transportista.partida_registral
        },
        "configuracion_vehicular": vehicle.certificado_vehicular_tracto
    }
@router.get("/check_unique")
def check_data_unique(field: str, value: str, treatment_buque: bool = False, db: Session = Depends(get_db)):
    """Verifica si un dato ya existe en la tabla de registros operativos."""
    clean_val = value.strip().upper()
    
    if clean_val == "**":
        return {"field": field, "exists": False, "id": None}
    if field == "booking" and not treatment_buque:
        exists = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.booking == clean_val).first()
    elif field == "dam":
        exists = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.dam == clean_val).first()
    elif field == "contenedor":
        exists = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.contenedor == clean_val).first()
    elif field in ["precinto", "termografo"]:
        # Buscar en la tabla de blindaje detallado
        det = db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.codigo == clean_val).first()
        if det:
            # Si existe en detalles, devolvemos el registro padre
            exists = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == det.registro_id).first()
        else:
            exists = None
    else:
        exists = None

    return {
        "field": field,
        "exists": exists is not None,
        "id": exists.id if exists else None
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

@router.post("/register")
def register_logicapture_data(req: LogiCaptureSaveRequest, db: Session = Depends(get_db)):
    """Guarda registro final de LogiCapture con validaciones de unicidad."""
    
    # 1. Validar Unicidad de Cabecera (DAM / Contenedor)
    existing_dam = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.dam == req.dam).first()
    if existing_dam:
        raise HTTPException(status_code=400, detail=f"La DAM {req.dam} ya cuenta con un registro de salida.")
        
    existing_cnt = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.contenedor == req.contenedor).first()
    if existing_cnt:
        raise HTTPException(status_code=400, detail=f"El contenedor {req.contenedor} ya cuenta con un registro de salida activo.")

    # 1.5 Validar Unicidad de Booking (Solo si NO es Tratamiento en Buque)
    if not req.tratamientoBuque:
        existing_bk = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.booking == req.booking).first()
        if existing_bk:
            raise HTTPException(status_code=400, detail=f"El Booking {req.booking} ya fue registrado anteriormente. Si es una carga compartida, active 'Tratamiento en Buque'.")

    # 2. Validar Unicidad de Precintos/Termógrafos
    codes_to_check = (req.precintoAduana + req.precintoOperador + req.precintoSenasa + 
                      req.precintoLinea + req.precintosBeta + req.termografos)
    
    if codes_to_check:
        dup = db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.codigo.in_(codes_to_check)).first()
        if dup:
            raise HTTPException(status_code=400, detail=f"El código de precinto/termógrafo '{dup.codigo}' ya fue utilizado en otra operación.")

    # 3. Guardar Cabecera
    new_reg = LogiCaptureRegistro(
        booking=req.booking,
        orden_beta=req.ordenBeta,
        contenedor=req.contenedor,
        dam=req.dam,
        dni_chofer=req.dni,
        placa_tracto=req.placaTracto,
        placa_carreta=req.placaCarreta,
        empresa_transporte=req.empresa,
        precinto_aduana=req.precintoAduana,
        precinto_operador=req.precintoOperador,
        precinto_senasa=req.precintoSenasa,
        precinto_linea=req.precintoLinea,
        precintos_beta=req.precintosBeta,
        termografos=req.termografos,
        tratamiento_buque=req.tratamientoBuque,
        # Nuevos campos del ticket premium
        planta=req.planta,
        cultivo=req.cultivo,
        codigo_sap=req.codigo_sap,
        ruc_transportista=req.ruc_transportista,
        marca_tracto=req.marca_tracto,
        cert_tracto=req.cert_tracto,
        cert_carreta=req.cert_carreta,
        fecha_embarque=datetime.fromisoformat(req.fecha_embarque.replace('Z', '+00:00')) if req.fecha_embarque else None,
        status="PENDIENTE",
        nombre_chofer=req.nombreChofer,
        licencia_chofer=req.licenciaChofer,
        partida_registral=req.partidaRegistral
    )
    db.add(new_reg)
    db.commit() # Commit inicial para obtener id
    db.refresh(new_reg)

    # 4. Guardar Detalles de Unicidad
    # Por cada categoría guardamos en la tabla de blindaje
    details = []
    category_map = {
        "ADUANA": req.precintoAduana,
        "OPERADOR": req.precintoOperador,
        "SENASA": req.precintoSenasa,
        "LINEA": req.precintoLinea,
        "BETA": req.precintosBeta,
        "TERMOGRAFO": req.termografos
    }

    for tipo, codes in category_map.items():
        for code in codes:
            details.append(LogiCaptureDetalle(
                registro_id=new_reg.id,
                categoria="PRECINTO" if tipo != "TERMOGRAFO" else "TERMOGRAFO",
                tipo=tipo,
                codigo=code
            ))
    
    if details:
        db.add_all(details)
        db.commit()

    return {"status": "success", "id": new_reg.id}

@router.get("/registros")
def list_registros(
    page: int = 1, 
    planta: Optional[str] = None, 
    cultivo: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Listado paginado de registros con filtros operativos."""
    query = db.query(LogiCaptureRegistro)
    
    if planta: query = query.filter(LogiCaptureRegistro.planta == planta)
    if cultivo: query = query.filter(LogiCaptureRegistro.cultivo == cultivo)
    if status: query = query.filter(LogiCaptureRegistro.status == status)
    
    total = query.count()
    registros = query.order_by(LogiCaptureRegistro.fecha_registro.desc()).offset((page - 1) * 10).limit(10).all()
    
    return {
        "total": total,
        "page": page,
        "items": registros
    }

@router.put("/registros/{id}")
def update_registro(id: int, req: LogiCaptureSaveRequest, db: Session = Depends(get_db)):
    """Edición de registros (Principalmente para corregir precintos y transporte)."""
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    # Actualizar campos permitidos
    reg.precinto_aduana = req.precintoAduana
    reg.precinto_operador = req.precintoOperador
    reg.precinto_senasa = req.precintoSenasa
    reg.precinto_linea = req.precintoLinea
    reg.precintos_beta = req.precintosBeta
    reg.termografos = req.termografos
    
    if req.fecha_embarque:
        reg.fecha_embarque = datetime.fromisoformat(req.fecha_embarque.replace('Z', '+00:00'))
        
    db.commit()
    return {"status": "success", "message": "Registro actualizado correctamente"}

@router.patch("/registros/{id}/status")
def change_registro_status(id: int, status: str, db: Session = Depends(get_db)):
    """Cambio de estado administrativo (Cerrar/Anular)."""
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    clean_status = status.upper()
    if clean_status not in ["PENDIENTE", "PROCESADO", "ANULADO"]:
        raise HTTPException(status_code=400, detail="Estatus no válido")
        
    reg.status = clean_status
    db.commit()
    return {"status": "success", "message": f"Registro marcado como {clean_status}"}

@router.get("/export/excel")
def export_to_excel(db: Session = Depends(get_db)):
    """Generación de reporte Excel Premium con formateo de tabla."""
    regs = db.query(LogiCaptureRegistro).all()
    
    data = []
    for r in regs:
        # Aplanar precintos para el excel
        precintos_aduana = ", ".join(r.precinto_aduana) if r.precinto_aduana else "-"
        # ... simplified for briefness in dev note, full mapping below
        data.append({
            "FECHA REGISTRO": r.fecha_registro.strftime("%Y-%m-%d %H:%M") if r.fecha_registro else "-",
            "PLANTA": r.planta or "-",
            "CULTIVO": r.cultivo or "-",
            "BOOKING": r.booking,
            "ORDEN BETA": r.orden_beta,
            "CONTENEDOR": r.contenedor,
            "DAM": r.dam,
            "TRACTO": r.placa_tracto,
            "CARRETA": r.placa_carreta,
            "CHOFER": r.dni_chofer,
            "TRANSPORTISTA": r.empresa_transporte,
            "P. ADUANA": precintos_aduana,
            "STATUS": r.status
        })
    
    df = pd.DataFrame(data)
    
    # Crear Excel en memoria
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='LogiCapture_Auditoria')
        
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=LogiCapture_Auditoria.xlsx"}
    )
