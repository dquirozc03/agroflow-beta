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
import traceback
import re
import io

router = APIRouter(prefix="/api/v1/instrucciones", tags=["instrucciones-ie"])

class GeneratePDFRequest(BaseModel):
    booking: str
    observaciones: str = ""

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
    pedido = db.query(PedidoComercial).filter(
        PedidoComercial.orden_beta.ilike(f"%{normalized_orden}%"),
        PedidoComercial.cultivo.ilike(pos.CULTIVO)
    ).first()

    if not pedido:
        # Retornar lo básico que tenemos de posicionamiento si no hay match comercial
        return {
            "booking": booking,
            "orden_beta": pos.ORDEN_BETA,
            "cultivo": pos.CULTIVO,
            "warning": "PEDIDO_NO_ENCONTRADO",
            "cliente_nombre": None,
            "maestro": None
        }

    # 4. Buscar en Maestros Cliente IE con desambiguación TRIPLE
    # Prioridad 1: Match por Nombre + País + Puerto de Destino (POD)
    cliente_maestro = db.query(ClienteIE).filter(
        ClienteIE.nombre_legal.ilike(pedido.cliente),
        ClienteIE.pais.ilike(pedido.pais),
        ClienteIE.destino.ilike(pedido.pod),
        ClienteIE.estado == "ACTIVO"
    ).first()

    # Prioridad 2: Match por Nombre + País (Sigue siendo muy seguro)
    if not cliente_maestro:
        cliente_maestro = db.query(ClienteIE).filter(
            ClienteIE.nombre_legal.ilike(pedido.cliente),
            ClienteIE.pais.ilike(pedido.pais),
            ClienteIE.estado == "ACTIVO"
        ).first()

    # Prioridad 3: Match solo por Nombre (Fallback legacy)
    if not cliente_maestro:
        cliente_maestro = db.query(ClienteIE).filter(
            ClienteIE.nombre_legal.ilike(pedido.cliente),
            ClienteIE.estado == "ACTIVO"
        ).first()

    # Prioridad 4: Match Inteligente (Westfalia Style 💎)
    # Maneja discrepancias como: "BETA BEST HOLLAND" -> "BETA BEST" 
    # o "WESTFALIA FRUIT (HAUSLADEN)" -> "WESTFALIA FRUIT GMBH"
    if not cliente_maestro:
        # A. Normalización de ruido común
        noise = ['LTD', 'INC', 'S.A.', 'S.R.L.', 'GMBH', 'SA', 'CORP', 'BV', 'B.V.', 'HOLLAND', 'EUROPE', 'USA', 'LLC']
        clean_excel_name = pedido.cliente.upper()
        for n in noise:
            # Reemplazo con espacios para no pegar palabras accidentalmente
            clean_excel_name = f" {clean_excel_name} ".replace(f" {n} ", " ").strip()
        
        # B. Estrategia por Nombre Limpio (Contenido)
        # Si el nombre del maestro está contenido en el nombre limpio del Excel o viceversa
        cliente_maestro = db.query(ClienteIE).filter(
            (ClienteIE.nombre_legal.ilike(f"%{clean_excel_name}%")) | 
            (func.upper(clean_excel_name).like(func.concat('%', ClienteIE.nombre_legal, '%'))),
            ClienteIE.estado == "ACTIVO"
        ).first()

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
        "orden_beta": pos.ORDEN_BETA,
        "cultivo": pos.CULTIVO,
        "cliente_nombre": pedido.cliente,
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
