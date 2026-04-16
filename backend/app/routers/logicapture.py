from app.utils.formatters import clean_booking, clean_plate, clean_container, clean_dni, get_peru_time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from datetime import datetime
import pandas as pd
import io
from fastapi.responses import StreamingResponse
from openpyxl.worksheet.table import Table, TableStyleInfo
from app.models.posicionamiento import Posicionamiento
from app.models.embarque import ControlEmbarque
from app.models.maestros import Chofer, VehiculoTracto, VehiculoCarreta, Transportista
from app.models.logicapture import LogiCaptureRegistro, LogiCaptureDetalle
from pydantic import BaseModel
import os

router = APIRouter(
    prefix="/api/v1/logicapture",
    tags=["LogiCapture Core"]
)

class LogiCaptureSaveRequest(BaseModel):
    booking: str
    ordenBeta: Optional[str] = None
    contenedor: Optional[str] = None
    dam: Optional[str] = None
    dni: Optional[str] = None
    placaTracto: Optional[str] = None
    placaCarreta: Optional[str] = None
    empresa: Optional[str] = None
    precintoAduana: list[str] = []
    precintoOperador: list[str] = []
    precintoSenasa: list[str] = []
    precintoLinea: list[str] = []
    precintosBeta: list[str] = []
    termografos: list[str] = []
    tratamientoBuque: bool = False
    
    # Nuevos campos del ticket premium
    planta: Optional[str] = None
    cultivo: Optional[str] = None
    codigoSap: Optional[str] = None
    ruc_transportista: Optional[str] = None
    marca_tracto: Optional[str] = None
    cert_tracto: Optional[str] = None
    cert_carreta: Optional[str] = None
    fecha_embarque: Optional[str] = None # ISO Format
    
    # Nuevos campos v2
    nombreChofer: Optional[str] = None
    licenciaChofer: Optional[str] = None
    partidaRegistral: Optional[str] = None
    usuario_registro: Optional[str] = None # Auditoría preventiva 🕵️‍♂️

class LogiCaptureUpdateRequest(BaseModel):
    precintoAduana: Optional[list[str]] = None
    precintoOperador: Optional[list[str]] = None
    precintoSenasa: Optional[list[str]] = None
    precintoLinea: Optional[list[str]] = None
    precintosBeta: Optional[list[str]] = None
    termografos: Optional[list[str]] = None
    fecha_embarque: Optional[str] = None
    nombreChofer: Optional[str] = None
    dni: Optional[str] = None
    licenciaChofer: Optional[str] = None
    placaTracto: Optional[str] = None
    placaCarreta: Optional[str] = None
    empresa: Optional[str] = None
    partidaRegistral: Optional[str] = None
    # Auditoría de Despacho
    booking: Optional[str] = None
    ordenBeta: Optional[str] = None
    dam: Optional[str] = None
    contenedor: Optional[str] = None
    status: Optional[str] = None
    codigoSAP: Optional[str] = None
    planta: Optional[str] = None
    cultivo: Optional[str] = None

class Anexo1Request(BaseModel):
    peso_bruto: float
    peso_tara_contenedor: float
    peso_neto_carga: float
    is_especial: bool = False
    guia_remision: str = ""

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
    clean_booking_val = clean_booking(booking)
    
    # 1. Buscar en Posicionamientos (Orden Beta / Plan Maestro)
    pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == clean_booking_val).first()
    
    # 2. Buscar en Control de Embarque (DAM / Contenedor)
    emb = db.query(ControlEmbarque).filter(ControlEmbarque.booking == clean_booking_val).first()
    
    if not pos and not emb:
        raise HTTPException(
            status_code=404, 
            detail=f"No se encontró información maestra para el Booking: {clean_booking_val}"
        )
    
    return {
        "booking": clean_booking_val,
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
    clean_dni_val = clean_dni(dni)
    driver = db.query(Chofer).filter(Chofer.dni == clean_dni_val).first()
    
    if not driver:
        raise HTTPException(status_code=404, detail=f"Chofer con DNI {clean_dni_val} no registrado")
        
    return {
        "dni": driver.dni,
        "nombres": driver.nombres,
        "apellido_paterno": driver.apellido_paterno,
        "apellido_materno": driver.apellido_materno,
        "licencia": driver.licencia,
        "nombre_operativo": driver.nombre_operativo,
        "estado": driver.estado
    }

@router.get("/vehicle/{placa}")
def get_vehicle_data(placa: str, db: Session = Depends(get_db)):
    """Busca vehículo y su transportista por placa."""
    clean_placa_val = clean_plate(placa)
    vehicle = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == clean_placa_val).first()
    
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehículo con Placa {clean_placa_val} no registrado")
        
    return {
        "placa": vehicle.placa_tracto,
        "marca": vehicle.marca,
        "transportista": vehicle.transportista.nombre_transportista,
        "ruc_transportista": vehicle.transportista.ruc,
        "codigo_sap": vehicle.transportista.codigo_sap,
        "partida_registral": vehicle.transportista.partida_registral,
        "configuracion_vehicular": vehicle.certificado_vehicular_tracto,
        "peso_neto": vehicle.peso_neto_tracto,
        "numero_ejes": vehicle.numero_ejes
    }
@router.get("/check_unique")
def check_data_unique(field: str, value: str, treatment_buque: bool = False, db: Session = Depends(get_db)):
    """Verifica si un dato ya existe en la tabla de registros operativos."""
    clean_val = clean_container(value) if "contenedor" in field else value.strip().upper()
    
    if clean_val in ["**", "***", "****", "-", "S/P", "N/A", "PENDIENTE"]:
        return {"field": field, "exists": False, "id": None}
    if field == "booking" and not treatment_buque:
        exists = db.query(LogiCaptureRegistro).filter(
            LogiCaptureRegistro.booking == clean_val,
            LogiCaptureRegistro.status != "ANULADO"
        ).first()
    elif field == "dam":
        exists = db.query(LogiCaptureRegistro).filter(
            LogiCaptureRegistro.dam == clean_val,
            LogiCaptureRegistro.status != "ANULADO"
        ).first()
    elif field == "contenedor":
        exists = db.query(LogiCaptureRegistro).filter(
            LogiCaptureRegistro.contenedor == clean_val,
            LogiCaptureRegistro.status != "ANULADO"
        ).first()
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
    clean_placa = clean_plate(placa)
    trailer = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == clean_placa).first()
    
    if not trailer:
        raise HTTPException(status_code=404, detail=f"Carreta con Placa {clean_placa} no registrada")
        
    return {
        "placa": trailer.placa_carreta,
        "configuracion_vehicular": trailer.certificado_vehicular_carreta,
        "peso_neto": trailer.peso_neto_carreta,
        "numero_ejes": trailer.numero_ejes
    }
        
@router.get("/drivers/search")
def search_drivers(q: str, db: Session = Depends(get_db)):
    """Busca choferes por coincidencia de nombre o DNI."""
    results = db.query(Chofer).filter(
        (Chofer.nombres.ilike(f"%{q}%")) | 
        (Chofer.dni.ilike(f"%{q}%")) |
        (Chofer.apellido_paterno.ilike(f"%{q}%"))
    ).limit(10).all()
    
    return [
        {
            "dni": d.dni,
            "nombre": f"{d.nombres} {d.apellido_paterno} {d.apellido_materno or ''}".strip(),
            "nombre_operativo": d.nombre_operativo,
            "licencia": d.licencia
        } for d in results
    ]

@router.get("/vehicles/tracto/search")
def search_tractos(q: str, db: Session = Depends(get_db)):
    """Busca tractos por placa."""
    results = db.query(VehiculoTracto).filter(
        VehiculoTracto.placa_tracto.ilike(f"%{q}%")
    ).limit(10).all()
    
    return [
        {
            "placa": v.placa_tracto,
            "marca": v.marca,
            "transportista": v.transportista.nombre_transportista if v.transportista else "S/N",
            "codigo_sap": v.transportista.codigo_sap if v.transportista else None,
            "partida_registral": v.transportista.partida_registral if v.transportista else None
        } for v in results
    ]

@router.get("/vehicles/carreta/search")
def search_carretas(q: str, db: Session = Depends(get_db)):
    """Busca carretas por placa."""
    results = db.query(VehiculoCarreta).filter(
        VehiculoCarreta.placa_carreta.ilike(f"%{q}%")
    ).limit(10).all()
    
    return [
        {
            "placa": v.placa_carreta,
            "transportista": v.transportista.nombre_transportista if v.transportista else "S/N"
        } for v in results
    ]

@router.get("/bookings/search")
def search_bookings(q: str, db: Session = Depends(get_db)):
    """Busca bookings en maestros y cruza con posicionamiento."""
    clean_q = clean_booking(q)
    results = db.query(ControlEmbarque).filter(
        ControlEmbarque.booking.ilike(f"%{clean_q}%")
    ).limit(10).all()
    
    output = []
    for b in results:
        # Intentar jalar Orden Beta desde Posicionamiento
        pos = db.query(Posicionamiento).filter(
            Posicionamiento.BOOKING == b.booking
        ).first()
        
        output.append({
            "booking": b.booking,
            "dam": b.dam,
            "contenedor": b.contenedor,
            "orden_beta": pos.ORDEN_BETA if pos else "PENDIENTE",
            "planta": pos.PLANTA_LLENADO if pos else None,
            "cultivo": pos.CULTIVO if pos else None
        })
    return output

@router.post("/register")
def register_logicapture_data(req: LogiCaptureSaveRequest, db: Session = Depends(get_db)):
    """Guarda registro final de LogiCapture con validaciones de unicidad."""
    
    # 1. Validar Unicidad de Cabecera (DAM / Contenedor) - Solo registros activos
    # Carlos Style 💎: No validamos duplicidad para valores que indican "vacío" o "no aplica"
    ignore_values = ["**", "***", "****", "-", "S/P", "N/A", "PENDIENTE", "", None]
    
    if req.dam and req.dam.strip().upper() not in ignore_values:
        existing_dam = db.query(LogiCaptureRegistro).filter(
            LogiCaptureRegistro.dam == req.dam,
            LogiCaptureRegistro.status != "ANULADO"
        ).first()
        if existing_dam:
            raise HTTPException(status_code=400, detail=f"La DAM {req.dam} ya cuenta con un registro de salida.")
        
    existing_cnt = db.query(LogiCaptureRegistro).filter(
        LogiCaptureRegistro.contenedor == req.contenedor,
        LogiCaptureRegistro.status != "ANULADO"
    ).first()
    if existing_cnt:
        raise HTTPException(status_code=400, detail=f"El contenedor {req.contenedor} ya cuenta con un registro de salida activo.")

    # 1.5 Validar Unicidad de Booking (Solo si NO es Tratamiento en Buque)
    if not req.tratamientoBuque:
        existing_bk = db.query(LogiCaptureRegistro).filter(
            LogiCaptureRegistro.booking == req.booking,
            LogiCaptureRegistro.status != "ANULADO"
        ).first()
        if existing_bk:
            raise HTTPException(status_code=400, detail=f"El Booking {req.booking} ya fue registrado anteriormente. Si es una carga compartida, active 'Tratamiento en Buque'.")

    # 2. Validar Unicidad de Precintos/Termógrafos (Excluyendo 'no aplica')
    codes_to_check = (req.precintoAduana + req.precintoOperador + req.precintoSenasa + 
                      req.precintoLinea + req.precintosBeta + req.termografos)
    
    # Carlos Style 💎: No validamos duplicidad para valores que indican "vacío" o "no aplica"
    ignore_values = ["**", "***", "****", "-", "S/P", "N/A", "PENDIENTE", ""]
    codes_to_check = [c.strip().upper() for c in codes_to_check if c.strip().upper() not in ignore_values]
    
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
        codigo_sap=req.codigoSap,
        ruc_transportista=req.ruc_transportista,
        marca_tracto=req.marca_tracto,
        cert_tracto=req.cert_tracto,
        cert_carreta=req.cert_carreta,
        fecha_embarque=datetime.fromisoformat(req.fecha_embarque.replace('Z', '+00:00')) if req.fecha_embarque else None,
        status="PENDIENTE",
        nombre_chofer=req.nombreChofer,
        licencia_chofer=req.licenciaChofer,
        partida_registral=req.partidaRegistral,
        usuario_registro=req.usuario_registro # Enlace de autoría 🕵️‍♂️🖋️
    )
    db.add(new_reg)
    db.commit() # Commit inicial para obtener id
    db.refresh(new_reg)

    # 3.5 Sincronización Inversa (Retro-alimentación al Maestro)
    if req.dam and req.dam.strip().upper() not in ["**", "***", "****", "-", "S/P", "N/A", "PENDIENTE", ""]:
        emb = db.query(ControlEmbarque).filter(
            ControlEmbarque.booking == req.booking,
            ControlEmbarque.contenedor == req.contenedor
        ).first()
        if emb and (not emb.dam or emb.dam in ["PENDIENTE", "S/P", "-"]):
            emb.dam = req.dam
            db.commit()

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

    codigos_procesados_en_request = set()
    for tipo, codes in category_map.items():
        for code in codes:
            if not code:
                continue
            code_upper = code.strip().upper()
            if code_upper in ignore_values:
                continue
            
            if code_upper in codigos_procesados_en_request:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail=f"Error: El código '{code_upper}' se ha ingresado varias veces en la misma actualización."
                )
            codigos_procesados_en_request.add(code_upper)

            details.append(LogiCaptureDetalle(
                registro_id=new_reg.id,
                categoria="PRECINTO" if tipo != "TERMOGRAFO" else "TERMOGRAFO",
                tipo=tipo,
                codigo=code_upper
            ))
    
    if details:
        db.add_all(details)
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail="Error de integridad en base de datos. Se enviaron códigos duplicados."
            )

    return {"status": "success", "id": new_reg.id}

@router.post("/bulk_sync")
def bulk_sync_masters(db: Session = Depends(get_db)):
    """Sincronización masiva interna para optimizar rendimiento y evitar CORS 💎."""
    from sqlalchemy import or_
    
    # 1. Traer registros procesados que les falta Código SAP o Partida
    registros = db.query(LogiCaptureRegistro).filter(
        LogiCaptureRegistro.status == "PROCESADO",
        or_(
            LogiCaptureRegistro.codigo_sap == None,
            LogiCaptureRegistro.codigo_sap == "-",
            LogiCaptureRegistro.codigo_sap == "",
            LogiCaptureRegistro.partida_registral == None,
            LogiCaptureRegistro.partida_registral == "-",
            LogiCaptureRegistro.partida_registral == ""
        )
    ).all()
    
    updated_count = 0
    for reg in registros:
        if not reg.placa_tracto:
            continue
            
        # Limpiar placa y buscar en el maestro de tractos
        placa_clean = clean_plate(reg.placa_tracto)
        vehiculo = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == placa_clean).first()
        
        if vehiculo and vehiculo.transportista:
            # Solo actualizar si hay info útil en el maestro
            has_master_data = (vehiculo.transportista.codigo_sap and vehiculo.transportista.codigo_sap != "-") or \
                              (vehiculo.transportista.partida_registral and vehiculo.transportista.partida_registral != "-")
            
            if has_master_data:
                reg.codigo_sap = vehiculo.transportista.codigo_sap or "-"
                reg.partida_registral = vehiculo.transportista.partida_registral or "-"
                reg.empresa_transporte = vehiculo.transportista.nombre_transportista
                updated_count += 1
            
    if updated_count > 0:
        db.commit()
        
    return {
        "status": "success", 
        "updated": updated_count, 
        "total_eligible": len(registros)
    }

@router.get("/registros")
def list_registros(
    page: int = 1, 
    size: int = 10,
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
    items = query.order_by(LogiCaptureRegistro.fecha_registro.desc()).offset((page - 1) * size).limit(size).all()
    
    total_pages = (total + size - 1) // size if size > 0 else 1
    
    return {
        "total": total,
        "page": page,
        "total_pages": total_pages,
        "items": items
    }

@router.get("/registros/{id}")
def get_registro(id: int, db: Session = Depends(get_db)):
    """Obtención de un registro específico para auditoría/edición."""
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return reg

@router.put("/registros/{id}")
def update_registro(id: int, req: LogiCaptureUpdateRequest, db: Session = Depends(get_db)):
    """Edición técnica de registros (Auditoría Dirigida) 💎."""
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    # 1. Actualizar Precintos si vienen en el body
    if req.precintoAduana is not None: reg.precinto_aduana = req.precintoAduana
    if req.precintoOperador is not None: reg.precinto_operador = req.precintoOperador
    if req.precintoSenasa is not None: reg.precinto_senasa = req.precintoSenasa
    if req.precintoLinea is not None: reg.precinto_linea = req.precintoLinea
    if req.precintosBeta is not None: reg.precintos_beta = req.precintosBeta
    if req.termografos is not None: reg.termografos = req.termografos
    
    # 2. Fecha de Embarque
    if req.fecha_embarque:
        try:
            reg.fecha_embarque = datetime.fromisoformat(req.fecha_embarque.replace('Z', '+00:00'))
        except:
            pass
            
    # 3. Datos Maestros (Auditoría de Transporte)
    if req.nombreChofer is not None: reg.nombre_chofer = req.nombreChofer
    if req.dni is not None: reg.dni_chofer = req.dni
    if req.licenciaChofer is not None: reg.licencia_chofer = req.licenciaChofer
    if req.placaTracto is not None: reg.placa_tracto = req.placaTracto
    if req.placaCarreta is not None: reg.placa_carreta = req.placaCarreta
    if req.empresa is not None: reg.empresa_transporte = req.empresa
    if req.partidaRegistral is not None: reg.partida_registral = req.partidaRegistral
    if req.codigoSAP is not None: reg.codigo_sap = req.codigoSAP

    # 3.5 Datos de Despacho (Auditoría de Carga)
    if req.booking is not None: reg.booking = req.booking
    if req.ordenBeta is not None: reg.orden_beta = req.ordenBeta
    if req.dam is not None: reg.dam = req.dam
    if req.contenedor is not None: reg.contenedor = req.contenedor
    if req.planta is not None: reg.planta = req.planta
    if req.cultivo is not None: reg.cultivo = req.cultivo
    if req.contenedor: reg.contenedor = req.contenedor
        
    # Cambio de Estatus (Fase 3 Industrial)
    if req.status:
        clean_status = req.status.upper()
        reg.status = clean_status
        if clean_status == "ANULADO":
             db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.registro_id == id).delete()

    # 4. Sincronización con LogiCaptureDetalle (Blindaje de Unicidad) 💎
    # Si hubo cambios en precintos o termógrafos, refrescamos la tabla de detalles
    if any([
        req.precintoAduana is not None, req.precintoOperador is not None,
        req.precintoSenasa is not None, req.precintoLinea is not None,
        req.precintosBeta is not None, req.termografos is not None
    ]):
        # a. Limpiar detalles previos asociados a esta salida
        db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.registro_id == id).delete()
        
        # b. Re-mapear y re-validar códigos actuales (post-edición)
        mapeo_detalles = [
            ("ADUANA", reg.precinto_aduana or []),
            ("OPERADOR", reg.precinto_operador or []),
            ("SENASA", reg.precinto_senasa or []),
            ("LINEA", reg.precinto_linea or []),
            ("BETA", reg.precintos_beta or []),
            ("TERMOGRAFO", reg.termografos or [])
        ]
        
        ignore_values = ["**", "***", "****", "-", "S/P", "N/A", "PENDIENTE", ""]
        nuevos_detalles = []
        codigos_procesados_en_request = set()
        for tipo, codigos in mapeo_detalles:
            cat = "TERMOGRAFO" if tipo == "TERMOGRAFO" else "PRECINTO"
            for code in codigos:
                if not code: continue
                code_upper = code.strip().upper()
                if code_upper in ignore_values: continue
                
                if code_upper in codigos_procesados_en_request:
                    db.rollback()
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Error: El código '{code_upper}' se ha ingresado varias veces en la misma actualización."
                    )
                codigos_procesados_en_request.add(code_upper)

                # c. Blindaje contra duplicados sistémicos
                duplicado = db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.codigo == code_upper).first()
                if duplicado:
                    db.rollback()
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Error: El código '{code_upper}' ya está siendo usado en otro registro activo."
                    )
                
                nuevos_detalles.append(LogiCaptureDetalle(
                    registro_id=id,
                    categoria=cat,
                    tipo=tipo,
                    codigo=code_upper
                ))
        
        if nuevos_detalles:
            db.add_all(nuevos_detalles)

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Error de integridad en base de datos. Se enviaron códigos duplicados."
        )

    # 5. Sincronización Inversa (Retro-alimentación al Maestro)
    if reg.dam and reg.dam.strip().upper() not in ["**", "***", "****", "-", "S/P", "N/A", "PENDIENTE", ""]:
        emb = db.query(ControlEmbarque).filter(
            ControlEmbarque.booking == reg.booking,
            ControlEmbarque.contenedor == reg.contenedor
        ).first()
        if emb and (not emb.dam or emb.dam in ["PENDIENTE", "S/P", "-"]):
            emb.dam = reg.dam
            db.commit()

    return {"status": "success", "message": "Datos de auditoría actualizados correctamente 💎"}

@router.patch("/registros/{id}/status")
def change_registro_status(id: int, status: str, motivo: Optional[str] = None, db: Session = Depends(get_db)):
    """Cambio de estado administrativo (Cerrar/Anular) con trazabilidad de motivo."""
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    clean_status = status.upper()
    if clean_status not in ["PENDIENTE", "PROCESADO", "ANULADO"]:
        raise HTTPException(status_code=400, detail="Estatus no válido")
        
    reg.status = clean_status
    if clean_status == "ANULADO":
        reg.motivo_anulacion = motivo or "N/A"
        # Liberación de Precintos y Termógrafos 💎
        # Al anular, permitimos que estos códigos vuelvan a ser usados en el formulario
        db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.registro_id == id).delete()
        
    db.commit()
    return {"status": "success", "message": f"Registro marcado como {clean_status}"}

@router.get("/export/excel")
def export_to_excel(db: Session = Depends(get_db)):
    """Generación de reporte Excel Premium con formateo de tabla y auto-ajuste."""
    from app.services.logicapture_service import LogiCaptureService
    output = LogiCaptureService.generate_excel_report(db)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=LogiCapture_Auditoria_{get_peru_time().strftime('%Y%m%d')}.xlsx"}
    )

@router.post("/registros/{id}/anexo1")
def generate_anexo1(id: int, req: Anexo1Request, db: Session = Depends(get_db)):
    """
    Endpoint de Pesaje y Generación de Anexo 1.
    Sincroniza pesos reales y genera el documento legal MTC.
    """
    import traceback
    try:
        from app.services.pesos_medidas_service import generate_anexo_1_pdf
        
        reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
        if not reg:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
            
        # 1. Persistir pesos y guía en la base de datos 💾
        reg.peso_bruto = req.peso_bruto
        reg.peso_tara_contenedor = req.peso_tara_contenedor
        reg.peso_neto_carga = req.peso_neto_carga
        reg.num_guia = req.guia_remision # Persistencia del correlativo 📋
        db.commit()
        
        # 2. Generar PDF usando el motor ReportLab
        file_path = generate_anexo_1_pdf(db, id, is_especial=req.is_especial, guia_remision=req.guia_remision)
        if not file_path or not os.path.exists(file_path):
             raise HTTPException(status_code=500, detail="Error crítico al generar el Anexo 1 PDF")

        def iterfile():
            try:
                with open(file_path, mode="rb") as file_like:
                    yield from file_like
            finally:
                # Limpieza de archivo temporal
                if os.path.exists(file_path):
                    try: os.remove(file_path)
                    except: pass

        return StreamingResponse(
            iterfile(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="PesosYMedidas_{reg.orden_beta or "SIN_ORDEN"}.pdf"',
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Expose-Headers": "Content-Disposition",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        # Diagnóstico: devuelve el error REAL al frontend
        error_detail = traceback.format_exc()
        print(f"ERROR ANEXO1: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")
