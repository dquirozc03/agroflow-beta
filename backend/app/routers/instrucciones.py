from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.maestros import ClienteIE, MaestroFito
from app.services.pdf_service import instruction_pdf_service
from pydantic import BaseModel
from sqlalchemy import func
from app.utils.logging import logger
from app.utils.formatters import normalize_client_name
import traceback
import re
import io
from typing import Optional

router = APIRouter(prefix="/api/v1/instrucciones", tags=["instrucciones-ie"])

class GeneratePDFRequest(BaseModel):
    booking: str
    observaciones: str = ""

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

@router.get("/lookup/{booking}")
def lookup_booking_data(booking: str, db: Session = Depends(get_db)):
    """
    Lógica de Match inteligente:
    1. Busca Booking en Posicionamiento -> Obtiene Orden y Cultivo.
    2. Busca en Cuadro de Pedidos (usando orden normalizada y cultivo) -> Obtiene Cliente.
    3. Busca en Maestros Cliente IE -> Obtiene detalles fitosanitarios.
    """
    try:
        # 1. Buscar en posicionamiento
        pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
        if not pos:
            raise HTTPException(status_code=404, detail="Booking no encontrado en posicionamiento")
    
        # 2. Normalización de Orden (Extraer solo números)
        raw_orden = pos.ORDEN_BETA or ""
        match = re.search(r'\d+', raw_orden)
        normalized_orden = match.group(0) if match else raw_orden
        
        # 3. Buscar en Cuadro de Pedidos
        pedido = None
        pedidos = []
        if normalized_orden and len(normalized_orden) > 1 and normalized_orden.upper() != "PENDIENTE":
            query_pedidos = db.query(PedidoComercial).filter(
                PedidoComercial.orden_beta.ilike(f"%{normalized_orden}%")
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
                "cliente_nombre": None,
                "maestro": None
            }
    
        pedido_cliente_raw = pedido.cliente or ""
        pedido_cliente_clean = pedido_cliente_raw.strip()
        pedido_pais_clean = pedido.pais.strip() if pedido.pais else ""
        pedido_pod_clean = pedido.pod.strip() if pedido.pod else ""
    
        # Prioridad 1: Match por Nombre + País + Puerto de Destino (POD)
        cliente_maestro = db.query(ClienteIE).filter(
            func.trim(ClienteIE.nombre_legal).ilike(pedido_cliente_clean),
            func.trim(ClienteIE.pais).ilike(pedido_pais_clean),
            func.trim(ClienteIE.destino).ilike(pedido_pod_clean),
            ClienteIE.estado == "ACTIVO"
        ).first()
    
        # Prioridad 2: Match por Nombre + País
        if not cliente_maestro:
            cliente_maestro = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(pedido_cliente_clean),
                func.trim(ClienteIE.pais).ilike(pedido_pais_clean),
                ClienteIE.estado == "ACTIVO"
            ).first()
    
        # Prioridad 3: Match solo por Nombre
        if not cliente_maestro:
            cliente_maestro = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(pedido_cliente_clean),
                ClienteIE.estado == "ACTIVO"
            ).first()
    
        # Prioridad 4: Match Inteligente
        if not cliente_maestro and pedido_cliente_raw:
            clean_excel_name = normalize_client_name(pedido_cliente_raw)
            cliente_maestro = db.query(ClienteIE).filter(
                (func.trim(ClienteIE.nombre_legal).ilike(f"%{clean_excel_name}%")) | 
                (func.upper(clean_excel_name).like(func.concat('%', func.trim(ClienteIE.nombre_legal), '%'))),
                ClienteIE.estado == "ACTIVO"
            ).first()
    
            if not cliente_maestro:
                words = [w.replace('(', '').replace(')', '').strip() for w in pedido_cliente_raw.split() if len(w) > 2]
                if len(words) >= 2:
                    fuzzy_query = f"%{words[0]}%{words[1]}%"
                    cliente_maestro = db.query(ClienteIE).filter(
                        ClienteIE.nombre_legal.ilike(fuzzy_query),
                        ClienteIE.estado == "ACTIVO"
                    ).first()
    
        # Cálculos de Pesos y Logística
        from app.models.maestros import Planta
        total_cajas = sum(int(p.total_cajas or 0) for p in pedidos)
        total_pallets = sum(int(p.total_pallets or 0) for p in pedidos)
        peso_kg = float(pedidos[0].peso_por_caja or 0.0) if pedidos else 0.0
        peso_neto = float(total_cajas) * peso_kg
        p_bruto = peso_neto + (float(total_pallets) * 30.0) + (float(total_cajas) * 0.25)
        
        planta_maestro = db.query(Planta).filter(Planta.planta.ilike(pos.PLANTA_LLENADO)).first() if pos.PLANTA_LLENADO else None
        
        response = {
            "booking": booking,
            "orden_beta": pos.ORDEN_BETA or "PENDIENTE",
            "cultivo": pos.CULTIVO or "PENDIENTE",
            "variedad": (pedidos[0].variedad if pedidos and hasattr(pedidos[0], 'variedad') else "WONDERFUL"),
            "motonave": pos.NAVE or "",
            "naviera": pos.NAVIERA or "",
            "puerto_embarque": pos.POL or "CALLAO",
            "puerto_destino": getattr(pos, 'POD', None) or (cliente_maestro.destino if cliente_maestro else ""),
            "eta": pos.ETA.strftime('%d/%m/%Y') if pos.ETA else "",
            "operador_logistico": getattr(pos, 'OPERADOR_LOGISTICO', "DP WORLD LOGISTICS S.R.L.") or "DP WORLD LOGISTICS S.R.L.",
            "planta_llenado": planta_maestro.planta if planta_maestro else (pos.PLANTA_LLENADO or "PLANTA BETA"),
            "direccion_planta": planta_maestro.direccion if planta_maestro else "",
            "cliente_nombre": (cliente_maestro.consignatario_bl or pedido_cliente_raw) if (cliente_maestro and cliente_maestro.consignatario_bl) else (pedido_cliente_raw if pedido_cliente_raw else "POR DEFINIR"),
            "incoterm": pedido.incoterm if pedido else "",
            "cajas": total_cajas,
            "pallets": total_pallets,
            "peso_neto": f"{peso_neto:,.3f} KG",
            "peso_bruto": f"{p_bruto:,.3f} KG",
            
            "temperatura": pos.TEMPERATURA or "0.5 °C",
            "ventilacion": pos.VENTILACION or "15 CBM",
            "humedad": pos.HUMEDAD or "OFF",
            "atm": pos.AC or "NO APLICA",
            "oxigeno": "----",
            "co2": "----",
            "filtros": pos.FILTROS or "NO",
            "cold_treatment": pos.CT or "NO",
            
            "warning": None,
            "maestro": None
        }
    
        if cliente_maestro:
            fito_data = None
            if cliente_maestro.fitosanitario:
                fito_data = {
                    "id": cliente_maestro.fitosanitario.id,
                    "consignatario_fito": cliente_maestro.fitosanitario.consignatario_fito,
                    "direccion_fito": cliente_maestro.fitosanitario.direccion_fito
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
                "fitosanitario": fito_data
            }
        else:
            response["warning"] = "CLIENTE_NO_MAESTRO"
    
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error crítico en lookup_booking_data: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-pdf")
def generate_pdf_ie(req: GeneratePDFRequest, db: Session = Depends(get_db)):
    """
    Genera y retorna el PDF de la Instrucción de Embarque consolidada.
    """
    try:
        pdf_data = instruction_pdf_service.generate_instruction_pdf(
            booking=req.booking,
            db=db,
            observaciones=req.observaciones
        )
        
        orden_beta = pdf_data.get("orden_beta")
        # Asegurarnos de que no esté en blanco, falso, y priorizarlo
        if orden_beta and str(orden_beta).strip() and str(orden_beta).upper() != "PENDIENTE":
            filename = f"IE_{orden_beta}.pdf"
        elif not orden_beta or str(orden_beta).strip().upper() == "PENDIENTE":
            filename = f"IE_PENDIENTE.pdf"
        else:
            filename = f"IE_{req.booking}.pdf"
            
        return StreamingResponse(
            io.BytesIO(pdf_data["pdf_bytes"]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        logger.error(f"Error crítico en generación de PDF: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-pdf-override")
def generate_pdf_override(req: AdminOverrideRequest, db: Session = Depends(get_db)):
    """
    Endpoint exclusivo para Administradores que permite sobreescribir todos los campos.
    """
    try:
        pdf_data = instruction_pdf_service.generate_instruction_pdf(
            booking=req.booking,
            db=db,
            override_data=req.dict()
        )
        
        filename = f"IE_{req.orden_beta}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_data["pdf_bytes"]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        logger.error(f"Error en PDF Override: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
