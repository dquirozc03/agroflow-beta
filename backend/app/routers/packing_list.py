"""
Router: Packing List OGL
Módulo de generación automática del Packing List para el cliente OGL.
Autor: AgroFlow Dev Team
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.utils.logging import logger
from app.models.pedido import PedidoComercial
from app.models.posicionamiento import Posicionamiento
from app.models.embarque import ControlEmbarque, ReporteEmbarques
from app.models.packing_list import EmisionPackingList, DetalleEmisionPackingList
from app.utils.formatters import get_peru_time
from app.dependencies.auth import OptionalUser
from pydantic import BaseModel
import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment
from copy import copy
import io
import os
import re
import difflib
from datetime import datetime

# Directorio donde se guardan los Excel generados para re-descarga
PL_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage", "packing_lists")
os.makedirs(PL_STORAGE_DIR, exist_ok=True)

router = APIRouter(
    prefix="/api/v1/packing-list",
    tags=["Packing List OGL"]
)

# ---------------------------------------------------------------------------
# Mapeo de Recibidores Oficiales (Inge Daniel Rule 💎)
# ---------------------------------------------------------------------------
RECIPIENTS_DATA = {
    "ISS": {
        "full_name": "ISS (INTEGRATED SERVICE SOLUTIONS LTD)",
        "notify_id": "1038367"
    },
    "VDH": {
        "full_name": "VDH FRUITS BV",
        "notify_id": "1041374"
    },
    "VDH FRUITS BV": {
        "full_name": "VDH FRUITS BV",
        "notify_id": "1041374"
    }
}

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
    """Extrae la orden numérica pero evadiendo cruces con clientes que usan otros prefijos (ej. PE004)."""
    if not orden_beta:
        return None
    
    val_upper = orden_beta.strip().upper()
    
    # Si tiene letras, nos aseguramos de que sea solo BG, CO, BP, BAM, BU o BAA (prefijos de Beta)
    has_letters = any(c.isalpha() for c in val_upper)
    if has_letters:
        allowed_prefixes = ["BG", "CO", "BP", "BAM", "BU", "BAA"]
        if not any(prefix in val_upper for prefix in allowed_prefixes):
            # Si tiene letras y no es de Beta, devolvemos el valor original crudo.
            return val_upper
            
    # Si es puramente numérico o tiene prefijos autorizados, le quitamos las letras
    numeric = re.sub(r'[^0-9]', '', val_upper)
    return numeric if numeric else None

TEMPLATE_PATH = os.path.join(
    os.path.dirname(__file__),  # app/routers/
    "..", "..",                  # backend/
    "assets", "templates",
    "FORMATO PL - OGL.xlsx"
)

# ---------------------------------------------------------------------------
# Helper: Detectar si dos nombres de nave son la misma (Smart Match)
# ---------------------------------------------------------------------------
def is_same_ship(name1: str, name2: str, threshold: float = 0.75) -> bool:
    if not name1 or not name2: return False
    if name1 == "SIN NAVE" or name2 == "SIN NAVE": return False
    
    n1 = re.sub(r'[^A-Z0-9]', '', name1.upper())
    n2 = re.sub(r'[^A-Z0-9]', '', name2.upper())
    
    # 1. Identidad exacta normalizada
    if n1 == n2: return True
    
    # 2. Match por prefijo (Nombre del Barco)
    # Si comparten los primeros 10 caracteres, es el mismo barco
    min_len = min(len(n1), len(n2))
    if min_len >= 10 and n1[:10] == n2[:10]:
        return True

    # 3. Similitud difusa
    return difflib.SequenceMatcher(None, n1, n2).ratio() >= threshold

# ---------------------------------------------------------------------------
# Schemas de respuesta
# ---------------------------------------------------------------------------
class NaveInfo(BaseModel):
    nave: str
    fuente: str      # "reporte_embarques" | "posicionamiento" | "consolidada"
    bookings: List[str]
    cultivos: List[str]

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
    Retorna naves únicas basándose en la unión de ReporteEmbarques y Posicionamiento.
    """
    # 1. Obtener todos los bookings de ambas fuentes para no dejar a nadie fuera
    shipments = db.query(ReporteEmbarques).all()
    posicionamientos = db.query(Posicionamiento).all()
    
    # Mapa de booking -> nave (Prioridad Reporte)
    reporte_naves = {s.booking: s.nave_arribo for s in shipments if s.booking}
    
    # Conjunto total de bookings a evaluar
    all_bookings = set(reporte_naves.keys()) | {p.booking for p in posicionamientos if p.booking}
    
    nave_stats = {}
    
    for b in all_bookings:
        # Verificar si es un booking OGL (Jerarquía de info)
        pos = db.query(Posicionamiento).filter(Posicionamiento.booking == b).first()
        if not pos or not pos.orden_beta: continue
        
        orden_num = strip_orden_beta(pos.orden_beta)
        if not orden_num: continue
        
        pedido_ogl = db.query(PedidoComercial).filter(
            PedidoComercial.orden_beta == orden_num,
            PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
        ).first()
        
        if not pedido_ogl: continue
        
        # SI ES OGL -> Determinar su nave final
        nave_final = reporte_naves.get(b).strip().upper() if reporte_naves.get(b) else None
        
        if not nave_final and pos.nave:
            nave_final = pos.nave.strip().upper()
            
        nave_final = nave_final if nave_final else "SIN NAVE"
        
        # --- SMART MATCH: Buscar si ya existe una nave parecida en las estadísticas ---
        target_nave = nave_final
        if nave_final != "SIN NAVE":
            for existing_nave in nave_stats.keys():
                if existing_nave != "SIN NAVE" and is_same_ship(nave_final, existing_nave):
                    target_nave = existing_nave
                    break
        
        # Agrupar bajo el nombre encontrado (o el original)
        if target_nave not in nave_stats:
            nave_stats[target_nave] = {"bookings": [], "cultivos": set()}
        
        if b not in nave_stats[target_nave]["bookings"]:
            # VERIFICAR SI ESTÁ BLOQUEADO POR PL ACTIVO
            is_locked = db.query(DetalleEmisionPackingList).join(EmisionPackingList).filter(
                DetalleEmisionPackingList.booking == b,
                EmisionPackingList.estado == "ACTIVO"
            ).first()
            
            if not is_locked:
                nave_stats[target_nave]["bookings"].append(b)
                
                # Determinar Cultivo (Posicionamiento > PedidoComercial)
                c_final = pos.cultivo.strip().upper() if pos.cultivo else None
                if not c_final and pedido_ogl.cultivo:
                    c_final = pedido_ogl.cultivo.strip().upper()
                
                if c_final:
                    nave_stats[target_nave]["cultivos"].add(c_final)

    # Construir respuesta
    result = []
    for nave_name, stats in sorted(nave_stats.items()):
        if stats["bookings"]:
            result.append(NaveInfo(
                nave=nave_name,
                fuente="consolidada",
                bookings=stats["bookings"],
                cultivos=sorted(list(stats["cultivos"]))
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
    bk_pos = {p.booking for p in db.query(Posicionamiento.booking).filter(
        func.upper(func.trim(Posicionamiento.nave)) == nave_upper
    ).all() if p.booking}

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
        pos = db.query(Posicionamiento).filter(Posicionamiento.booking == booking).first()
        if not pos or not pos.orden_beta: continue

        orden_num = strip_orden_beta(pos.orden_beta)
        pedido = db.query(PedidoComercial).filter(
            PedidoComercial.orden_beta == orden_num,
            PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
        ).first()

        if not pedido: continue

        # VERIFICAR BLOQUEO
        is_locked = db.query(DetalleEmisionPackingList).join(EmisionPackingList).filter(
            DetalleEmisionPackingList.booking == booking,
            EmisionPackingList.estado == "ACTIVO"
        ).first()

        if is_locked: 
            # Excluir de la lista si está bloqueado por otro PL
            continue

        emb = db.query(ControlEmbarque).filter(ControlEmbarque.booking == booking).first()

        resultado.append({
            "booking":       booking,
            "orden_beta":    pos.orden_beta,
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
    recibidor: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: OptionalUser = None
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
        bookings_pos = db.query(Posicionamiento.booking).filter(
            func.upper(func.trim(Posicionamiento.nave)) == nave_clean
        ).all()
        bookings_pos_set = {r.booking for r in bookings_pos if r.booking}

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

        booking_data_map: Dict[str, Dict] = {}
        primer_pedido = None
        primer_pos = None

        for booking in sorted(bookings_set):
            pos = db.query(Posicionamiento).filter(Posicionamiento.booking == booking).first()
            if not pos: continue

            pedido = None
            if pos.orden_beta:
                orden_numeric = strip_orden_beta(pos.orden_beta)
                if orden_numeric:
                    pedido = db.query(PedidoComercial).filter(
                        PedidoComercial.orden_beta == orden_numeric,
                        PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
                    ).first()
            
            if not pedido: continue

            # --- FILTRO POR RECIBIDOR (Inge Daniel Rule) 🕵️‍♂️ ---
            if recibidor and recibidor.strip():
                ped_recibidor = str(getattr(pedido, "recibidor", "") or "").strip().upper()
                if ped_recibidor != recibidor.strip().upper():
                    continue

            emb = db.query(ControlEmbarque).filter(ControlEmbarque.booking == booking).first()
            contenedor_fmt = format_container_ogl(emb.contenedor if emb else "")

            # Prioridad de fecha: FECHA_PROGRAMADA -> ETD -> Hoy
            prog_date = getattr(pos, "fecha_programada", None) or getattr(pos, "etd", None) or datetime.now().date()

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

        # 1.5 Procesar Termógrafos si se adjuntó el archivo 🌡️
        termografos_map = {}
        if termografos:
            try:
                t_content = await termografos.read()
                # Leemos el archivo completo sin asunciones de cabecera fija
                t_df = pd.read_excel(io.BytesIO(t_content), engine="openpyxl", header=None)
                
                for _, t_row in t_df.iterrows():
                    # Según Ticket: Col N (13) es Pallet ID, Col M (12) es Código Termógrafo
                    if len(t_row) >= 14:
                        p_id_raw = str(t_row.iloc[13]).strip().upper() if pd.notna(t_row.iloc[13]) else ""
                        t_code_raw = str(t_row.iloc[12]).strip() if pd.notna(t_row.iloc[12]) else ""
                        
                        if p_id_raw and t_code_raw and p_id_raw != "ID PALLET":
                            termografos_map[p_id_raw] = t_code_raw
                logger.info(f"Se cargaron {len(termografos_map)} códigos de termógrafos para el cruce.")
            except Exception as e:
                logger.error(f"Error procesando archivo de termógrafos: {e}")
                # Fallback: continuamos sin termógrafos si el archivo está corrupto

        # 2. Cargar todos los pallets
        agrupado_por_booking: Dict[str, List] = {b: [] for b in booking_data_map.keys()}
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
                logger.error(f"Error al procesar archivo {conf_file.filename}: {e}")
                continue

            def find_col(df, kws):
                for c in [str(col) for col in df.columns]:
                    for kw in kws:
                        if kw.upper() in c.upper(): return c
                return None

            col_pallet  = find_col(df, ["PALLET", "HU", "ID PALLET"])
            col_booking = find_col(df, ["BOOKING", "DESPACHO"])
            col_orden_beta = find_col(df, ["ORDEN BETA", "ORDEN"])
            
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

            # Mapa inverso: número de orden limpio ("4") -> ID del Booking ("EBKG...")
            orden_to_bk = {}
            for bk, data in booking_data_map.items():
                num_obj = strip_orden_beta(data["pos"].orden_beta)
                if num_obj:
                    try:
                        n_str = str(int(num_obj))
                        orden_to_bk[n_str] = bk
                    except: pass

            last_valid_bk = None
            for _, row in df.iterrows():
                current_bk = ""
                
                # 1. Intentar por Booking Directo (EBKG...)
                if col_booking and pd.notna(row.get(col_booking)):
                    c_val = str(row.get(col_booking)).strip().upper()
                    if c_val in booking_data_map:
                        current_bk = c_val
                
                # 2. Intentar por el número de ORDEN BETA (BG-004 -> 4)
                if not current_bk and col_orden_beta and pd.notna(row.get(col_orden_beta)):
                    o_val = strip_orden_beta(str(row.get(col_orden_beta)))
                    if o_val:
                        try:
                            n_val = str(int(o_val))
                            if n_val in orden_to_bk:
                                current_bk = orden_to_bk[n_val]
                        except: pass

                # 3. Lógica de Memoria (Heredar hacia abajo)
                if current_bk:
                    last_valid_bk = current_bk
                elif not current_bk and last_valid_bk:
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
                        # Convert to string first to handle raw excel objects, then parse
                        dt = pd.to_datetime(str(val).strip())
                        return dt.strftime("%d/%m/%Y")
                    except Exception as e:
                        # Fallback simple para quitar " 00:00:00" si to_datetime falla raramente
                        raw_str = str(val).strip()
                        if " " in raw_str:
                            raw_str = raw_str.split(" ")[0]
                        # Si era YYYY-MM-DD
                        if "-" in raw_str and len(raw_str.split("-")[0]) == 4:
                            parts = raw_str.split("-")
                            if len(parts) == 3: return f"{parts[2]}/{parts[1]}/{parts[0]}"
                        return raw_str

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

        # Ajuste Zona Horaria Perú (UTC-5)
        ahora = get_peru_time()
        
        # Lógica C4: WK + SEMANA ETA + CORRELATIVO NAVES OGL DE LA SEMANA
        pl_id = f"WK{ahora.isocalendar()[1]}1" # Fallback
        if primer_pos and primer_pos.eta:
            semana_eta = primer_pos.eta.isocalendar()[1]
            anio_eta = primer_pos.eta.year
            
            # Buscar todos los posicionamientos de esa misma semana
            pos_semana = db.query(Posicionamiento).filter(
                func.extract('week', Posicionamiento.eta) == semana_eta,
                func.extract('year', Posicionamiento.eta) == anio_eta
            ).all()

            # Mapear naves con carga OGL a su fecha mínima de ETA cronológica
            nave_etas = {}
            for p in pos_semana:
                if not p.nave or not p.eta or not p.orden_beta: continue
                
                num_ord = strip_orden_beta(p.orden_beta)
                if not num_ord: continue
                
                # Validar si este posicionamiento es para OGL
                pedido_ogl = db.query(PedidoComercial).filter(
                    PedidoComercial.orden_beta == num_ord,
                    PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
                ).first()
                
                if pedido_ogl:
                    # 5. Intentamos sacar la nave oficial del Reporte de Embarques para este posicionamiento (Inge Daniel Rule)
                    rep = db.query(ReporteEmbarques).filter(ReporteEmbarques.booking == p.booking).first()
                    
                    n_name = p.nave.strip().upper() if p.nave else "SIN NAVE"
                    if rep and rep.nave_arribo:
                        n_name = rep.nave_arribo.strip().upper()

                    # Guardamos la fecha de salida (ETD) para el ranking de correlativo
                    # La semana se define por ETA, pero el ranking 1,2,3 por ETD (Inge Daniel Rule 💎)
                    etd_val = p.etd if p.etd else p.eta
                    
                    if n_name not in nave_etas or etd_val < nave_etas[n_name]:
                        nave_etas[n_name] = etd_val

            # 3. Asegurar que la nave actual está en el mapa (Verdad Absoluta Activa)
            if nave_clean not in nave_etas:
                # Usamos el ETD de la nave actual para su posición en el ranking
                etd_actual = primer_pos.etd if primer_pos.etd else primer_pos.eta
                nave_etas[nave_clean] = etd_actual

            # 4. Ordenar naves por su ETD (Fecha de Salida) - Inge Daniel Rule 💎
            # En caso de empate en ETD, usamos orden alfabético para permanencia (A < M < Y)
            naves_ordenadas = sorted(nave_etas.items(), key=lambda x: (x[1], x[0]))
            
            # 5. El correlativo es el índice (1-based) de la nave actual en la lista ordenada de la semana
            correlativo = 1
            for i, (n_name, _) in enumerate(naves_ordenadas):
                if n_name == nave_clean:
                    correlativo = i + 1
                    break
            
            pl_id = f"WK{str(semana_eta).zfill(2)}{correlativo}"
            logger.info(f"Fórmula WK: Nave {nave_clean} | Semana {semana_eta} | Ranking ETD {correlativo} | ID: {pl_id}")

        # --- CABECERA ESTÁTICA (Inge Daniel Rule) ---
        ws['C2'].value = "1101613"
        ws['C2'].alignment = Alignment(horizontal='center', vertical='center')

        safe_write(ws, "C3", "COMPLEJO AGROINDUSTRIAL BETA S.A.")
        safe_write(ws, "C4", pl_id)
        safe_write(ws, "C5", ahora.strftime("%d/%m/%Y"))
        safe_write(ws, "C6", "CIF")
        safe_write(ws, "C7", "VESSEL")
        
        # C8: Nave Arribo (Reporte > Posicionamiento)
        nave_final = primer_pos.nave if primer_pos else nave_clean
        reporte_n = db.query(ReporteEmbarques).filter(ReporteEmbarques.booking == next(iter(bookings_set))).first()
        if reporte_n and reporte_n.nave_arribo:
            nave_final = reporte_n.nave_arribo
        safe_write(ws, "C8", nave_final)

        if primer_pedido:
            # C10 y C11: Recibidor y Notify ID (Lógica de Mapeo 💎)
            recibidor_raw = (primer_pedido.recibidor or "").strip().upper()
            recipient_info = RECIPIENTS_DATA.get(recibidor_raw)
            
            # Fallback por coincidencia parcial si es necesario
            if not recipient_info:
                if "VDH" in recibidor_raw: recipient_info = RECIPIENTS_DATA.get("VDH")
                elif "ISS" in recibidor_raw: recipient_info = RECIPIENTS_DATA.get("ISS")

            if recipient_info:
                safe_write(ws, "C10", recipient_info["notify_id"])
                safe_write(ws, "C11", recipient_info["full_name"])
            else:
                safe_write(ws, "C11", primer_pedido.recibidor or "")

            safe_write(ws, "C12", primer_pedido.port_id_orig or "")
            safe_write(ws, "C14", primer_pedido.port_id_dest or "")
            safe_write(ws, "C15", primer_pedido.pod or "")
        
        if primer_pos:
            safe_write(ws, "C13", primer_pos.pol or "")
            safe_write(ws, "C16", primer_pos.etd.strftime("%d/%m/%Y") if primer_pos.etd else "")
            safe_write(ws, "C17", primer_pos.eta.strftime("%d/%m/%Y") if primer_pos.eta else "")

        def safe_float(val):
            try: return float(val) if pd.notna(val) else 0.0
            except: return 0.0

        GRID_START_ROW = 21  # Empezamos en la 21 para no pisar cabecera en la 20
        # --- LLENADO DE DATOS (Malla OGL) ---
        fila_secuencial = 1
        therms_written = set() # Track termógrafos para no repetirlos
        
        # Primero los bookings conocidos y ordenados
        for bk_id, _ in lista_ordenada:
            pedido = booking_data_map[bk_id]["pedido"]
            fecha_prog = booking_data_map[bk_id]["fecha_prog"]
            
            # 4. Inyectar Pedido Dinámico (Solo del primer booking del set filtrado)
            pos_bk = db.query(Posicionamiento).filter(Posicionamiento.booking == bk_id).first()
            planta_llenado_raw = pos_bk.planta_llenado.strip() if pos_bk and pos_bk.planta_llenado else ""
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
                
                # I: Peso por caja (Corregido para que no se salte valores)
                peso_val = pedido.peso_por_caja if pedido else ""
                if peso_val is not None and str(peso_val).strip() != "":
                    ws.cell(row=fila_e, column=9).value = f"{str(peso_val).strip()} KG"
                
                # M: Additional info / Notes (Inyectamos Termógrafo si existe) 🌡️
                # REGLA: Solo una vez por pallet para evitar repeticiones visuales
                p_id_match = str(item["pallet"]).strip().upper()
                if p_id_match in termografos_map and p_id_match not in therms_written:
                    ws.cell(row=fila_e, column=13).value = termografos_map[p_id_match]
                    therms_written.add(p_id_match)

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
            planta_llenado_raw = primer_pos.planta_llenado.strip() if primer_pos and primer_pos.planta_llenado else ""
            planta_llenado_up = planta_llenado_raw.upper()
            
            for item in agrupado_por_booking["DESCONOCIDO"]:
                fila_e = GRID_START_ROW + (fila_secuencial - 1)
                ws.cell(row=fila_e, column=3).value = item["pallet"]
                ws.cell(row=fila_e, column=4).value = contenedor_default
                ws.cell(row=fila_e, column=6).value = primer_pedido.product if primer_pedido else ""
                ws.cell(row=fila_e, column=7).value = primer_pedido.variedad if primer_pedido else ""
                ws.cell(row=fila_e, column=8).value = item["calibre"]
                
                # I: Peso por caja
                peso_val = primer_pedido.peso_por_caja if primer_pedido else ""
                if peso_val is not None and str(peso_val).strip() != "":
                    ws.cell(row=fila_e, column=9).value = f"{str(peso_val).strip()} KG"
                    
                # M: Additional info / Notes (Fallback para huérfanos) 🌡️
                p_id_match = str(item["pallet"]).strip().upper()
                if p_id_match in termografos_map and p_id_match not in therms_written:
                    ws.cell(row=fila_e, column=13).value = termografos_map[p_id_match]
                    therms_written.add(p_id_match)

                ws.cell(row=fila_e, column=14).value = round(safe_float(item["cajas"]) * 4.2, 2)
                ws.cell(row=fila_e, column=15).value = item["total_kilos"] # O
                ws.cell(row=fila_e, column=16).value = item["cosecha"]
                ws.cell(row=fila_e, column=17).value = item["proceso"]
                
                # R-T: Lote OGL, Merchants, Planta Code
                ws.cell(row=fila_e, column=18).value = item["lote_ogl"]
                ws.cell(row=fila_e, column=19).value = "Complejo Agroindustrial"
                if "ICA" in planta_llenado_up:
                    ws.cell(row=fila_e, column=20).value = "7751043044355"

                # U-Z
                ws.cell(row=fila_e, column=21).value = primer_pedido.caja_por_pallet if primer_pedido else ""
                ws.cell(row=fila_e, column=22).value = item["cajas"]
                ws.cell(row=fila_e, column=23).value = "COMPLEJO AGROINDUSTRIAL BETA S.A."
                ws.cell(row=fila_e, column=24).value = "4050373153151"
                ws.cell(row=fila_e, column=25).value = planta_llenado_raw
                ws.cell(row=fila_e, column=26).value = item["trazabilidad"]
                
                fila_secuencial += 1

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        # Sanitizar el nombre de la nave para evitar errores de archivo (especialmente si contiene '/')
        safe_nave = re.sub(r'[\\/*?:"<>|]', "_", nave_clean).replace(' ', '_')
        filename = f"Packing List_OGL_MAESTRO_{safe_nave}_{pl_id}.xlsx"

        # --- GUARDAR COPIA EN DISCO PARA RE-DESCARGA ---
        file_bytes = output.getvalue()
        storage_path = os.path.join(PL_STORAGE_DIR, filename)
        with open(storage_path, "wb") as f_disk:
            f_disk.write(file_bytes)

        # --- REGISTRAR EN EL HISTORIAL Y BLOQUEAR ---
        try:
            # Capturar usuario del JWT si existe
            nombre_usuario = current_user.usuario if current_user else "Sistema"

            nueva_emision = EmisionPackingList(
                usuario=nombre_usuario,
                nave=nave_clean,
                estado="ACTIVO",
                archivo_nombre=filename
            )
            db.add(nueva_emision)
            db.flush() # Para obtener el ID

            for bk_id in bookings_set:
                # Obtener la orden_beta para este booking desde el mapa o DB
                b_info = booking_data_map.get(bk_id)
                ord_val = b_info["pos"].orden_beta if b_info else None
                
                det = DetalleEmisionPackingList(
                    emision_id=nueva_emision.id,
                    booking=bk_id
                )
                db.add(det)
                
            db.commit()
        except Exception as inner_e:
            db.rollback()
            logger.error(f"Error guardando auditoría de PL: {inner_e}")
            raise HTTPException(status_code=500, detail="Error interno al guardar historial")

        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except HTTPException:
        raise
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

# ---------------------------------------------------------------------------
# GET /historial ─ Historial de Packing Lists OGL
# ---------------------------------------------------------------------------
@router.get("/historial")
def obtener_historial_pl(db: Session = Depends(get_db)):
    emisiones = db.query(EmisionPackingList).order_by(EmisionPackingList.fecha_generacion.desc()).limit(100).all()
    resultado = []
    for em in emisiones:
        detalles = [d.booking for d in em.detalles]
        # Verificar si el archivo existe en disco para indicar si es descargable
        archivo_disponible = False
        if em.archivo_nombre:
            path_disco = os.path.join(PL_STORAGE_DIR, em.archivo_nombre)
            archivo_disponible = os.path.exists(path_disco)
        # Obtener las órdenes reales para este historial
        bk_list = [d.booking for d in em.detalles]
        ord_list = []
        if bk_list:
            pos_data = db.query(Posicionamiento.orden_beta).filter(Posicionamiento.booking.in_(bk_list)).all()
            ord_list = sorted(list(set([p[0] for p in pos_data if p[0]])))

        resultado.append({
            "id": em.id,
            "fecha": em.fecha_generacion,
            "usuario": em.usuario or "Sistema",
            "nave": em.nave,
            "estado": em.estado,
            "archivo": em.archivo_nombre,
            "archivo_disponible": archivo_disponible,
            "motivo_anulacion": em.motivo_anulacion,
            "bookings": bk_list,
            "ordenes": ord_list
        })
    return {"items": resultado}

# ---------------------------------------------------------------------------
# PATCH /{id}/anular ─ Anular y liberar bookings
# ---------------------------------------------------------------------------
class AnularPLRequest(BaseModel):
    motivo: str

@router.patch("/{id}/anular")
def anular_pl(id: int, req: AnularPLRequest, db: Session = Depends(get_db)):
    emision = db.query(EmisionPackingList).filter(EmisionPackingList.id == id).first()
    if not emision:
        raise HTTPException(status_code=404, detail="Packing List no encontrado")
    
    if emision.estado == "ANULADO":
        raise HTTPException(status_code=400, detail="El Packing List ya se encuentra anulado")
        
    emision.estado = "ANULADO"
    emision.motivo_anulacion = req.motivo
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo anular el registro de PL")
        
    return {"message": "Packing List anulado, las órdenes han sido liberadas", "id": id}


# ---------------------------------------------------------------------------
# GET /{id}/descargar ─ Re-descarga de archivo guardado en disco
# ---------------------------------------------------------------------------
@router.get("/{id}/descargar")
def descargar_pl(id: int, db: Session = Depends(get_db)):
    emision = db.query(EmisionPackingList).filter(EmisionPackingList.id == id).first()
    if not emision:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    if not emision.archivo_nombre:
        raise HTTPException(status_code=404, detail="Este registro no tiene archivo asociado")
    
    path_disco = os.path.join(PL_STORAGE_DIR, emision.archivo_nombre)
    if not os.path.exists(path_disco):
        raise HTTPException(status_code=404, detail="El archivo no está disponible. Solo se pueden descargar PLs generados a partir de esta versión.")
    
    return FileResponse(
        path=path_disco,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=emision.archivo_nombre,
        headers={"Access-Control-Expose-Headers": "Content-Disposition"}
    )
