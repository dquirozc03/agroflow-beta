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
from datetime import datetime

router = APIRouter(
    prefix="/api/v1/packing-list",
    tags=["Packing List OGL"]
)

# ---------------------------------------------------------------------------
# Constante: nombre del cliente objetivo
# ---------------------------------------------------------------------------
OGL_KEYWORD = "OGL"

# Ruta al template del cliente (openpyxl mantendrá los bloqueos y formatos)
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
# GET /naves  ─  Lista naves con órdenes OGL (con jerarquía de fuente)
# ---------------------------------------------------------------------------
@router.get("/naves", response_model=List[NaveInfo])
def listar_naves_ogl(db: Session = Depends(get_db)):
    """
    Retorna naves únicas que tienen al menos un Pedido Comercial de OGL.
    Jerarquía:
      1. ReporteEmbarques.nave_arribo  (fuente primaria)
      2. Posicionamiento.NAVE          (fallback)
    """

    # 1. Traer todos los pedidos del cliente OGL
    pedidos_ogl = (
        db.query(PedidoComercial)
        .filter(PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%"))
        .all()
    )

    if not pedidos_ogl:
        return []

    # Mapear orden_beta -> pedido para lookup rápido
    orden_betas_ogl = [p.orden_beta for p in pedidos_ogl if p.orden_beta]

    # 2. Buscar posicionamientos asociados a esas órdenes OGL
    posicionamientos = (
        db.query(Posicionamiento)
        .filter(Posicionamiento.ORDEN_BETA.in_(orden_betas_ogl))
        .all()
    )

    # Mapa booking -> posicionamiento
    booking_to_pos = {p.BOOKING: p for p in posicionamientos}

    # 3. Para cada booking, buscar si existe en ReporteEmbarques (fuente primaria)
    nave_map: dict[str, dict] = {}  # nave -> {fuente, bookings}

    for pos in posicionamientos:
        booking = pos.BOOKING

        # Intentar obtener nave desde ReporteEmbarques
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

        if not nave:
            continue

        if nave not in nave_map:
            nave_map[nave] = {"fuente": fuente, "bookings": []}

        if booking not in nave_map[nave]["bookings"]:
            nave_map[nave]["bookings"].append(booking)

    # 4. Construir respuesta
    result = []
    for nave, data in sorted(nave_map.items()):
        result.append(NaveInfo(
            nave=nave,
            fuente=data["fuente"],
            bookings=data["bookings"]
        ))

    return result


# ---------------------------------------------------------------------------
# GET /bookings  ─  Bookings OGL para una nave específica
# ---------------------------------------------------------------------------
@router.get("/bookings")
def listar_bookings_ogl(nave: str, db: Session = Depends(get_db)):
    """
    Dado un nombre de nave, retorna todos los bookings OGL asociados
    con información completa para pre-poblar el formulario.
    """
    nave_upper = nave.strip().upper()

    # Buscar posicionamientos con esa nave (jerarquía: reporte primero, luego pos)
    # Paso 1: bookings desde ReporteEmbarques con esa nave
    bookings_from_reporte = (
        db.query(ReporteEmbarques.booking)
        .filter(func.upper(func.trim(ReporteEmbarques.nave_arribo)) == nave_upper)
        .all()
    )
    bookings_set = {r.booking for r in bookings_from_reporte if r.booking}

    # Paso 2: bookings desde Posicionamiento fallback
    bookings_from_pos = (
        db.query(Posicionamiento)
        .filter(func.upper(func.trim(Posicionamiento.NAVE)) == nave_upper)
        .all()
    )
    for pos in bookings_from_pos:
        bookings_set.add(pos.BOOKING)

    if not bookings_set:
        raise HTTPException(status_code=404, detail=f"No se encontraron bookings para la nave '{nave}'")

    # Paso 3: Filtrar solo los que son OGL (cruzando con PedidoComercial vía orden_beta)
    resultado = []
    for booking in bookings_set:
        pos = (
            db.query(Posicionamiento)
            .filter(Posicionamiento.BOOKING == booking)
            .first()
        )
        if not pos:
            continue

        # Verificar que es OGL
        pedido = None
        if pos.ORDEN_BETA:
            pedido = (
                db.query(PedidoComercial)
                .filter(
                    PedidoComercial.orden_beta == pos.ORDEN_BETA,
                    PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
                )
                .first()
            )

        if not pedido:
            continue

        # Obtener datos de control de embarque
        emb = (
            db.query(ControlEmbarque)
            .filter(ControlEmbarque.booking == booking)
            .first()
        )

        resultado.append({
            "booking": booking,
            "orden_beta": pos.ORDEN_BETA,
            "contenedor": emb.contenedor if emb else None,
            "dam": emb.dam if emb else None,
            "port_id_orig": pedido.port_id_orig,
            "port_id_dest": pedido.port_id_dest,
            "variedad": pedido.variedad,
            "total_cajas": pedido.total_cajas,
            "presentacion": pedido.presentacion,
            "pod": pedido.pod,
            "consignatario": pedido.consignatario,
        })

    return resultado


# ---------------------------------------------------------------------------
# POST /generate/ogl  ─  Genera el Excel usando openpyxl
# ---------------------------------------------------------------------------
@router.post("/generate/ogl")
async def generate_packing_list_ogl(
    nave: str = Form(...),
    booking: str = Form(...),
    confirmacion: UploadFile = File(...),
    termografos: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Motor principal de generación del Packing List OGL.
    Cruza:
      - Datos maestros DB: PedidoComercial, Posicionamiento, ControlEmbarque
      - Archivo externo: Confirmación Excel (ID Pallet, Calibre, Kilos, etc.)
    Restricción: usa openpyxl en modo write-only respetando el template original,
    SIN alterar celdas bloqueadas ni formatos del cliente.
    """

    # ═══════════════════════════════════════════════
    # 1. VALIDAR datos desde la DB
    # ═══════════════════════════════════════════════
    booking_clean = booking.strip().upper()
    nave_clean = nave.strip().upper()

    pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking_clean).first()
    if not pos:
        raise HTTPException(status_code=404, detail=f"No se encontró Posicionamiento para booking {booking_clean}")

    pedido = None
    if pos.ORDEN_BETA:
        pedido = (
            db.query(PedidoComercial)
            .filter(
                PedidoComercial.orden_beta == pos.ORDEN_BETA,
                PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
            )
            .first()
        )

    if not pedido:
        raise HTTPException(status_code=404, detail=f"No se encontró Pedido Comercial OGL para la Orden Beta del booking {booking_clean}")

    emb = db.query(ControlEmbarque).filter(ControlEmbarque.booking == booking_clean).first()

    # ═══════════════════════════════════════════════
    # 2. LEER archivo de Confirmación con pandas
    # ═══════════════════════════════════════════════
    confirmacion_bytes = await confirmacion.read()
    try:
        df_conf = pd.read_excel(io.BytesIO(confirmacion_bytes), engine="openpyxl")
        df_conf.columns = df_conf.columns.str.strip().str.upper()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer archivo de Confirmación: {str(e)}")

    # Columnas esperadas en la confirmación (flexible, buscamos por nombre parcial)
    def find_col(df: pd.DataFrame, keywords: list[str]) -> Optional[str]:
        """Encuentra columna por coincidencia parcial de nombre."""
        for col in df.columns:
            for kw in keywords:
                if kw.upper() in col:
                    return col
        return None

    col_pallet  = find_col(df_conf, ["PALLET", "HU", "ID PALLET"])
    col_calibre = find_col(df_conf, ["CALIBRE", "CALIDAD"])
    col_kilos   = find_col(df_conf, ["KILOS", "PESO NETO", "NET"])
    col_cosecha = find_col(df_conf, ["COSECHA", "HARVEST"])
    col_proceso = find_col(df_conf, ["PROCESO", "PROCESS"])
    col_lote    = find_col(df_conf, ["LOTE", "LOT"])
    col_cajas   = find_col(df_conf, ["CAJAS", "BOXES", "QTY"])

    # ═══════════════════════════════════════════════
    # 3. CARGAR el template OGL con openpyxl
    #    keep_vba=False para evitar problemas con macros,
    #    data_only=True para no romper fórmulas del cliente.
    # ═══════════════════════════════════════════════
    template_path = os.path.normpath(TEMPLATE_PATH)
    if not os.path.exists(template_path):
        raise HTTPException(
            status_code=500,
            detail=f"Template OGL no encontrado en: {template_path}"
        )

    try:
        wb = openpyxl.load_workbook(template_path, keep_vba=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al cargar template OGL: {str(e)}")

    # Asumimos que el packing list está en la primera hoja activa
    ws = wb.active

    # ═══════════════════════════════════════════════
    # 4. LLENAR HEADER  (Celdas C3 - C17)
    # Reglas según ticket OGL:
    #   C8  = Vessel (jerarquía: ReporteEmbarques → Posicionamiento)
    #   C12 = Port of Origin
    #   C14 = Port of Destination
    # ═══════════════════════════════════════════════

    # Determinar nave con jerarquía correcta
    reporte = db.query(ReporteEmbarques).filter(ReporteEmbarques.booking == booking_clean).first()
    vessel = None
    if reporte and reporte.nave_arribo and reporte.nave_arribo.strip():
        vessel = reporte.nave_arribo.strip()
    elif pos.NAVE and pos.NAVE.strip():
        vessel = pos.NAVE.strip()
    else:
        vessel = nave_clean

    def safe_write(ws, cell_ref: str, value):
        """Escribe en la celda SOLO si no está protegida por una fórmula compleja."""
        try:
            cell = ws[cell_ref]
            # Respetar celdas con fórmulas del cliente (no sobrescribir)
            if isinstance(cell.value, str) and cell.value.startswith("="):
                return
            cell.value = value
        except Exception:
            pass  # Si la hoja está protegida, omitimos silenciosamente

    # Header estático del Packing List OGL
    safe_write(ws, "C8",  vessel)
    safe_write(ws, "C12", pedido.port_id_orig or "")
    safe_write(ws, "C14", pedido.port_id_dest or "")

    # Datos adicionales del pedido que suelen ir en el header
    safe_write(ws, "C3",  pedido.cliente or "OGL")
    safe_write(ws, "C5",  pedido.consignatario or "")
    safe_write(ws, "C6",  pedido.po or "")
    safe_write(ws, "C7",  booking_clean)
    safe_write(ws, "C9",  pos.ETD.strftime("%d/%m/%Y") if pos.ETD else "")
    safe_write(ws, "C10", pos.ETA.strftime("%d/%m/%Y") if pos.ETA else "")
    safe_write(ws, "C11", pos.POL or "")
    safe_write(ws, "C13", pedido.pod or "")
    safe_write(ws, "C15", pedido.variedad or "")
    safe_write(ws, "C16", pedido.presentacion or "")
    safe_write(ws, "C17", emb.contenedor if emb else "PENDIENTE")

    # ═══════════════════════════════════════════════
    # 5. LLENAR GRID (Fila 20+)
    # Columnas del grid según especificación OGL:
    #   A = #  (número de fila)
    #   B = Pallet ID (de Confirmación)
    #   C = Container No. (de ControlEmbarque DB)
    #   D = Calibre (de Confirmación)
    #   E = Net Weight / Kilos (de Confirmación)
    #   F = Gross Weight = CAJAS * 4.2 (calculado)
    #   G = Cosecha (de Confirmación)
    #   H = Proceso (de Confirmación)
    #   I = Lote (de Confirmación)
    # ═══════════════════════════════════════════════

    # Número de fila de inicio del grid en el template OGL
    GRID_START_ROW = 20
    contenedor_str = emb.contenedor if emb else ""

    # Formatear contenedor al estilo OGL: "MEDU 9144085"
    def format_container_ogl(code: str) -> str:
        """Convierte MEDU9144085 → MEDU 9144085 (4 letras + espacio + número)."""
        if not code or len(code) < 5:
            return code
        code = code.strip().upper()
        # Si ya tiene espacio, devolver tal cual
        if " " in code:
            return code
        # Separar prefijo (4 chars) del número
        return f"{code[:4]} {code[4:]}"

    contenedor_ogl = format_container_ogl(contenedor_str)

    filas_escritas = 0
    for idx, row in df_conf.iterrows():
        fila_excel = GRID_START_ROW + idx

        # Valores de la Confirmación
        pallet_id  = str(row[col_pallet]).strip()  if col_pallet  and pd.notna(row.get(col_pallet))  else ""
        calibre    = str(row[col_calibre]).strip() if col_calibre and pd.notna(row.get(col_calibre)) else ""
        kilos      = row[col_kilos]                if col_kilos   and pd.notna(row.get(col_kilos))   else 0
        cosecha    = str(row[col_cosecha]).strip()  if col_cosecha and pd.notna(row.get(col_cosecha)) else ""
        proceso    = str(row[col_proceso]).strip()  if col_proceso and pd.notna(row.get(col_proceso)) else ""
        lote       = str(row[col_lote]).strip()     if col_lote    and pd.notna(row.get(col_lote))    else ""
        cajas      = row[col_cajas]                 if col_cajas   and pd.notna(row.get(col_cajas))   else 0

        # Calcular Gross Weight: TOTAL CAJAS * 4.2 (regla de negocio OGL)
        try:
            gross_weight = float(cajas) * 4.2
        except (ValueError, TypeError):
            gross_weight = 0.0

        # Omitir filas completamente vacías
        if not pallet_id and not calibre:
            continue

        # Escribir fila en el grid del template
        ws.cell(row=fila_excel, column=1).value = idx + 1        # # secuencial
        ws.cell(row=fila_excel, column=2).value = pallet_id      # Pallet ID
        ws.cell(row=fila_excel, column=3).value = contenedor_ogl # Container No.
        ws.cell(row=fila_excel, column=4).value = calibre         # Calibre
        ws.cell(row=fila_excel, column=5).value = float(kilos) if kilos else 0   # Net Weight
        ws.cell(row=fila_excel, column=6).value = round(gross_weight, 2)          # Gross Weight
        ws.cell(row=fila_excel, column=7).value = cosecha         # Cosecha
        ws.cell(row=fila_excel, column=8).value = proceso         # Proceso
        ws.cell(row=fila_excel, column=9).value = lote            # Lote

        filas_escritas += 1

    # ═══════════════════════════════════════════════
    # 6. SERIALIZAR el workbook a bytes y devolver
    # ═══════════════════════════════════════════════
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    # Nombre de archivo con timestamp y booking
    filename = f"PackingList_OGL_{booking_clean}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
