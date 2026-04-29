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
    planta: Optional[str] = None
    cultivo: Optional[str] = None
    codigoSap: Optional[str] = None
    ruc_transportista: Optional[str] = None
    marca_tracto: Optional[str] = None
    cert_tracto: Optional[str] = None
    cert_carreta: Optional[str] = None
    fecha_embarque: Optional[str] = None
    nombreChofer: Optional[str] = None
    licenciaChofer: Optional[str] = None
    partidaRegistral: Optional[str] = None
    usuario_registro: Optional[str] = None
    peso_bruto: Optional[float] = None
    peso_tara_contenedor: Optional[float] = None
    num_guia: Optional[str] = None
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
    booking: Optional[str] = None
    ordenBeta: Optional[str] = None
    dam: Optional[str] = None
    contenedor: Optional[str] = None
    status: Optional[str] = None
    codigoSAP: Optional[str] = None
    planta: Optional[str] = None
    cultivo: Optional[str] = None
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

@router.get("/lookup/{booking}")
def lookup_booking_data(booking: str, db: Session = Depends(get_db)):
    clean_booking_val = clean_booking(booking)
    pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == clean_booking_val).first()
    if not pos: raise HTTPException(status_code=404, detail=f"No se encontró información maestra para el Booking: {clean_booking_val}")
    ctrl = db.query(ControlEmbarque).filter(ControlEmbarque.booking == clean_booking_val).first()
    return {
        "booking": clean_booking_val, "orden_beta": pos.ORDEN_BETA or "PENDIENTE", "planta": pos.PLANTA_LLENADO, "cultivo": pos.CULTIVO,
        "dam": ctrl.dam if ctrl else None, "contenedor": ctrl.contenedor if ctrl else None, "status": "success",
        "naviera": pos.NAVIERA, "nave": pos.NAVE, "temperatura": pos.TEMPERATURA, "ventilacion": pos.VENTILACION, "humedad": pos.HUMEDAD,
        "ac": pos.AC, "ct": pos.CT, "filtros": pos.FILTROS, "tipo_tecnologia": getattr(pos, 'TIPO_TECNOLOGIA', None)
    }

@router.get("/registros")
def list_registros(page: int = 1, size: int = 10, planta: Optional[str] = None, cultivo: Optional[str] = None, status: Optional[str] = None, motivo: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(LogiCaptureRegistro)
    if status: query = query.filter(LogiCaptureRegistro.status == status)
    if planta: query = query.filter(LogiCaptureRegistro.planta == planta)
    if cultivo: query = query.filter(LogiCaptureRegistro.cultivo == cultivo)
    if motivo: query = query.filter(LogiCaptureRegistro.motivo_anulacion == motivo)
    if start_date: query = query.filter(func.coalesce(LogiCaptureRegistro.fecha_embarque, LogiCaptureRegistro.fecha_registro) >= start_date)
    if end_date: query = query.filter(func.coalesce(LogiCaptureRegistro.fecha_embarque, LogiCaptureRegistro.fecha_registro) <= f"{end_date} 23:59:59")
    if q:
        search_orig = f"%{q}%"
        query = query.filter((LogiCaptureRegistro.booking.ilike(search_orig)) | (LogiCaptureRegistro.contenedor.ilike(search_orig)) | (LogiCaptureRegistro.orden_beta.ilike(search_orig)))
    total = query.count()
    items = query.order_by(func.coalesce(LogiCaptureRegistro.fecha_embarque, LogiCaptureRegistro.fecha_registro).desc()).offset((page - 1) * size).limit(size).all()
    return {
        "total": total, "page": page, "total_pages": (total + size - 1) // size if size > 0 else 1,
        "items": [{**{c.name: getattr(item, c.name) for c in item.__table__.columns}, "antiguedad_humanizada": item.antiguedad_humanizada, "antiguedad_color": item.antiguedad_color} for item in items]
    }

@router.get("/bookings/search")
def search_bookings(q: str, db: Session = Depends(get_db)):
    clean_q = clean_booking(q)
    results = db.query(Posicionamiento).filter(Posicionamiento.BOOKING.ilike(f"%{clean_q}%")).limit(10).all()
    return [{"booking": b.BOOKING, "orden_beta": b.ORDEN_BETA or "PENDIENTE", "planta": b.PLANTA_LLENADO, "cultivo": b.CULTIVO} for b in results]

@router.post("/register")
def register_logicapture_data(req: LogiCaptureSaveRequest, db: Session = Depends(get_db)):
    if not req.tratamientoBuque:
        existing_bk = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.booking == req.booking, LogiCaptureRegistro.status != "ANULADO").first()
        if existing_bk: raise HTTPException(status_code=400, detail=f"El Booking {req.booking} ya fue registrado anteriormente.")
    new_reg = LogiCaptureRegistro(
        booking=req.booking, orden_beta=req.ordenBeta, contenedor=req.contenedor, dam=req.dam, dni_chofer=req.dni, placa_tracto=req.placaTracto, placa_carreta=req.placaCarreta, empresa_transporte=req.empresa,
        precinto_aduana=req.precintoAduana, precinto_operador=req.precintoOperador, precinto_senasa=req.precintoSenasa, precinto_linea=req.precintoLinea, precintos_beta=req.precintosBeta, termografos=req.termografos,
        tratamiento_buque=req.tratamientoBuque, planta=req.planta, cultivo=req.cultivo, codigo_sap=req.codigoSap, ruc_transportista=req.ruc_transportista, marca_tracto=req.marca_tracto, cert_tracto=req.cert_tracto, cert_carreta=req.cert_carreta,
        fecha_embarque=datetime.fromisoformat(req.fecha_embarque.replace('Z', '+00:00')) if req.fecha_embarque else None, status="PENDIENTE", nombre_chofer=req.nombreChofer, licencia_chofer=req.licenciaChofer, partida_registral=req.partidaRegistral,
        usuario_registro=req.usuario_registro, peso_bruto=req.peso_bruto, peso_tara_contenedor=req.peso_tara_contenedor, num_guia=req.num_guia, temperatura=req.temperatura, ventilacion=req.ventilacion, humedad=req.humedad, ac=req.ac, tipo_tecnologia=req.tipo_tecnologia, filtros=req.filtros, ct=req.ct
    )
    db.add(new_reg); db.commit(); db.refresh(new_reg)
    return {"status": "success", "id": new_reg.id}

@router.get("/registros/{id}")
def get_registro(id: int, db: Session = Depends(get_db)):
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg: raise HTTPException(status_code=404, detail="Registro no encontrado")
    return reg

@router.patch("/registros/{id}/status")
def change_registro_status(id: int, status: str, motivo: Optional[str] = None, db: Session = Depends(get_db)):
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == id).first()
    if not reg: raise HTTPException(status_code=404, detail="Registro no encontrado")
    clean_status = status.upper()
    reg.status = clean_status
    if clean_status == "ANULADO": reg.motivo_anulacion = motivo or "N/A"
    db.commit(); return {"status": "success", "message": f"Estado: {clean_status}"}
