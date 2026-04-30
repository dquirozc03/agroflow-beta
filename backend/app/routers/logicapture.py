from app.utils.formatters import clean_booking, clean_plate, clean_container, clean_dni
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
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
from app.models.maestros import Chofer, VehiculoTracto, VehiculoCarreta, Transportista
from app.models.logicapture import LogiCaptureRegistro, LogiCaptureDetalle
from app.models.embarque import ControlEmbarque
from pydantic import BaseModel
import os
import logging

# Configuración de Logging
logger = logging.getLogger("agroflow")

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
    
    # Datos del ticket premium
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
    usuario_registro: Optional[str] = None

    # Pesos (Anexo 1)
    peso_bruto: Optional[float] = None
    peso_tara_contenedor: Optional[float] = None
    peso_neto_carga: Optional[float] = None
    num_guia: Optional[str] = None

    # Operativos (Nuevos campos inyectados)
    temperatura: Optional[str] = None
    ventilacion: Optional[str] = None
    humedad: Optional[str] = None
    ac: Optional[str] = None
    tipo_tecnologia: Optional[str] = None
    filtros: Optional[str] = None
    ct: Optional[str] = None

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
    # Operativos
    temperatura: Optional[str] = None
    ventilacion: Optional[str] = None
    humedad: Optional[str] = None
    ac: Optional[str] = None
    tipo_tecnologia: Optional[str] = None
    filtros: Optional[str] = None
    ct: Optional[str] = None

class Anexo1Request(BaseModel):
    peso_bruto: float
    peso_tara_contenedor: float
    peso_neto_carga: float
    is_especial: bool = False
    num_guia: str = ""
    guia_remision: Optional[str] = None # Alias para compatibilidad con el frontend

@router.get("/lookup/{booking}")
def lookup_booking_data(booking: str, db: Session = Depends(get_db)):
    """Cruza Posicionamientos (Plan Maestro) para autocompletar."""
    clean_booking_val = clean_booking(booking)
    
    # Buscar en Posicionamientos (Orden Beta / Plan Maestro)
    pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == clean_booking_val).first()
    
    if not pos:
        raise HTTPException(
            status_code=404, 
            detail=f"No se encontró información maestra para el Booking: {clean_booking_val}"
        )
    
    # Buscar en Control de Embarque para obtener DAM y Contenedor
    ctrl = db.query(ControlEmbarque).filter(ControlEmbarque.booking == clean_booking_val).first()

    return {
        "booking": clean_booking_val,
        "orden_beta": pos.ORDEN_BETA or "PENDIENTE",
        "planta": pos.PLANTA_LLENADO,
        "cultivo": pos.CULTIVO,
        "dam": ctrl.dam if ctrl else None,
        "contenedor": ctrl.contenedor if ctrl else None,
        "status": "success",
        # New fields for premium pre-fill
        "naviera": pos.NAVIERA,
        "nave": pos.NAVE,
        "temperatura": pos.TEMPERATURA,
        "ventilacion": pos.VENTILACION,
        "humedad": pos.HUMEDAD,
        "ac": pos.AC,
        "ct": pos.CT,
        "filtros": pos.FILTROS,
        "tipo_tecnologia": getattr(pos, 'TIPO_TECNOLOGIA', None)
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
        "transportista": vehicle.transportista.nombre_transportista if vehicle.transportista else "S/N",
        "ruc_transportista": vehicle.transportista.ruc if vehicle.transportista else None,
        "codigo_sap": vehicle.transportista.codigo_sap if vehicle.transportista else None,
        "partida_registral": vehicle.transportista.partida_registral if vehicle.transportista else None,
        "configuracion_vehicular": vehicle.certificado_vehicular_tracto,
        "peso_neto": vehicle.peso_neto_tracto,
        "numero_ejes": vehicle.numero_ejes
    }

@router.get("/check_unique")
def check_data_unique(field: str, value: str, treatment_buque: bool = False, db: Session = Depends(get_db)):
    """Verifica si un dato ya existe en la tabla de registros operativos."""
    clean_val = clean_container(value) if "contenedor" in field else value.strip().upper()
    
    ignore_values = ["**", "***", "****", "-", "S/P", "N/A", "PENDIENTE", ""]
    if clean_val in ignore_values:
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
        det = db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.codigo == clean_val).first()
        if det:
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
    """Busca choferes por coincidencia."""
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

@router.get("/bookings/search")
def search_bookings(q: str, db: Session = Depends(get_db)):
    """Busca bookings en maestros."""
    clean_q = clean_booking(q)
    results = db.query(Posicionamiento).filter(
        Posicionamiento.BOOKING.ilike(f"%{clean_q}%")
    ).limit(10).all()
    
    return [
        {
            "booking": b.BOOKING,
            "orden_beta": b.ORDEN_BETA or "PENDIENTE",
            "planta": b.PLANTA_LLENADO,
            "cultivo": b.CULTIVO
        } for b in results
    ]

@router.post("/register")
def register_logicapture_data(req: LogiCaptureSaveRequest, db: Session = Depends(get_db)):
    """Guarda registro final de LogiCapture."""
    
    ignore_values = ["**", "***", "****", "-", "S/P", "N/A", "PENDIENTE", "", None]
    
    # Validaciones de unicidad (DAM, Contenedor, Booking)
    if req.dam and req.dam.strip().upper() not in ignore_values:
        existing_dam = db.query(LogiCaptureRegistro).filter(
            LogiCaptureRegistro.dam == req.dam,
            LogiCaptureRegistro.status != "ANULADO"
        ).first()
        if existing_dam:
            raise HTTPException(status_code=400, detail=f"La DAM {req.dam} ya cuenta con un registro activo.")
        
    if req.contenedor and req.contenedor.strip().upper() not in ignore_values:
        existing_cnt = db.query(LogiCaptureRegistro).filter(
            LogiCaptureRegistro.contenedor == req.contenedor,
            LogiCaptureRegistro.status != "ANULADO"
        ).first()
        if existing_cnt:
            raise HTTPException(status_code=400, detail=f"El contenedor {req.contenedor} ya cuenta con un registro activo.")
 
    if not req.tratamientoBuque:
        existing_bk = db.query(LogiCaptureRegistro).filter(
            LogiCaptureRegistro.booking == req.booking,
            LogiCaptureRegistro.status != "ANULADO"
        ).first()
        if existing_bk:
            raise HTTPException(status_code=400, detail=f"El Booking {req.booking} ya fue registrado anteriormente.")
 
    # Validar Unicidad de Precintos/Termógrafos
    codes_to_check = (req.precintoAduana + req.precintoOperador + req.precintoSenasa + 
                      req.precintoLinea + req.precintosBeta + req.termografos)
    
    codes_to_check = [c.strip().upper() for c in codes_to_check if c.strip().upper() not in ignore_values]
    
    if codes_to_check:
        dup = db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.codigo.in_(codes_to_check)).first()
        if dup:
            raise HTTPException(status_code=400, detail=f"El código '{dup.codigo}' ya fue utilizado en otra operación.")
 
    # Guardar Cabecera
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
        usuario_registro=req.usuario_registro,
        # Pesos
        peso_bruto=req.peso_bruto,
        peso_tara_contenedor=req.peso_tara_contenedor,
        peso_neto_carga=req.peso_neto_carga,
        num_guia=req.num_guia,
        # Operativos
        temperatura=req.temperatura,
        ventilacion=req.ventilacion,
        humedad=req.humedad,
        ac=req.ac,
        tipo_tecnologia=req.tipo_tecnologia,
        filtros=req.filtros,
        ct=req.ct
    )
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)
 
    # Guardar Detalles de Unicidad
    details = []
    category_map = {
        "ADUANA": req.precintoAduana,
        "OPERADOR": req.precintoOperador,
        "SENASA": req.precintoSenasa,
        "LINEA": req.precintoLinea,
        "BETA": req.precintosBeta,
        "TERMOGRAFO": req.termografos
    }
 
    codigos_procesados = set()
    for tipo, codes in category_map.items():
        for code in codes:
            if not code: continue
            code_upper = code.strip().upper()
            if code_upper in ignore_values: continue
            
            if code_upper in codigos_procesados:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Código duplicado en request: {code_upper}")
            codigos_procesados.add(code_upper)
 
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
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Error de integridad: códigos duplicados.")
 
    return {"status": "success", "id": new_reg.id}

@router.get("/registros")
def list_registros(
    page: int = 1, 
    size: int = 10,
    planta: Optional[str] = None, 
    cultivo: Optional[str] = None,
    status: Optional[str] = None,
    motivo: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(LogiCaptureRegistro)
    
    if status: query = query.filter(LogiCaptureRegistro.status == status)
    if planta: query = query.filter(LogiCaptureRegistro.planta == planta)
    if cultivo: query = query.filter(LogiCaptureRegistro.cultivo == cultivo)
    if motivo: query = query.filter(LogiCaptureRegistro.motivo_anulacion == motivo)
    
    # Filtro por Rango de Fechas
    if start_date:
        query = query.filter(func.coalesce(LogiCaptureRegistro.fecha_embarque, LogiCaptureRegistro.fecha_registro) >= start_date)
    if end_date:
        # Añadir 23:59:59 para incluir el día final completo
        query = query.filter(func.coalesce(LogiCaptureRegistro.fecha_embarque, LogiCaptureRegistro.fecha_registro) <= f"{end_date} 23:59:59")
        
    # Búsqueda Rápida (Booking, Contenedor, Orden) - Smart Search
    if q:
        search_orig = f"%{q}%"
        # Normalizar el término de búsqueda para la comparación smart
        q_norm = q.replace(" ", "").replace("-", "").replace(".", "")
        search_norm = f"%{q_norm}%"
        
        query = query.filter(
            (LogiCaptureRegistro.booking.ilike(search_orig)) |
            (LogiCaptureRegistro.contenedor.ilike(search_orig)) |
            (LogiCaptureRegistro.orden_beta.ilike(search_orig)) |
            # Búsqueda normalizada (ignora espacios y guiones en la BD)
            (func.replace(func.replace(LogiCaptureRegistro.contenedor, ' ', ''), '-', '').ilike(search_norm)) |
            (func.replace(func.replace(LogiCaptureRegistro.booking, ' ', ''), '-', '').ilike(search_norm)) |
            (func.replace(func.replace(LogiCaptureRegistro.orden_beta, ' ', ''), '-', '').ilike(search_norm))
        )
    
    total = query.count()
    items = query.order_by(func.coalesce(LogiCaptureRegistro.fecha_embarque, LogiCaptureRegistro.fecha_registro).desc()).offset((page - 1) * size).limit(size).all()
    
    # Obtener listas únicas para los filtros (dentro del contexto del status actual)
    base_query = db.query(LogiCaptureRegistro)
    if status: base_query = base_query.filter(LogiCaptureRegistro.status == status)
    
    available_plantas = [r[0] for r in base_query.with_entities(LogiCaptureRegistro.planta).distinct().all() if r[0]]
    available_cultivos = [r[0] for r in base_query.with_entities(LogiCaptureRegistro.cultivo).distinct().all() if r[0]]
 
    return {
        "total": total,
        "page": page,
        "total_pages": (total + size - 1) // size if size > 0 else 1,
        "available_plantas": available_plantas,
        "available_cultivos": available_cultivos,
        "items": [
            {
                **{c.name: getattr(item, c.name) for c in item.__table__.columns},
                "antiguedad_humanizada": item.antiguedad_humanizada,
                "antiguedad_color": item.antiguedad_color
            } for item in items
        ]
    }

@router.get("/registros/{id}")
def get_registro(id: int, db: Session = Depends(get_db)):
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return reg

@router.put("/registros/{id}")
def update_registro(id: int, req: LogiCaptureUpdateRequest, db: Session = Depends(get_db)):
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    # Actualización de campos
    if req.precintoAduana is not None: reg.precinto_aduana = req.precintoAduana
    if req.precintoOperador is not None: reg.precinto_operador = req.precintoOperador
    if req.precintoSenasa is not None: reg.precinto_senasa = req.precintoSenasa
    if req.precintoLinea is not None: reg.precinto_linea = req.precintoLinea
    if req.precintosBeta is not None: reg.precintos_beta = req.precintosBeta
    if req.termografos is not None: reg.termografos = req.termografos
    
    if req.fecha_embarque:
        try: reg.fecha_embarque = datetime.fromisoformat(req.fecha_embarque.replace('Z', '+00:00'))
        except: pass
            
    if req.nombreChofer is not None: reg.nombre_chofer = req.nombreChofer
    if req.dni is not None: reg.dni_chofer = req.dni
    if req.licenciaChofer is not None: reg.licencia_chofer = req.licenciaChofer
    if req.placaTracto is not None: reg.placa_tracto = req.placaTracto
    if req.placaCarreta is not None: reg.placa_carreta = req.placaCarreta
    if req.empresa is not None: reg.empresa_transporte = req.empresa
    if req.partidaRegistral is not None: reg.partida_registral = req.partidaRegistral
    if req.codigoSAP is not None: reg.codigo_sap = req.codigoSAP
    
    if req.booking is not None: reg.booking = req.booking
    if req.ordenBeta is not None: reg.orden_beta = req.ordenBeta
    if req.dam is not None: reg.dam = req.dam
    if req.contenedor is not None: reg.contenedor = req.contenedor
    if req.planta is not None: reg.planta = req.planta
    if req.cultivo is not None: reg.cultivo = req.cultivo
 
    # Operativos
    if req.temperatura is not None: reg.temperatura = req.temperatura
    if req.ventilacion is not None: reg.ventilacion = req.ventilacion
    if req.humedad is not None: reg.humedad = req.humedad
    if req.ac is not None: reg.ac = req.ac
    if req.tipo_tecnologia is not None: reg.tipo_tecnologia = req.tipo_tecnologia
    if req.filtros is not None: reg.filtros = req.filtros
    if req.ct is not None: reg.ct = req.ct
        
    if req.status:
        clean_status = req.status.upper()
        reg.status = clean_status
        if clean_status == "ANULADO":
             db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.registro_id == id).delete()
 
    # Refrescar detalles de unicidad
    if any([req.precintoAduana, req.precintoOperador, req.precintoSenasa, req.precintoLinea, req.precintosBeta, req.termografos]):
        db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.registro_id == id).delete()
        # Nota: Aquí se debería re-poblar LogiCaptureDetalle si es necesario
 
    db.commit()
    return {"status": "success", "message": "Actualizado correctamente"}

@router.patch("/registros/{id}/status")
def change_registro_status(id: int, status: str, motivo: Optional[str] = None, db: Session = Depends(get_db)):
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    clean_status = status.upper()
    reg.status = clean_status
    if clean_status == "ANULADO":
        reg.motivo_anulacion = motivo or "N/A"
        db.query(LogiCaptureDetalle).filter(LogiCaptureDetalle.registro_id == id).delete()
        
    db.commit()
    return {"status": "success", "message": f"Estado: {clean_status}"}

@router.get("/export/excel")
def export_to_excel(
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from app.services.logicapture_service import LogiCaptureService
    
    dt_start = None
    dt_end = None
    
    if start_date:
        try: dt_start = datetime.fromisoformat(start_date)
        except: pass
    if end_date:
        try:
            # Si solo viene fecha, añadir final del día
            if len(end_date) <= 10:
                dt_end = datetime.fromisoformat(f"{end_date} 23:59:59")
            else:
                dt_end = datetime.fromisoformat(end_date)
        except: pass
        
    output = LogiCaptureService.generate_excel_report(db, start_date=dt_start, end_date=dt_end, status=status)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=LogiCapture_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

@router.post("/registros/{id}/anexo1")
def generate_anexo1(id: int, req: Anexo1Request, db: Session = Depends(get_db)):
    import traceback
    try:
        from app.services.pesos_medidas_service import generate_anexo_1_pdf
        reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
        if not reg: raise HTTPException(status_code=404, detail="Registro no encontrado")
            
        reg.peso_bruto = req.peso_bruto
        reg.peso_tara_contenedor = req.peso_tara_contenedor
        reg.peso_neto_carga = req.peso_neto_carga
        reg.num_guia = req.num_guia or req.guia_remision
        db.commit()
        
        final_guia = reg.num_guia
        file_path = generate_anexo_1_pdf(db, id, is_especial=req.is_especial, guia_remision=final_guia)
        
        def iterfile():
            try:
                with open(file_path, mode="rb") as f: yield from f
            finally:
                if os.path.exists(file_path): os.remove(file_path)
 
        return StreamingResponse(
            iterfile(),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="Anexo1_{reg.orden_beta}.pdf"'}
        )
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
