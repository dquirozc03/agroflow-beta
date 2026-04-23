from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.maestros import ClienteIE, MaestroFito
from app.models.instruccion import EmisionInstruccion
from app.services.pdf_service import instruction_pdf_service
from pydantic import BaseModel
from sqlalchemy import func, desc
from app.utils.logging import logger
from app.utils.formatters import normalize_client_name, normalize_country_name
from datetime import datetime, timedelta
import traceback
import re
import io
from typing import Optional, List

router = APIRouter(prefix="/api/v1/instrucciones", tags=["instrucciones-ie"])

# Asegurar que las tablas existan al cargar el módulo
from app.database import engine, Base
Base.metadata.create_all(bind=engine)

class GeneratePDFRequest(BaseModel):
    booking: str
    observaciones: str = ""
    emision_bl: Optional[str] = "SWB"
    usuario: Optional[str] = "SISTEMA"

class AdminOverrideRequest(BaseModel):
    booking: str
    orden_beta: str
    cliente_nombre: str
    consignatario_bl: str
    direccion_consignatario: str
    notify_bl: str
    direccion_notify: str
    motonave: str
    naviera: str
    puerto_embarque: str
    puerto_destino: str
    eta: str
    cultivo: str
    variedad: str
    temperatura: str
    ventilacion: str
    humedad: str
    atm: str
    oxigeno: str
    co2: str
    filtros: str
    cold_treatment: str
    cajas: int
    pallets: int
    peso_neto: str
    peso_bruto: str
    fob: str
    consignatario_fito: str
    direccion_fito: str
    pais_destino: str
    presentacion: str
    etiquetas: str
    observaciones: str
    embarcador: Optional[str] = "COMPLEJO AGROINDUSTRIAL BETA S.A."
    direccion_embarcador: Optional[str] = "CAL. LEOPOLDO CARRILLO NRO. 160 ICA - CHINCHA - CHINCHA ALTA – PERU"
    operador_logistico: Optional[str] = "DP WORLD LOGISTICS S.R.L."
    planta_llenado: Optional[str] = None
    direccion_planta: Optional[str] = None
    fecha_llenado: Optional[str] = None
    po: Optional[str] = ""
    freight: Optional[str] = "PREPAID"
    eori_consignatario: Optional[str] = ""
    eori_notify: Optional[str] = ""
    usuario: Optional[str] = "SISTEMA"

@router.get("/lookup/{booking}")
def lookup_booking_data(booking: str, db: Session = Depends(get_db)):
    try:
        # Verificar si ya existe una emisión activa para este booking
        emision_activa = db.query(EmisionInstruccion).filter(
            EmisionInstruccion.booking == booking,
            EmisionInstruccion.status == "ACTIVO"
        ).first()

        pos = db.query(Posicionamiento).filter(Posicionamiento.booking == booking).first()
        if not pos:
            raise HTTPException(status_code=404, detail="Booking no encontrado en posicionamiento")
    
        raw_orden = pos.orden_beta or ""
        match = re.search(r'\d+', raw_orden)
        normalized_orden = match.group(0) if match else raw_orden
        
        pedido = None
        pedidos = []
        if normalized_orden and len(normalized_orden) > 1 and normalized_orden.upper() != "PENDIENTE":
            query_pedidos = db.query(PedidoComercial).filter(
                PedidoComercial.orden_beta.ilike(f"%{normalized_orden}%")
            )
            if pos.cultivo and pos.cultivo.strip().upper() not in ["", "PENDIENTE", "N/A", "-"]:
                query_pedidos = query_pedidos.filter(PedidoComercial.cultivo.ilike(pos.cultivo))
            
            pedidos = query_pedidos.all()
            pedido = pedidos[0] if pedidos else None
    
        if not pedido:
            return {
                "booking": booking,
                "orden_beta": pos.orden_beta or "PENDIENTE",
                "cultivo": pos.cultivo or "PENDIENTE",
                "warning": "PEDIDO_NO_ENCONTRADO",
                "emision_activa": emision_activa.id if emision_activa else None,
                "cliente_nombre": None,
                "maestro": None
            }
    
        pedido_cliente_raw = pedido.cliente or ""
        pedido_pais_clean = normalize_country_name(pedido.pais)
        pedido_pod_clean = pedido.pod.strip() if pedido.pod else ""
    
        cliente_maestro = db.query(ClienteIE).filter(
            func.trim(ClienteIE.nombre_legal).ilike(pedido_cliente_raw.strip()),
            func.trim(ClienteIE.pais).ilike(pedido_pais_clean),
            func.trim(ClienteIE.destino).ilike(pedido_pod_clean),
            ClienteIE.estado == "ACTIVO"
        ).first()
    
        if not cliente_maestro:
            cliente_maestro = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(pedido_cliente_raw.strip()),
                func.trim(ClienteIE.pais).ilike(pedido_pais_clean),
                ClienteIE.estado == "ACTIVO"
            ).first()
    
        from app.models.maestros import Planta
        total_cajas = sum(int(p.total_cajas or 0) for p in pedidos)
        total_pallets = sum(int(p.total_pallets or 0) for p in pedidos)
        peso_kg = float(pedidos[0].peso_por_caja or 0.0) if pedidos else 0.0
        peso_neto = float(total_cajas) * peso_kg
        p_bruto = peso_neto + (float(total_pallets) * 30.0) + (float(total_cajas) * 0.25)
        
        planta_maestro = db.query(Planta).filter(Planta.planta.ilike(pos.planta_llenado)).first() if pos.planta_llenado else None
        
        response = {
            "booking": booking,
            "orden_beta": pos.orden_beta or "PENDIENTE",
            "cultivo": pos.cultivo or "PENDIENTE",
            "variedad": (pedidos[0].variedad if pedidos and hasattr(pedidos[0], 'variedad') else "WONDERFUL"),
            "motonave": pos.nave or "",
            "naviera": pos.naviera or "",
            "puerto_embarque": pos.pol or "CALLAO",
            "puerto_destino": getattr(pos, 'POD', None) or (cliente_maestro.destino if cliente_maestro else ""),
            "eta": pos.eta.strftime('%d/%m/%Y') if pos.eta else "",
            "operador_logistico": getattr(pos, 'OPERADOR_LOGISTICO', "DP WORLD LOGISTICS S.R.L.") or "DP WORLD LOGISTICS S.R.L.",
            "planta_llenado": planta_maestro.planta if planta_maestro else (pos.planta_llenado or "PLANTA BETA"),
            "direccion_planta": planta_maestro.direccion if planta_maestro else "",
            "cliente_nombre": (cliente_maestro.consignatario_bl or pedido_cliente_raw) if (cliente_maestro and cliente_maestro.consignatario_bl) else (pedido_cliente_raw if pedido_cliente_raw else "POR DEFINIR"),
            "incoterm": pedido.incoterm if pedido else "",
            "cajas": total_cajas,
            "pallets": total_pallets,
            "peso_neto": f"{peso_neto:,.3f} KG",
            "peso_bruto": f"{p_bruto:,.3f} KG",
            "temperatura": pos.temperatura or "0.5 °C",
            "ventilacion": pos.ventilacion or "15 CBM",
            "humedad": pos.humedad or "OFF",
            "atm": pos.ac or "NO APLICA",
            "oxigeno": "----",
            "co2": "----",
            "filtros": pos.filtros or "NO",
            "cold_treatment": pos.ct or "NO",
            "warning": None,
            "maestro": None,
            "emision_activa": emision_activa.id if emision_activa else None
        }
    
        if cliente_maestro:
            fito_data = {
                "consignatario_fito": cliente_maestro.fitosanitario.consignatario_fito if cliente_maestro.fitosanitario else "",
                "direccion_fito": cliente_maestro.fitosanitario.direccion_fito if cliente_maestro.fitosanitario else ""
            }
            response["maestro"] = {
                "id": cliente_maestro.id,
                "nombre_legal": cliente_maestro.nombre_legal,
                "pais": cliente_maestro.pais,
                "destino": cliente_maestro.destino,
                "consignatario_bl": cliente_maestro.consignatario_bl,
                "direccion_consignatario": cliente_maestro.direccion_consignatario,
                "po": pedido.po if pedido and getattr(pedido, 'po', None) else "",
                "notify_bl": cliente_maestro.notify_bl,
                "direccion_notify": cliente_maestro.direccion_notify,
                "fitosanitario": fito_data,
                "eori_consignatario": getattr(cliente_maestro, 'eori_consignatario', ""),
                "eori_notify": getattr(cliente_maestro, 'eori_notify', "")
            }
        else:
            response["warning"] = "CLIENTE_NO_MAESTRO"
    
        return response
    except Exception as e:
        logger.error(f"Error lookup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-pdf")
def generate_pdf_ie(req: GeneratePDFRequest, db: Session = Depends(get_db)):
    try:
        # Bloquear si ya existe una activa
        emision_activa = db.query(EmisionInstruccion).filter(
            EmisionInstruccion.booking == req.booking,
            EmisionInstruccion.status == "ACTIVO"
        ).first()
        if emision_activa:
            raise HTTPException(status_code=400, detail="Ya existe una Instrucción activa para este booking. Anúlela primero.")

        pdf_data = instruction_pdf_service.generate_instruction_pdf(
            booking=req.booking,
            db=db,
            observaciones=req.observaciones,
            emision_bl=req.emision_bl
        )
        
        # Registrar en Historial
        nueva_emision = EmisionInstruccion(
            booking=req.booking,
            orden_beta=pdf_data.get("orden_beta", "PENDIENTE"),
            cliente=pdf_data.get("cliente_nombre", "N/A"),
            cultivo=pdf_data.get("cultivo", "N/A"),
            usuario=req.usuario,
            data_snapshot={
                "booking": req.booking,
                "observaciones": req.observaciones,
                "emision_bl": req.emision_bl
            }
        )
        db.add(nueva_emision)
        db.commit()

        filename = f"IE_{nueva_emision.orden_beta}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_data["pdf_bytes"]),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"', "Access-Control-Expose-Headers": "Content-Disposition"}
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-pdf-override")
def generate_pdf_override(req: AdminOverrideRequest, db: Session = Depends(get_db)):
    try:
        # Bloquear si ya existe una activa
        emision_activa = db.query(EmisionInstruccion).filter(
            EmisionInstruccion.booking == req.booking,
            EmisionInstruccion.status == "ACTIVO"
        ).first()
        if emision_activa:
            raise HTTPException(status_code=400, detail="Ya existe una Instrucción activa para este booking. Anúlela primero.")

        pdf_data = instruction_pdf_service.generate_instruction_pdf(
            booking=req.booking,
            db=db,
            override_data=req.dict()
        )
        
        # Registrar en Historial
        nueva_emision = EmisionInstruccion(
            booking=req.booking,
            orden_beta=req.orden_beta,
            cliente=req.cliente_nombre,
            cultivo=req.cultivo,
            usuario=req.usuario,
            data_snapshot=req.dict()
        )
        db.add(nueva_emision)
        db.commit()

        filename = f"IE_{req.orden_beta}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_data["pdf_bytes"]),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"', "Access-Control-Expose-Headers": "Content-Disposition"}
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error Override: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/historial", response_model=List[dict])
def get_historial(db: Session = Depends(get_db)):
    emisiones = db.query(EmisionInstruccion).order_by(desc(EmisionInstruccion.fecha_emision)).limit(100).all()
    # Ajustar a UTC-5 para Perú
    return [
        {
            "id": e.id,
            "fecha": (e.fecha_emision - timedelta(hours=5)).strftime('%d/%m/%Y'),
            "hora": (e.fecha_emision - timedelta(hours=5)).strftime('%H:%M'),
            "booking": e.booking,
            "orden_beta": e.orden_beta,
            "cliente": e.cliente,
            "cultivo": e.cultivo,
            "usuario": e.usuario,
            "status": e.status
        } for e in emisiones
    ]

@router.post("/anular/{emision_id}")
def anular_emision(emision_id: int, db: Session = Depends(get_db)):
    emision = db.query(EmisionInstruccion).filter(EmisionInstruccion.id == emision_id).first()
    if not emision:
        raise HTTPException(status_code=404, detail="Emisión no encontrada")
    
    emision.status = "ANULADO"
    emision.fecha_anulacion = datetime.now()
    db.commit()
    return {"message": "Emisión anulada correctamente"}

@router.get("/download/{emision_id}")
def download_emision_historial(emision_id: int, db: Session = Depends(get_db)):
    emision = db.query(EmisionInstruccion).filter(EmisionInstruccion.id == emision_id).first()
    if not emision:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    try:
        snapshot = emision.data_snapshot or {}
        if "orden_beta" in snapshot:
            pdf_data = instruction_pdf_service.generate_instruction_pdf(
                booking=emision.booking,
                db=db,
                override_data=snapshot
            )
        else:
            pdf_data = instruction_pdf_service.generate_instruction_pdf(
                booking=emision.booking,
                db=db,
                observaciones=snapshot.get("observaciones", ""),
                emision_bl=snapshot.get("emision_bl", "SWB")
            )

        # Nombre sin _COPIA
        filename = f"IE_{emision.orden_beta}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_data["pdf_bytes"]),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"', "Access-Control-Expose-Headers": "Content-Disposition"}
        )
    except Exception as e:
        logger.error(f"Error re-download: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al regenerar el PDF")
