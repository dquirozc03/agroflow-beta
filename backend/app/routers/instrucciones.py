from fastapi import APIRouter, Depends, HTTPException, Response, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.maestros import ClienteIE, MaestroFito
from app.models.instruccion import EmisionInstruccion
from app.services.pdf_service import instruction_pdf_service
from pydantic import BaseModel
from sqlalchemy import func, desc, or_, literal
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
    ubigeo_planta: Optional[str] = None
    region_planta: Optional[str] = None
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

        pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
        if not pos:
            raise HTTPException(status_code=404, detail="Booking no encontrado en posicionamiento")
    
        raw_orden = pos.ORDEN_BETA or ""
        match = re.search(r'\d+', raw_orden)
        normalized_orden = match.group(0) if match else raw_orden
        
        pedido = None
        pedidos = []
        if normalized_orden and len(normalized_orden) > 1 and normalized_orden.upper() != "PENDIENTE":
            # Búsqueda optimizada por índice (exacta o con padding de ceros)
            query_pedidos = db.query(PedidoComercial).filter(
                or_(
                    PedidoComercial.orden_beta == normalized_orden,
                    PedidoComercial.orden_beta == f"0{normalized_orden}",
                    PedidoComercial.orden_beta == f"00{normalized_orden}"
                )
            )
            
            if pos.CULTIVO and pos.CULTIVO.strip().upper() not in ["", "PENDIENTE", "N/A", "-"]:
                query_pedidos = query_pedidos.filter(PedidoComercial.cultivo.ilike(pos.CULTIVO))
            
            pedidos = query_pedidos.all()
            pedido = pedidos[0] if pedidos else None
    
        if not pedido:
            return {
                "booking": booking,
                "orden_beta": pos.ORDEN_BETA or "PENDIENTE",
                "cultivo": pos.CULTIVO or "PENDIENTE",
                "warning": "PEDIDO_NO_ENCONTRADO",
                "emision_activa": emision_activa.id if emision_activa else None,
                "cliente_nombre": None,
                "maestro": None
            }
    
        pedido_cliente_raw = pedido.cliente or ""
        pedido_pais_clean = normalize_country_name(pedido.pais)
        pedido_pod_clean = pedido.pod.strip() if pedido.pod else ""
    
        # Intervención Especial para OGL (Palta 4KG vs 10KG) 💎
        cliente_nombre_final = pedido_cliente_raw
        if pedido_cliente_raw and "OGL" in pedido_cliente_raw.upper() and pos.CULTIVO and "PALTA" in pos.CULTIVO.upper():
            peso_kilos = float(pedidos[0].peso_por_caja or 0) if pedidos else 0
            if peso_kilos >= 10:
                cliente_nombre_final = "OGL 10KG"
            elif peso_kilos > 0:
                cliente_nombre_final = "OGL 4KG"

        # Búsqueda Inteligente Multinivel 🧠💎
        cliente_id = cliente_nombre_final.strip()
        pais = pedido_pais_clean
        destino = pedido_pod_clean
        po_id = pedido.po.strip() if pedido.po else None
        cultivo_val = (pos.CULTIVO or "").strip()

        # 1. Prioridad Máxima: Cliente + País + Destino + PO + Cultivo
        cliente_maestro = None
        if po_id:
            cliente_maestro = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(cliente_id),
                func.trim(ClienteIE.pais).ilike(pais),
                func.trim(ClienteIE.destino).ilike(destino),
                func.trim(ClienteIE.cultivo).ilike(cultivo_val),
                ClienteIE.estado == "ACTIVO",
                ClienteIE.po.isnot(None),
                or_(
                    ClienteIE.po == po_id,
                    ClienteIE.po.like(f"%,{po_id},%"),
                    ClienteIE.po.like(f"{po_id},%"),
                    ClienteIE.po.like(f"%,{po_id}")
                )
            ).first()
        
        # 2. Segunda Prioridad: Cliente + País + PO + Cultivo
        if not cliente_maestro and po_id:
            cliente_maestro = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(cliente_id),
                func.trim(ClienteIE.pais).ilike(pais),
                func.trim(ClienteIE.cultivo).ilike(cultivo_val),
                ClienteIE.estado == "ACTIVO",
                ClienteIE.po.isnot(None),
                or_(
                    ClienteIE.po == po_id,
                    ClienteIE.po.like(f"%,{po_id},%"),
                    ClienteIE.po.like(f"{po_id},%"),
                    ClienteIE.po.like(f"%,{po_id}")
                )
            ).first()

        # 3. Nivel 3: Match General (Cliente + País + Destino + Cultivo)
        if not cliente_maestro:
            cliente_maestro = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(cliente_id),
                func.trim(ClienteIE.pais).ilike(pais),
                func.trim(ClienteIE.destino).ilike(destino),
                func.trim(ClienteIE.cultivo).ilike(cultivo_val),
                ClienteIE.estado == "ACTIVO"
            ).first()
    
        # 4. Nivel 4: Match Genérico (Cliente + País + Cultivo)
        if not cliente_maestro:
            cliente_maestro = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(cliente_id),
                func.trim(ClienteIE.pais).ilike(pais),
                func.trim(ClienteIE.cultivo).ilike(cultivo_val),
                ClienteIE.estado == "ACTIVO"
            ).first()

        # 5. Búsqueda Inteligente (Flexible en Nombre + Cultivo)
        if not cliente_maestro:
            # Quitamos palabras comunes como "HOLLAND", "USA", etc para el match flexible
            clean_name = re.sub(r'\s+(HOLLAND|USA|PERU|UK|EUROPE|B\.V\.|LTD|INC)\.?$', '', cliente_id, flags=re.IGNORECASE)
            cliente_maestro = db.query(ClienteIE).filter(
                func.trim(ClienteIE.cultivo).ilike(cultivo_val),
                ClienteIE.estado == "ACTIVO",
                or_(
                    ClienteIE.nombre_legal.ilike(f"%{clean_name}%"),
                    literal(cliente_id).ilike(func.concat('%', ClienteIE.nombre_legal, '%'))
                )
            ).first()
    
        from app.models.maestros import Planta
        # Usamos MAX en lugar de SUM porque el Excel suele repetir el TOTAL de la orden en cada fila (variedad/presentación)
        total_cajas = max((int(p.total_cajas or 0) for p in pedidos), default=0)
        total_pallets = max((int(p.total_pallets or 0) for p in pedidos), default=0)
        peso_kg = float(pedidos[0].peso_por_caja or 0.0) if pedidos else 0.0
        peso_neto = float(total_cajas) * peso_kg
        p_bruto = peso_neto + (float(total_pallets) * 30.0) + (float(total_cajas) * 0.25)
        
        planta_maestro = db.query(Planta).filter(Planta.planta.ilike(pos.PLANTA_LLENADO)).first() if pos.PLANTA_LLENADO else None
        
        response = {
            "booking": pos.BOOKING,
            "orden_beta": pos.ORDEN_BETA or "PENDIENTE",
            "cultivo": pos.CULTIVO or "PENDIENTE",
            "variedad": (pedidos[0].variedad if pedidos and hasattr(pedidos[0], 'variedad') else "WONDERFUL"),
            "motonave": pos.NAVE or "",
            "naviera": pos.NAVIERA or "",
            "puerto_embarque": pos.POL or "CALLAO",
            "puerto_destino": getattr(pos, 'DESTINO_BOOKING', None) or (cliente_maestro.destino if cliente_maestro else ""),
            "eta": pos.ETA.strftime('%d/%m/%Y') if pos.ETA else "",
            "operador_logistico": pos.OPERADOR_LOGISTICO or "DP WORLD LOGISTICS S.R.L.",
            "planta_llenado": planta_maestro.planta if planta_maestro else (pos.PLANTA_LLENADO or "PLANTA BETA"),
            "direccion_planta": planta_maestro.direccion if planta_maestro else "",
            "ubigeo_planta": planta_maestro.ubigeo if planta_maestro else "110111",
            "region_planta": f"{planta_maestro.distrito} - {planta_maestro.provincia} - {planta_maestro.departamento} - PERU".upper() if (planta_maestro and planta_maestro.distrito) else "",
            "cliente_nombre": (cliente_maestro.consignatario_bl or pedido_cliente_raw) if (cliente_maestro and cliente_maestro.consignatario_bl) else (pedido_cliente_raw if pedido_cliente_raw else "POR DEFINIR"),
            "incoterm": pedido.incoterm if pedido else "",
            "cajas": total_cajas,
            "pallets": total_pallets,
            "peso_neto": f"{peso_neto:,.3f} KG",
            "peso_bruto": f"{p_bruto:,.3f} KG",
            "desc_en": f"{total_cajas} BOXES WITH FRESH {pos.CULTIVO or 'PRODUCT'} {pedidos[0].variedad if pedidos else ''} ON {total_pallets} PALLETS",
            "desc_es": f"{total_cajas} CAJAS CON FRESCA {pos.CULTIVO or 'PRODUCTO'} {pedidos[0].variedad if pedidos else ''} EN {total_pallets} PALETAS",
            "temperatura": pos.TEMPERATURA or "0.5 °C",
            "ventilacion": pos.VENTILACION or "15 CBM",
            "humedad": pos.HUMEDAD or "OFF",
            "atm": pos.AC or "NO APLICA",
            "oxigeno": "----",
            "co2": "----",
            "filtros": pos.FILTROS or "NO",
            "cold_treatment": pos.CT or "NO",
            "etiquetas": pos.ETIQUETA_CAJA or "GENERICA",
            "fob": "USD 34,560.00",
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
                "nombre_legal": cliente_maestro.nombre_legal.replace(";", "").strip() if cliente_maestro.nombre_legal else "",
                "pais": cliente_maestro.pais,
                "destino": cliente_maestro.destino,
                "consignatario_bl": (cliente_maestro.consignatario_bl or "").replace(";", "").strip(),
                "direccion_consignatario": (cliente_maestro.direccion_consignatario or "").replace(";", "").strip(),
                "po": pedido.po if (pedido and pedido.po and str(pedido.po).strip() != "0") else "",
                "notify_bl": (cliente_maestro.notify_bl or "").replace(";", "").strip(),
                "direccion_notify": (cliente_maestro.direccion_notify or "").replace(";", "").strip(),
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
            "status": e.status,
            "usuario_anulacion": e.usuario_anulacion,
            "motivo_anulacion": e.motivo_anulacion
        } for e in emisiones
    ]

@router.post("/anular/{emision_id}")
def anular_emision(emision_id: int, motivo: str = "ERROR EN DATOS", usuario: str = "SISTEMA", db: Session = Depends(get_db)):
    emision = db.query(EmisionInstruccion).filter(EmisionInstruccion.id == emision_id).first()
    if not emision:
        raise HTTPException(status_code=404, detail="Emisión no encontrada")
    
    emision.status = "ANULADO"
    emision.motivo_anulacion = motivo.upper()
    emision.usuario_anulacion = usuario.upper()
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
