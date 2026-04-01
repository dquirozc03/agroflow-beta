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
    Retorna naves únicas basándose en la VERDAD ABSOLUTA:
    1. ReporteEmbarques.nave_arribo (Prioridad 1)
    2. Posicionamiento.NAVE (Fallback solo si no hay reporte con otra nave)
    """
    # Mapa de verdad: booking -> nave_actual
    booking_nave_map: dict[str, str] = {}
    
    # 1. Cargar verdades del reporte
    reportes = db.query(ReporteEmbarques).filter(ReporteEmbarques.nave_arribo != None).all()
    for r in reportes:
        if r.booking:
            booking_nave_map[r.booking] = r.nave_arribo.strip().upper()
            
    # 2. Cargar fallbacks del posicionamiento (solo si el booking no está en el mapa anterior)
    posicionamientos = db.query(Posicionamiento).filter(Posicionamiento.NAVE != None).all()
    for p in posicionamientos:
        if p.BOOKING and p.BOOKING not in booking_nave_map:
            booking_nave_map[p.BOOKING] = p.NAVE.strip().upper()

    # 3. Agrupar bookings por nave para el listado final
    nave_stats: dict[str, list] = {}
    for booking, nave in booking_nave_map.items():
        # Opcional: Podríamos verificar aquí si el booking es de OGL 
        # pero para velocidad lo agrupamos todo y filtramos en el siguiente paso
        if nave not in nave_stats:
            nave_stats[nave] = []
        if booking not in nave_stats[nave]:
            nave_stats[nave].append(booking)

    # 4. Construir resultado final filtrando solo naves que tengan algun pedido OGL
    result = []
    for nave, bookings in sorted(nave_stats.items()):
        # Verificar si al menos un booking de esta nave es OGL
        tiene_ogl = False
        for b in bookings:
            pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == b).first()
            if pos and pos.ORDEN_BETA:
                orden_num = strip_orden_beta(pos.ORDEN_BETA)
                if orden_num:
                    pedido_ogl = db.query(PedidoComercial).filter(
                        PedidoComercial.orden_beta == orden_num,
                        PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
                    ).first()
                    if pedido_ogl:
                        tiene_ogl = True
                        break
        
        if tiene_ogl:
            result.append(NaveInfo(
                nave=nave,
                fuente="consolidada",
                bookings=bookings
            ))

    return result


@router.get("/bookings")
def listar_bookings_ogl(nave: str, db: Session = Depends(get_db)):
    """
    Lista todos los bookings cuya nave ACTUAL es la solicitada.
    Prioridad: ReporteEmbarques > Posicionamiento.
    """
    nave_upper = nave.strip().upper()
    
    # 1. Bookings confirmados en esta nave por el reporte
    bk_reporte = {r.booking for r in db.query(ReporteEmbarques.booking).filter(
        func.upper(func.trim(ReporteEmbarques.nave_arribo)) == nave_upper
    ).all() if r.booking}

    # 2. Bookings que dicen estar aquí en posicionamiento
    bk_pos = {p.BOOKING for p in db.query(Posicionamiento.BOOKING).filter(
        func.upper(func.trim(Posicionamiento.NAVE)) == nave_upper
    ).all() if p.BOOKING}

    # 3. Filtrado: Los de posicionamiento solo valen si el reporte no dice otra cosa
    bookings_actuales = set(bk_reporte)
    for b in bk_pos:
        if b in bookings_actuales: continue
        # Ver si el reporte lo movió a OTRA nave
        movido = db.query(ReporteEmbarques).filter(
            ReporteEmbarques.booking == b,
            ReporteEmbarques.nave_arribo != None,
            func.upper(func.trim(ReporteEmbarques.nave_arribo)) != nave_upper
        ).first()
        if not movido:
            bookings_actuales.add(b)

    resultado = []
    for booking in sorted(bookings_actuales):
        pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
        if not pos or not pos.ORDEN_BETA: continue

        orden_num = strip_orden_beta(pos.ORDEN_BETA)
        pedido = db.query(PedidoComercial).filter(
            PedidoComercial.orden_beta == orden_num,
            PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
        ).first()

        if not pedido: continue

        emb = db.query(ControlEmbarque).filter(ControlEmbarque.booking == booking).first()

        resultado.append({
            "booking":       booking,
            "orden_beta":    pos.ORDEN_BETA,
            "contenedor":    emb.contenedor if emb else None,
            "dam":           emb.dam if emb else None,
            "port_id_orig":  pedido.port_id_orig,
            "port_id_dest":  pedido.port_id_dest,
            "variedad":      pedido.variedad,
            "total_cajas":   pedido.total_cajas,
            "presentacion":  pedido.presentacion,
            "pod":           pedido.pod,
            "consignatario": pedido.consignatario,
            "recibidor":     pedido.recibidor,
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
        
        # 1. Obtener bookings cuya "VERDAD ABSOLUTA" es esta nave en el Reporte
        bookings_reporte = db.query(ReporteEmbarques.booking).filter(
            func.upper(func.trim(ReporteEmbarques.nave_arribo)) == nave_clean
        ).all()
        bookings_reporte_set = {r.booking for r in bookings_reporte if r.booking}

        # 2. Obtener bookings que en el Posicionamiento están en esta nave
        bookings_pos = db.query(Posicionamiento.BOOKING).filter(
            func.upper(func.trim(Posicionamiento.NAVE)) == nave_clean
        ).all()
        bookings_pos_set = {r.BOOKING for r in bookings_pos if r.BOOKING}

        # 3. Fusión inteligente: Prioridad TOTAL al Reporte
        # Empezamos con los que el reporte dice que están aquí
        bookings_set = set(bookings_reporte_set)

        # Añadimos los de posicionamiento SOLO SI el reporte no dice que están en OTRA nave
        for b in bookings_pos_set:
            if b in bookings_set: continue
            
            # Verificar si el reporte lo movió a OTRA nave distinta a la limpia
            otra_nave = db.query(ReporteEmbarques).filter(
                ReporteEmbarques.booking == b,
                ReporteEmbarques.nave_arribo != None,
                func.upper(func.trim(ReporteEmbarques.nave_arribo)) != nave_clean
            ).first()
            
            if not otra_nave:
                bookings_set.add(b)

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

            # Prioridad de fecha: FECHA_PROGRAMADA -> ETD -> Hoy
            prog_date = getattr(pos, "FECHA_PROGRAMADA", None) or getattr(pos, "ETD", None) or datetime.now().date()

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
            col_cosecha = find_col(df, ["COSECHA", "HARVEST", "FECHA COSECHA"])
            col_proceso = find_col(df, ["PROCESO", "PROCESS", "FECHA PROCESO"])
            col_lote_ogl = find_col(df, ["LOTE CLIENTE (OGL)", "LOTE OGL", "CLIENT LOT"])
            col_cajas   = find_col(df, ["TOTAL DE CAJAS", "CAJAS", "BOXES", "QTY"])
            col_total_kilos = find_col(df, ["TOTAL KILOS", "NET WEIGHT", "PESO NETO TOTAL"])
            col_trazabilidad = find_col(df, ["CODIGO TRAZABILIDAD", "TRAZABILIDAD", "TRACEABILITY"])

            last_valid_bk = None
            for _, row in df.iterrows():
                # Lógica de Memoria: Forward Fill para el Booking
                current_bk = str(row.get(col_booking)).strip().upper() if col_booking and pd.notna(row.get(col_booking)) else ""
                
                if current_bk and current_bk in booking_data_map:
                    last_valid_bk = current_bk
                elif not current_bk and last_valid_bk:
                    # Si esta celda está vacía, usamos el último booking que vimos
                    current_bk = last_valid_bk
                
                bk_f = current_bk
                if not bk_f or bk_f not in booking_data_map:
                    # Fallback de seguridad solo si hay una única orden en total
                    bk_f = next(iter(booking_data_map)) if len(booking_data_map) == 1 else "DESCONOCIDO"

                p_id = str(row.get(col_pallet)).strip() if pd.notna(row.get(col_pallet)) else ""
                if not p_id or p_id.lower() == "nan": continue

                if bk_f not in agrupado_por_booking: agrupado_por_booking[bk_f] = []

                def format_date_ogl(val):
                    if pd.isna(val) or str(val).strip() == "": return ""
                    try:
                        if isinstance(val, (pd.Timestamp, datetime, date)):
                            return val.strftime("%d/%m/%Y")
                        dt = pd.to_datetime(val)
                        return dt.strftime("%d/%m/%Y")
                    except:
                        return str(val).strip()

                agrupado_por_booking[bk_f].append({
                    "pallet": p_id,
                    "calibre": str(row.get(col_calibre, "")).strip() if col_calibre and pd.notna(row.get(col_calibre)) else "",
                    "kilos": row.get(col_kilos) if col_kilos else 0,
                    "total_kilos": row.get(col_total_kilos) if col_total_kilos else 0,
                    "cajas": row.get(col_cajas) if col_cajas else 0,
                    "cosecha": format_date_ogl(row.get(col_cosecha)),
                    "proceso": format_date_ogl(row.get(col_proceso)),
                    "lote_ogl": str(row.get(col_lote_ogl, "")).strip() if col_lote_ogl and pd.notna(row.get(col_lote_ogl)) else "",
                    "trazabilidad": str(row.get(col_trazabilidad, "")).strip() if col_trazabilidad and pd.notna(row.get(col_trazabilidad)) else "",
                })

        # 3. Ordenar y escribir
        lista_ordenada = sorted(booking_data_map.items(), key=lambda x: x[1]["fecha_prog"])
        template_path = os.path.normpath(TEMPLATE_PATH)
        wb = openpyxl.load_workbook(template_path, keep_vba=False)
        ws = wb.active

        def safe_write(ws, cell_ref, value):
            try:
                cell = ws[cell_ref]
                if not (isinstance(cell.value, str) and cell.value.startswith("=")):
                    cell.value = value
            except: pass

        # Header consolidado - REGLAS INGE DANIEL
        # Ajuste Zona Horaria Perú (UTC-5)
        import datetime as dt_mod
        ahora_utc = datetime.now(dt_mod.timezone.utc)
        peru_tz = dt_mod.timezone(dt_mod.timedelta(hours=-5))
        ahora = ahora_utc.astimezone(peru_tz)
        
        # Lógica C4: WK + SEMANA ETA + CANTIDAD DE ÓRDENES OGL EN ESTA NAVE
        pl_id = f"WK{ahora.isocalendar()[1]}1" # Fallback
        if primer_pos and primer_pos.ETA:
            semana_eta = primer_pos.ETA.isocalendar()[1]
            # Solo contamos bookings que realmente traen datos (agrupado_por_booking)
            # Esto evita que bookings registrados en el reporte pero sin confirmación inflen el número
            ordenes_reales = [b for b in bookings_set if b in agrupado_por_booking]
            cantidad_ordenes = len(ordenes_reales) if ordenes_reales else 1
            pl_id = f"WK{semana_eta}{cantidad_ordenes}"

        safe_write(ws, "C3", "COMPLEJO AGROINDUSTRIAL BETA S.A.")
        safe_write(ws, "C4", pl_id)
        safe_write(ws, "C5", ahora.strftime("%d/%m/%Y"))
        safe_write(ws, "C6", "CIF")
        safe_write(ws, "C7", "VESSEL")
        
        # C8: Nave Arribo (Reporte > Posicionamiento)
        nave_final = primer_pos.NAVE if primer_pos else nave_clean
        reporte_n = db.query(ReporteEmbarques).filter(ReporteEmbarques.booking == next(iter(bookings_set))).first()
        if reporte_n and reporte_n.nave_arribo:
            nave_final = reporte_n.nave_arribo
        safe_write(ws, "C8", nave_final)

        if primer_pedido:
            safe_write(ws, "C11", primer_pedido.recibidor or "")
            safe_write(ws, "C12", primer_pedido.port_id_orig or "")
            safe_write(ws, "C14", primer_pedido.port_id_dest or "")
            safe_write(ws, "C15", primer_pedido.pod or "")
        
        if primer_pos:
            safe_write(ws, "C13", primer_pos.POL or "")
            safe_write(ws, "C16", primer_pos.ETD.strftime("%d/%m/%Y") if primer_pos.ETD else "")
            safe_write(ws, "C17", primer_pos.ETA.strftime("%d/%m/%Y") if primer_pos.ETA else "")

        def safe_float(val):
            try: return float(val) if pd.notna(val) else 0.0
            except: return 0.0

        GRID_START_ROW = 21  # Empezamos en la 21 para no pisar cabecera en la 20
        fila_secuencial = 1
        
        # Primero los bookings conocidos y ordenados
        for bk_id, _ in lista_ordenada:
            pedido = booking_data_map[bk_id]["pedido"]
            fecha_prog = booking_data_map[bk_id]["fecha_prog"]
            
            # Necesitamos la planta de este booking específico
            pos_bk = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == bk_id).first()
            planta_llenado_raw = pos_bk.PLANTA_LLENADO.strip() if pos_bk and pos_bk.PLANTA_LLENADO else ""
            planta_llenado_up = planta_llenado_raw.upper()

            for item in agrupado_por_booking.get(bk_id, []):
                fila_e = GRID_START_ROW + (fila_secuencial - 1)
                # Columnas iniciales
                ws.cell(row=fila_e, column=3).value = item["pallet"]  # C: Pallet
                ws.cell(row=fila_e, column=4).value = booking_data_map[bk_id]["contenedor"] # D: Contenedor
                
                # F-H: Producto, Variedad, Calibre
                ws.cell(row=fila_e, column=6).value = pedido.product.strip() if pedido and pedido.product else ""
                ws.cell(row=fila_e, column=7).value = pedido.variedad.strip() if pedido and pedido.variedad else ""
                ws.cell(row=fila_e, column=8).value = item["calibre"]
                
                # I: Peso por caja
                if pedido and pedido.peso_por_caja:
                    ws.cell(row=fila_e, column=9).value = f"{pedido.peso_por_caja} KG"
                
                # N: Gross Weight (Cajas * 4.2)
                cajas_num = safe_float(item["cajas"])
                ws.cell(row=fila_e, column=14).value = round(cajas_num * 4.2, 2)
                
                # O: Net Weight (TOTAL KILOS)
                ws.cell(row=fila_e, column=15).value = item["total_kilos"]

                # P-Q: Fechas
                ws.cell(row=fila_e, column=16).value = item["cosecha"]
                ws.cell(row=fila_e, column=17).value = item["proceso"]

                # R-T: Lote OGL, Merchants, Planta Code
                ws.cell(row=fila_e, column=18).value = item["lote_ogl"]
                ws.cell(row=fila_e, column=19).value = "Complejo Agroindustrial"
                if "ICA" in planta_llenado_up:
                    ws.cell(row=fila_e, column=20).value = "7751043044355"

                # U-Z: Cajas/Pallet, Total cajas, Beta S.A., Code 405, Planta Name, Trazabilidad
                ws.cell(row=fila_e, column=21).value = pedido.caja_por_pallet if pedido else "" # U
                ws.cell(row=fila_e, column=22).value = item["cajas"] # V
                ws.cell(row=fila_e, column=23).value = "COMPLEJO AGROINDUSTRIAL BETA S.A." # W
                ws.cell(row=fila_e, column=24).value = "4050373153151" # X
                ws.cell(row=fila_e, column=25).value = planta_llenado_raw # Y
                ws.cell(row=fila_e, column=26).value = item["trazabilidad"] # Z

                fila_secuencial += 1

        # Luego los "DESCONOCIDOS" o huérfanos (si los hay)
        if agrupado_por_booking.get("DESCONOCIDO"):
            for item in agrupado_por_booking["DESCONOCIDO"]:
                fila_e = GRID_START_ROW + (fila_secuencial - 1)
                ws.cell(row=fila_e, column=3).value = item["pallet"]
                ws.cell(row=fila_e, column=4).value = contenedor_default
                ws.cell(row=fila_e, column=6).value = primer_pedido.product if primer_pedido else ""
                ws.cell(row=fila_e, column=7).value = primer_pedido.variedad if primer_pedido else ""
                ws.cell(row=fila_e, column=8).value = item["calibre"]
                ws.cell(row=fila_e, column=14).value = round(safe_float(item["cajas"]) * 4.2, 2)
                ws.cell(row=fila_e, column=16).value = item["cosecha"]
                ws.cell(row=fila_e, column=17).value = item["proceso"]
                fila_secuencial += 1

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        # Formato: Packing List_OGL_MAESTRO_Nombre de nave_WK161.xlsx
        filename = f"Packing List_OGL_MAESTRO_{nave_clean.replace(' ','_')}_{pl_id}.xlsx"
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


