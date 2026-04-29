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

@router.get("/lookup/{booking}")
def lookup_booking_data(booking: str, db: Session = Depends(get_db)):
    try:
        emision_activa = db.query(EmisionInstruccion).filter(EmisionInstruccion.booking == booking, EmisionInstruccion.status == "ACTIVO").first()
        pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
        if not pos: raise HTTPException(status_code=404, detail="Booking no encontrado en posicionamiento")
    
        raw_orden = pos.ORDEN_BETA or ""
        match = re.search(r'\d+', raw_orden)
        normalized_orden = match.group(0) if match else raw_orden
        
        pedido = None
        pedidos = []
        if normalized_orden and len(normalized_orden) > 1 and normalized_orden.upper() != "PENDIENTE":
            query_pedidos = db.query(PedidoComercial).filter(PedidoComercial.orden_beta.ilike(f"%{normalized_orden}%"))
            if pos.CULTIVO and pos.CULTIVO.strip().upper() not in ["", "PENDIENTE", "N/A", "-"]:
                query_pedidos = query_pedidos.filter(PedidoComercial.cultivo.ilike(pos.CULTIVO))
            pedidos = query_pedidos.all(); pedido = pedidos[0] if pedidos else None
    
        from app.models.maestros import Planta
        total_cajas = sum(int(p.total_cajas or 0) for p in pedidos)
        total_pallets = sum(int(p.total_pallets or 0) for p in pedidos)
        peso_kg = float(pedidos[0].peso_por_caja or 0.0) if pedidos else 0.0
        peso_neto = float(total_cajas) * peso_kg
        p_bruto = peso_neto + (float(total_pallets) * 30.0) + (float(total_cajas) * 0.25)
        
        planta_maestro = db.query(Planta).filter(Planta.planta.ilike(pos.PLANTA_LLENADO)).first() if pos.PLANTA_LLENADO else None
        
        # ... (Sigue la lógica similar mapeando a los atributos en MAYÚSCULAS)
        return {
            "booking": booking,
            "orden_beta": pos.ORDEN_BETA or "PENDIENTE",
            "cultivo": pos.CULTIVO or "PENDIENTE",
            "variedad": (pedidos[0].variedad if pedidos and hasattr(pedidos[0], 'variedad') else "WONDERFUL"),
            "motonave": pos.NAVE or "",
            "naviera": pos.NAVIERA or "",
            "puerto_embarque": pos.POL or "CALLAO",
            "eta": pos.ETA.strftime('%d/%m/%Y') if pos.ETA else "",
            "planta_llenado": planta_maestro.planta if planta_maestro else (pos.PLANTA_LLENADO or "PLANTA BETA"),
            "cajas": total_cajas,
            "pallets": total_pallets,
            "peso_neto": f"{peso_neto:,.3f} KG",
            "peso_bruto": f"{p_bruto:,.3f} KG",
            "temperatura": pos.TEMPERATURA or "0.5 °C",
            "ventilacion": pos.VENTILACION or "15 CBM",
            "humedad": pos.HUMEDAD or "OFF",
            "atm": pos.AC or "NO APLICA",
            "filtros": pos.FILTROS or "NO",
            "cold_treatment": pos.CT or "NO",
            "etiquetas": pos.ETIQUETA_CAJA or "GENERICA",
            "emision_activa": emision_activa.id if emision_activa else None
        }
    except Exception as e:
        logger.error(f"Error lookup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
