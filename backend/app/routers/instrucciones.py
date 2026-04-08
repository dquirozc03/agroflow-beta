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
    operador_logistico: Optional[str] = "DP WORLD LOGISTICS S.R.L."
    planta_llenado: Optional[str] = None
    direccion_planta: Optional[str] = None
    fecha_llenado: Optional[str] = None

@router.get("/lookup/{booking}")
def lookup_booking_data(booking: str, db: Session = Depends(get_db)):
    """
    Lógica de Match inteligente:
    1. Busca Booking en Posicionamiento -> Obtiene Orden y Cultivo.
    2. Busca en Cuadro de Pedidos (usando orden normalizada y cultivo) -> Obtiene Cliente.
    3. Busca en Maestros Cliente IE -> Obtiene detalles fitosanitarios.
    """
    # 1. Buscar en posicionamiento
    pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Booking no encontrado en posicionamiento")

    # 2. Normalización de Orden (Extraer solo números)
    # Ejemplo: BG009 -> 009
    raw_orden = pos.ORDEN_BETA or ""
    match = re.search(r'\d+', raw_orden)
    normalized_orden = match.group(0) if match else raw_orden
    
    # Intentar buscar con el número exacto (con ceros a la izquierda si el Excel los tiene)
    # o simplemente como string normalizado
    
    # 3. Buscar en Cuadro de Pedidos
    # El campo en PedidoComercial es 'orden_beta' y 'cultivo'
    # Nota: Usamos ilike o normalize para mayor seguridad
    pedido = None
    if normalized_orden and len(normalized_orden) > 1 and normalized_orden.upper() != "PENDIENTE":
        query_pedidos = db.query(PedidoComercial).filter(
            PedidoComercial.orden_beta.ilike(f"%{normalized_orden}%")
        )
        if pos.CULTIVO and pos.CULTIVO.strip().upper() not in ["", "PENDIENTE", "N/A", "-"]:
            query_pedidos = query_pedidos.filter(PedidoComercial.cultivo.ilike(pos.CULTIVO))
        
        pedido = query_pedidos.first()

    if not pedido:
        # Retornar lo básico que tenemos de posicionamiento si no hay match comercial
        return {
            "booking": booking,
            "orden_beta": pos.ORDEN_BETA or "PENDIENTE",
            "cultivo": pos.CULTIVO or "PENDIENTE",
            "warning": "PEDIDO_NO_ENCONTRADO",
            "cliente_nombre": None,
            "maestro": None
        }

    pedido_cliente_clean = pedido.cliente.strip()
    pedido_pais_clean = pedido.pais.strip() if pedido.pais else ""
    pedido_pod_clean = pedido.pod.strip() if pedido.pod else ""

    # Prioridad 1: Match por Nombre + País + Puerto de Destino (POD)
    cliente_maestro = db.query(ClienteIE).filter(
        func.trim(ClienteIE.nombre_legal).ilike(pedido_cliente_clean),
        func.trim(ClienteIE.pais).ilike(pedido_pais_clean),
        func.trim(ClienteIE.destino).ilike(pedido_pod_clean),
        ClienteIE.estado == "ACTIVO"
    ).first()

    # Prioridad 2: Match por Nombre + País (Sigue siendo muy seguro)
    if not cliente_maestro:
        cliente_maestro = db.query(ClienteIE).filter(
            func.trim(ClienteIE.nombre_legal).ilike(pedido_cliente_clean),
            func.trim(ClienteIE.pais).ilike(pedido_pais_clean),
            ClienteIE.estado == "ACTIVO"
        ).first()

    # Prioridad 3: Match solo por Nombre (Fallback legacy)
    if not cliente_maestro:
        cliente_maestro = db.query(ClienteIE).filter(
            func.trim(ClienteIE.nombre_legal).ilike(pedido_cliente_clean),
            ClienteIE.estado == "ACTIVO"
        ).first()

    # Prioridad 4: Match Inteligente (Westfalia Style 💎)
    # Maneja discrepancias como: "BETA BEST HOLLAND" -> "BETA BEST" 
    # o "WESTFALIA FRUIT (HAUSLADEN)" -> "WESTFALIA FRUIT GMBH"
    if not cliente_maestro:
        # A. Normalización profunda (v2.2 💎)
        clean_excel_name = normalize_client_name(pedido.cliente)
        
        # B. Estrategia por Nombre Normalizado (Contenido)
        # Probamos si el nombre limpio del excel o del DB (normalizado) coinciden
        cliente_maestro = db.query(ClienteIE).filter(
            (func.trim(ClienteIE.nombre_legal).ilike(f"%{clean_excel_name}%")) | 
            (func.upper(clean_excel_name).like(func.concat('%', func.trim(ClienteIE.nombre_legal), '%'))),
            ClienteIE.estado == "ACTIVO"
        ).first()

        if not cliente_maestro:
             # Si no hay match directo, intentamos un matching de palabras clave
             # con el nombre normalizado (Ignoramos paréntesis del DB también si es posible)
             # Pero por ahora confiamos en substring de clean_excel_name.
             pass

        # C. Estrategia por Palabras Clave (Fuzzy Directo)
        if not cliente_maestro:
            words = [w.replace('(', '').replace(')', '').strip() for w in pedido.cliente.split() if len(w) > 2]
            if len(words) >= 2:
                # Caso: "BETA BEST ..." -> Match con "%BETA%BEST%"
                fuzzy_query = f"%{words[0]}%{words[1]}%"
                cliente_maestro = db.query(ClienteIE).filter(
                    ClienteIE.nombre_legal.ilike(fuzzy_query),
                    ClienteIE.estado == "ACTIVO"
                ).first()

    response = {
        "booking": booking,
        "orden_beta": pos.ORDEN_BETA or "PENDIENTE",
        "cultivo": pos.CULTIVO or "PENDIENTE",
        "cliente_nombre": (cliente_maestro.consignatario_bl or pedido.cliente) if (cliente_maestro and cliente_maestro.consignatario_bl) else pedido.cliente,
        "incoterm": pedido.incoterm,
        "warning": None,
        "maestro": None
    }

    if cliente_maestro:
        # Cargar fito si existe
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
            "notify_bl": cliente_maestro.notify_bl,
            "direccion_notify": cliente_maestro.direccion_notify,
            "fitosanitario": fito_data
        }
    else:
        response["warning"] = "CLIENTE_NO_MAESTRO"

    return response

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
        
        filename = f"IE_{req.booking}.pdf"
        if pdf_data.get("orden_beta"):
            filename = f"IE_{pdf_data['orden_beta']}.pdf"
            
        return StreamingResponse(
            io.BytesIO(pdf_data["pdf_bytes"]),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
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
        
        filename = f"IE_CUSTOM_{req.booking}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_data["pdf_bytes"]),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        logger.error(f"Error en PDF Override: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
