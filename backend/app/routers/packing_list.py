"""
Router: Packing List OGL
Módulo de generación automática del Packing List para el cliente OGL.
Autor: AgroFlow Dev Team
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
from app.database import get_db
from app.models.pedido import PedidoComercial
from app.models.posicionamiento import Posicionamiento
from app.models.embarque import ControlEmbarque, ReporteEmbarques
from pydantic import BaseModel
import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment
from copy import copy
import io
import os
import re
from datetime import datetime

router = APIRouter(
    prefix="/api/v1/packing-list",
    tags=["Packing List OGL"]
)

# ---------------------------------------------------------------------------
# Constante: nombre del cliente objetivo
# ---------------------------------------------------------------------------
OGL_KEYWORD = "OGL"

# ---------------------------------------------------------------------------
# Helper: normalizar ORDEN_BETA para el JOIN con pedidos_comerciales
#
# Regla de negocio confirmada por Inge Daniel:
#   posicionamientos.ORDEN_BETA  = "BG0080"  (con prefijo de letras)
#   pedidos_comerciales.orden_beta = "0080"   (solo dígitos)
#
# La función extrae solo los dígitos para hacer el match correcto.
# ---------------------------------------------------------------------------
def strip_orden_beta(orden_beta: Optional[str]) -> Optional[str]:
    """Extrae solo los dígitos de una cadena tipo 'BG0080' → '0080'."""
    if not orden_beta:
        return None
    numeric = re.sub(r'[^0-9]', '', orden_beta)
    return numeric if numeric else None

TEMPLATE_PATH = os.path.join(
    os.path.dirname(__file__),  # app/routers/
    "..", "..",                  # backend/
    "assets", "templates",
    "FORMATO PL - OGL.xlsx"
)

# ---------------------------------------------------------------------------
# Schemas de respuesta
# ---------------------------------------------------------------------------
class NaveInfo(BaseModel):
    nave: str
    fuente: str      # "reporte_embarques" | "posicionamiento"
    bookings: List[str]

class BookingOGL(BaseModel):
    booking: str
    orden_beta: Optional[str]
    contenedor: Optional[str]
    dam: Optional[str]
    port_id_orig: Optional[str]
    port_id_dest: Optional[str]
    variedad: Optional[str]
    total_cajas: Optional[int]

# ---------------------------------------------------------------------------
# GET /naves  ─  Lista todas las naves disponibles (con jerarquía de fuente)
# NO depende de pedidos_comerciales para mostrar naves.
# ---------------------------------------------------------------------------
@router.get("/naves", response_model=List[NaveInfo])
def listar_naves_ogl(db: Session = Depends(get_db)):
    """
    Retorna naves únicas desde posicionamientos y reporte_embarques.
    Jerarquía por booking:
      1. ReporteEmbarques.nave_arribo  (fuente primaria si existe y no es NULL)
      2. Posicionamiento.NAVE          (fallback)

    NOTA: No filtra por cliente OGL aquí para evitar fallos cuando
    pedidos_comerciales no tiene el registro. El filtro OGL aplica
    al nivel del botón de generación.
    """

    # 1. Traer TODOS los posicionamientos que tengan una nave definida
    #    (sea por Posicionamiento.NAVE o por ReporteEmbarques.nave_arribo)
    todos_pos = db.query(Posicionamiento).all()

    # nave_map: { nombre_nave_upper -> {fuente, bookings: []} }
    nave_map: dict[str, dict] = {}

    for pos in todos_pos:
        booking = pos.BOOKING
        if not booking:
            continue

        # Intentar fuente primaria: ReporteEmbarques
        reporte = (
            db.query(ReporteEmbarques)
            .filter(ReporteEmbarques.booking == booking)
            .first()
        )

        nave = None
        fuente = None

        if reporte and reporte.nave_arribo and reporte.nave_arribo.strip():
            nave = reporte.nave_arribo.strip().upper()
            fuente = "reporte_embarques"
        elif pos.NAVE and pos.NAVE.strip():
            nave = pos.NAVE.strip().upper()
            fuente = "posicionamiento"

        # Si no hay nave en ninguna fuente, omitir
        if not nave:
            continue

        if nave not in nave_map:
            nave_map[nave] = {"fuente": fuente, "bookings": []}

        if booking not in nave_map[nave]["bookings"]:
            nave_map[nave]["bookings"].append(booking)

    # Ordenar alfabéticamente
    result = []
    for nave, data in sorted(nave_map.items()):
        result.append(NaveInfo(
            nave=nave,
            fuente=data["fuente"],
            bookings=data["bookings"]
        ))

    return result


# ---------------------------------------------------------------------------
# GET /bookings  ─  Todos los bookings de una nave
# ---------------------------------------------------------------------------
@router.get("/bookings")
def listar_bookings_ogl(nave: str, db: Session = Depends(get_db)):
    """
    Dado un nombre de nave, retorna todos los bookings asociados
    con información completa. Intenta enriquecer con PedidoComercial
    pero NO bloquea si no existe el registro.
    """
    nave_upper = nave.strip().upper()

    # Paso 1: bookings desde ReporteEmbarques con esa nave
    bookings_from_reporte = (
        db.query(ReporteEmbarques.booking)
        .filter(func.upper(func.trim(ReporteEmbarques.nave_arribo)) == nave_upper)
        .all()
    )
    bookings_set = {r.booking for r in bookings_from_reporte if r.booking}

    # Paso 2: bookings desde Posicionamiento (fallback o adicionales)
    bookings_from_pos = (
        db.query(Posicionamiento)
        .filter(func.upper(func.trim(Posicionamiento.NAVE)) == nave_upper)
        .all()
    )
    for pos in bookings_from_pos:
        if pos.BOOKING:
            bookings_set.add(pos.BOOKING)

    if not bookings_set:
        raise HTTPException(status_code=404, detail=f"No se encontraron bookings para la nave '{nave}'")

    resultado = []
    for booking in sorted(bookings_set):
        pos = (
            db.query(Posicionamiento)
            .filter(Posicionamiento.BOOKING == booking)
            .first()
        )

        # JOIN normalizado con PedidoComercial:
        # posicionamientos.ORDEN_BETA = 'BG0080' → strip letras → '0080'
        # pedidos_comerciales.orden_beta = '0080'
        # FILTRO: solo incluir si el cliente es OGL
        pedido = None
        if pos and pos.ORDEN_BETA:
            orden_numeric = strip_orden_beta(pos.ORDEN_BETA)
            if orden_numeric:
                pedido = (
                    db.query(PedidoComercial)
                    .filter(
                        PedidoComercial.orden_beta == orden_numeric,
                        PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
                    )
                    .first()
                )

        # Si no hay pedido OGL para este booking → EXCLUIR de la lista
        if not pedido:
            continue

        # Datos de control de embarque
        emb = (
            db.query(ControlEmbarque)
            .filter(ControlEmbarque.booking == booking)
            .first()
        )

        resultado.append({
            "booking":       booking,
            "orden_beta":    pos.ORDEN_BETA if pos else None,
            "contenedor":    emb.contenedor if emb else None,
            "dam":           emb.dam if emb else None,
            "port_id_orig":  pedido.port_id_orig,
            "port_id_dest":  pedido.port_id_dest,
            "variedad":      pedido.variedad,
            "total_cajas":   pedido.total_cajas,
            "presentacion":  pedido.presentacion,
            "pod":           pedido.pod,
            "consignatario": pedido.consignatario,
            "cliente":       pedido.cliente,
        })

    return resultado



# ---------------------------------------------------------------------------
# POST /generate/ogl  ─  Genera el Packing List CONSOLIDADO por NAVE
#
# Lógica de negocio confirmada por Inge Daniel:
#   → El PL de OGL es UN SOLO documento por nave.
#   → Consolida TODOS los bookings OGL que van en esa nave.
#   → El archivo de Confirmación cubre todos los pallets de todos esos bookings.
# ---------------------------------------------------------------------------
@router.post("/generate/ogl")
async def generate_packing_list_ogl(
    nave: str = Form(...),
    confirmaciones: List[UploadFile] = File(...),
    termografos: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Motor de generación del Packing List OGL CONSOLIDADO por NAVE.
    Ordena los bookings cronológicamente por Fecha Programada (FECHA_PO).
    """
    try:
        nave_clean = nave.strip().upper()
        
        # 1. Obtener bookings OGL de la nave
        bookings_from_reporte = (
            db.query(ReporteEmbarques.booking)
            .filter(func.upper(func.trim(ReporteEmbarques.nave_arribo)) == nave_clean)
            .all()
        )
        bookings_set = {r.booking for r in bookings_from_reporte if r.booking}

        bookings_from_pos = (
            db.query(Posicionamiento)
            .filter(func.upper(func.trim(Posicionamiento.NAVE)) == nave_clean)
            .all()
        )
        for pos in bookings_from_pos:
            if pos.BOOKING: bookings_set.add(pos.BOOKING)

        if not bookings_set:
            raise HTTPException(status_code=404, detail=f"No se encontraron bookings para la nave '{nave}'")

        booking_data_map: dict[str, dict] = {}
        primer_pedido = None
        primer_pos = None

        for booking in sorted(bookings_set):
            pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
            if not pos: continue

            pedido = None
            if pos.ORDEN_BETA:
                orden_numeric = strip_orden_beta(pos.ORDEN_BETA)
                if orden_numeric:
                    pedido = db.query(PedidoComercial).filter(
                        PedidoComercial.orden_beta == orden_numeric,
                        PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
                    ).first()
            
            if not pedido: continue

            emb = db.query(ControlEmbarque).filter(ControlEmbarque.booking == booking).first()
            contenedor_fmt = format_container_ogl(emb.contenedor if emb else "")

            # Prioridad de fecha: FECHA_PO -> ETD -> Hoy
            prog_date = getattr(pos, "FECHA_PO", None) or getattr(pos, "ETD", None) or datetime.now().date()

            booking_data_map[booking] = {
                "contenedor": contenedor_fmt, 
                "pedido": pedido, 
                "pos": pos,
                "fecha_prog": prog_date
            }
            if primer_pedido is None:
                primer_pedido = pedido; primer_pos = pos

        if not booking_data_map:
            raise HTTPException(status_code=404, detail="No se encontraron bookings OGL para consolidar")

        # 2. Cargar todos los pallets
        agrupado_por_booking: dict[str, list] = {b: [] for b in booking_data_map.keys()}
        contenedor_default = next(iter(booking_data_map.values()))["contenedor"]

        for conf_file in confirmaciones:
            content = await conf_file.read()
            try:
                # Primero leemos sin cabecera para buscarla dinámicamente
                df_raw = pd.read_excel(io.BytesIO(content), engine="openpyxl", header=None)
                
                # Buscamos la fila que contiene la palabra "PALLET" o "HU"
                header_index = 0
                found_header = False
                for i in range(min(20, len(df_raw))):
                    row_values = [str(x).upper() for x in df_raw.iloc[i].values]
                    if any("PALLET" in val or "HU" in val for val in row_values):
                        header_index = i
                        found_header = True
                        break
                
                # Volvemos a cargar con la cabecera correcta
                df = pd.read_excel(io.BytesIO(content), engine="openpyxl", header=header_index)
                df.columns = df.columns.str.strip().str.upper()
            except Exception as e:
                print(f"Error al procesar archivo {conf_file.filename}: {e}")
                continue

            def find_col(df, kws):
                for c in [str(col) for col in df.columns]:
                    for kw in kws:
                        if kw.upper() in c.upper(): return c
                return None

            col_pallet  = find_col(df, ["PALLET", "HU", "ID PALLET"])
            col_booking = find_col(df, ["BOOKING", "DESPACHO", "ORDEN"])
            
            if not col_pallet:
                raise Exception(f"El archivo {conf_file.filename} no tiene columna de Pallets.")

            col_calibre = find_col(df, ["CALIBRE", "CALIDAD"])
            col_kilos   = find_col(df, ["KILOS", "PESO NETO", "NET"])
            col_cosecha = find_col(df, ["COSECHA", "HARVEST"])
            col_proceso = find_col(df, ["PROCESO", "PROCESS"])
            col_lote    = find_col(df, ["LOTE", "LOT"])
            col_cajas   = find_col(df, ["CAJAS", "BOXES", "QTY"])

            for _, row in df.iterrows():
                p_id = str(row.get(col_pallet)).strip() if pd.notna(row.get(col_pallet)) else ""
                if not p_id or p_id.lower() == "nan": continue

                bk_f = str(row.get(col_booking)).strip().upper() if col_booking and pd.notna(row.get(col_booking)) else ""
                if not bk_f or bk_f not in booking_data_map:
                    bk_f = next(iter(booking_data_map)) if len(booking_data_map) == 1 else "DESCONOCIDO"

                if bk_f not in agrupado_por_booking: agrupado_por_booking[bk_f] = []

                agrupado_por_booking[bk_f].append({
                    "pallet": p_id,
                    "calibre": str(row.get(col_calibre, "")).strip() if col_calibre and pd.notna(row.get(col_calibre)) else "",
                    "kilos": row.get(col_kilos) if col_kilos else 0,
                    "cajas": row.get(col_cajas) if col_cajas else 0,
                    "cosecha": str(row.get(col_cosecha, "")).strip() if col_cosecha else "",
                    "proceso": str(row.get(col_proceso, "")).strip() if col_proceso else "",
                    "lote": str(row.get(col_lote, "")).strip() if col_lote else "",
                })

        # 3. Ordenar y escribir
        lista_ordenada = sorted(booking_data_map.items(), key=lambda x: x[1]["fecha_prog"])
        template_path = os.path.normpath(TEMPLATE_PATH)
        wb = openpyxl.load_workbook(template_path, keep_vba=False)
        ws = wb.active

        def safe_float(val):
            try: return float(val) if pd.notna(val) else 0.0
            except: return 0.0

        GRID_START_ROW = 20
        fila_secuencial = 1
        for bk_id, _ in lista_ordenada:
            for item in agrupado_por_booking.get(bk_id, []):
                fila_e = GRID_START_ROW + (fila_secuencial - 1)
                ws.cell(row=fila_e, column=1).value = fila_secuencial
                ws.cell(row=fila_e, column=2).value = item["pallet"]
                ws.cell(row=fila_e, column=3).value = booking_data_map[bk_id]["contenedor"]
                ws.cell(row=fila_e, column=4).value = item["calibre"]
                ws.cell(row=fila_e, column=5).value = safe_float(item["kilos"])
                ws.cell(row=fila_e, column=6).value = round(safe_float(item["cajas"]) * 4.2, 2)
                ws.cell(row=fila_e, column=7).value = item["cosecha"]
                ws.cell(row=fila_e, column=8).value = item["proceso"]
                ws.cell(row=fila_e, column=9).value = item["lote"]
                fila_secuencial += 1

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"PackingList_OGL_{nave_clean.replace(' ','_')}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Helper (usado en generate) ─ formato contenedor OGL
# ---------------------------------------------------------------------------
def format_container_ogl(code: str) -> str:
    """Convierte MEDU9144085 → MEDU 9144085 (4 letras + espacio + número)."""
    if not code or len(code) < 5:
        return code or ""
    code = code.strip().upper()
    if " " in code:
        return code
    return f"{code[:4]} {code[4:]}"


