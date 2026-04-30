from fastapi import APIRouter, Header, Depends, HTTPException, status, Body, Request
from typing import List, Any
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.database import get_db
from app.configuracion import settings
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.embarque import ReporteEmbarques
import logging
import json
from dateutil.parser import parse as parse_date
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/sync", tags=["sincronizacion"])

# Mapeo de columnas para el Plan Maestro (Instrucciones)
COLUMN_MAPPING = {
    "PLT. EMPACADORA": "planta_llenado",
    "PLANTA": "planta_llenado",
    "CULTIVO": "cultivo",
    "BOOKING LIMPIO": "booking",
    "BOOKING": "booking",
    "RESERVA": "booking",
    "NRO BOOKING": "booking",
    "NRO. BOOKING": "booking",
    "NRO RESERVA": "booking",
    "NRO. RESERVA": "booking",
    "BOOKING ": "booking",
    "RESERVA ": "booking",
    "NAVE": "nave",
    "ETD BOOKING": "etd",
    "ETD": "etd",
    "ETA BOOKING": "eta",
    "ETA": "eta",
    "POL": "pol",
    "O/BETA FINAL": "orden_beta",
    "ORDEN BETA": "orden_beta",
    "PRECINTO SENASA (SI/NO)": "precinto_senasa",
    "PRECINTO SENASA": "precinto_senasa",
    "OPERADOR": "operador_logistico",
    "NAVIERA": "naviera",
    "TERMOREGISTROS": "termoregistros",
    "AC": "ac",
    "C/T": "ct",
    "VENT": "ventilacion",
    "T°": "temperatura",
    "HUMEDAD": "humedad",
    "FILTROS": "filtros",
    "FECHA SOLICITADA (OPERADOR)": "fecha_programada",
    "HORA SOLICITADA (OPERADOR)": "hora_programada",
    "CAJAS VACIAS (SI/NO)": "cajas_vacias"
}

# Mapeo de columnas para Pedidos Comerciales
PEDIDOS_MAPPING = {
    "ZONA": "planta",
    "PLANTA": "planta",
    "PLTA": "planta",
    "ORDEN": "orden_beta",
    "ORDEN BETA": "orden_beta",
    "O/BETA": "orden_beta",
    "O/BETA FINAL": "orden_beta",
    "PO": "po",
    "CULTIVO": "cultivo",
    "CLIENTE GENERAL": "cliente",
    "CLIENTE": "cliente",
    "CONSIGNATARIO": "consignatario",
    "RECIBIDOR": "recibidor",
    "POR ID ORIGEN": "port_id_orig",
    "PORT ID ORIG": "port_id_orig",
    "PAIS ": "pais",
    "PAIS": "pais",
    "POD": "pod",
    "POD ID DESTINO": "port_id_dest",
    "PORT ID DEST": "port_id_dest",
    "POD DESTINO": "port_id_dest",
    "PRESENTACION ": "presentacion",
    "PRESENTACION": "presentacion",
    "VARIEDAD": "variedad",
    "PRODUCT": "product",
    "PESO POR CAJA ": "peso_por_caja",
    "PESO POR CAJA": "peso_por_caja",
    "PESO": "peso_por_caja",
    "ADDITIONAL INFORMATION": "additional_info",
    "INFO": "additional_info",
    "CAJA POR PALLET": "caja_por_pallet",
    "CAJA/PLT": "caja_por_pallet",
    "TOTAL PALLETS": "total_pallets",
    "TOTAL PALLETS FCL": "total_pallets",
    "PALLETS": "total_pallets",
    "PLTS": "total_pallets",
    "TOTAL PLTS": "total_pallets",
    "TOTAL CAJAS": "total_cajas",
    "CAJAS": "total_cajas",
    "INCOTERM": "incoterm",
    "TIPO PRECIO": "tipo_precio",
    "SEMANA ETA": "semana_eta"
}

def clean_data_value(val: Any, db_column: str):
    null_and_errors = {"", "-", "N/A", "NONE", "NULL", "NAN", "#¡VALOR!", "#VALUE!", "#REF!", "#DIV/0!", "#N/A", "#NAME?", "#¿NOMBRE?"}
    if val is None: return None
    val_str = str(val).strip()
    if not val_str or val_str.upper() in null_and_errors: return None
    
    col_upper = db_column.upper()
    
    # Manejo de números
    numeric_cols = ["PESO_POR_CAJA", "CAJA_POR_PALLET", "TOTAL_PALLETS", "TOTAL_CAJAS", "SEMANA_ETA", "CAJAS_VACIAS"]
    if col_upper in numeric_cols:
        if col_upper == "CAJAS_VACIAS":
            if val_str.upper() == "SI": return 1
            if val_str.upper() == "NO": return 0
        try:
            match = re.search(r'(\d+(\.\d+)?)', val_str.replace(',', ''))
            if match:
                num = float(match.group(1))
                return int(num) if col_upper != "PESO_POR_CAJA" else num
        except:
            return 0

    # Manejo de fechas
    if col_upper in ["ETD", "ETA", "FECHA_PROGRAMADA", "FECHA_LLENADO_REPORTE"]:
        try:
            # Traducción básica de meses en español a inglés para el parser
            meses_es_en = {
                "ENE": "JAN", "FEB": "FEB", "MAR": "MAR", "ABR": "APR", "MAY": "MAY", "JUN": "JUN",
                "JUL": "JUL", "AGO": "AUG", "SEP": "SEP", "OCT": "OCT", "NOV": "NOV", "DIC": "DEC"
            }
            temp_val = val_str.upper()
            for es, en in meses_es_en.items():
                if es in temp_val: temp_val = temp_val.replace(es, en)
            
            parsed_date = parse_date(temp_val)
            return parsed_date.date()
        except:
            return None

    # Manejo de horas
    if col_upper in ["HORA_PROGRAMADA", "HORA_LLENADO_REPORTE"]:
        try: return parse_date(val_str).time()
        except: return None

    return val_str.replace(";", "").strip().upper()

@router.post("/posicionamiento/raw")
async def sync_posicionamiento_raw(
    payload: Any = Body(...), 
    x_sync_token: str = Header(None, alias="X-Sync-Token"), 
    db: Session = Depends(get_db)
):
    if isinstance(payload, str): payload = json.loads(payload)
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN: raise HTTPException(status_code=401)
    if not payload or len(payload) < 2: return {"status": "error", "message": "Payload vacio"}
    
    def clean_header(h: Any):
        return re.sub(r'[^A-Z0-9]', '', str(h).upper()) if h else ""

    excel_headers = [clean_header(h) for h in payload[0]]
    logger.info(f"CABECERAS LIMPIAS DETECTADAS: {excel_headers}")
    data_rows = payload[1:]
    
    # Mapear usando la limpieza también en las llaves del mapping
    mapping_indices = {}
    for ex_col, db_col in COLUMN_MAPPING.items():
        clean_target = clean_header(ex_col)
        if clean_target in excel_headers:
            mapping_indices[db_col] = excel_headers.index(clean_target)
            
    logger.info(f"Mapping indices Posicionamiento: {mapping_indices}")
    
    results = {"processed": 0, "errors": [], "skipped": 0}
    
    for i, row in enumerate(data_rows):
        try:
            row_data = {db_col: clean_data_value(row[idx], db_col) for db_col, idx in mapping_indices.items() if idx < len(row)}
            booking_id = row_data.get("booking")
            if not booking_id:
                results["skipped"] += 1
                continue
                
            stmt = insert(Posicionamiento).values(**row_data)
            update_data = {k: v for k, v in row_data.items() if k != "booking" and v is not None}
            upsert_stmt = stmt.on_conflict_do_update(index_elements=[Posicionamiento.BOOKING], set_=update_data) if update_data else stmt.on_conflict_do_nothing(index_elements=[Posicionamiento.BOOKING])
            db.execute(upsert_stmt)
            results["processed"] += 1
        except Exception as e:
            db.rollback()
            results["errors"].append({"row": i + 2, "error": str(e)})
            
    db.commit()
    return {"status": "success" if not results["errors"] else "partial_success", "summary": results}

@router.post("/pedidos/raw")
async def sync_pedidos_raw(
    payload: Any = Body(...), 
    x_sync_token: str = Header(None, alias="X-Sync-Token"), 
    db: Session = Depends(get_db)
):
    if isinstance(payload, str): payload = json.loads(payload)
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN: raise HTTPException(status_code=401)
    if not payload or len(payload) < 2: return {"status": "error", "message": "Payload vacio"}
    
    def clean_header(h: Any):
        return re.sub(r'[^A-Z0-9]', '', str(h).upper()) if h else ""

    excel_headers = [clean_header(h) for h in payload[0]]
    data_rows = payload[1:]
    
    mapping_indices = {}
    for ex_col, db_col in PEDIDOS_MAPPING.items():
        clean_target = clean_header(ex_col)
        if clean_target in excel_headers:
            mapping_indices[db_col] = excel_headers.index(clean_target)

    logger.info(f"Mapping indices Pedidos: {mapping_indices}")

    try:
        db.query(PedidoComercial).delete()
        mappings = []
        for row in data_rows:
            pedido_data = {db_col: clean_data_value(row[idx], db_col) for db_col, idx in mapping_indices.items() if idx < len(row)}
            if pedido_data.get("orden_beta"): mappings.append(pedido_data)
        if mappings: db.bulk_insert_mappings(PedidoComercial, mappings)
        db.commit()
        return {"status": "success", "summary": {"processed": len(mappings), "message": "Recarga total de pedidos exitosa"}}
    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}

@router.post("/reportes/embarques/raw")
async def sync_reportes_embarques_raw(
    payload: Any = Body(...), 
    x_sync_token: str = Header(None, alias="X-Sync-Token"), 
    db: Session = Depends(get_db)
):
    if isinstance(payload, str): payload = json.loads(payload)
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN: raise HTTPException(status_code=401)
    
    # Manejar modo dual (lista de objetos o lista de listas)
    mappings = []
    if isinstance(payload, list) and len(payload) > 0:
        if isinstance(payload[0], dict):
            # Modo Objetos
            for row in payload:
                bkg = str(row.get("BOOKING") or row.get("RESERVA") or "").strip().upper()
                nave = str(row.get("NAVE") or row.get("NAVE ARRIBO") or "").strip().upper()
                if bkg: mappings.append({"booking": bkg, "nave_arribo": nave})
        else:
            # Modo Legado (Array de Arrays)
            headers = [str(h).strip().upper() for h in payload[0]]
            data = payload[1:]
            idx_bkg = -1
            idx_nave = -1
            for i, h in enumerate(headers):
                if "BOOKING" in h or "RESERVA" in h: idx_bkg = i
                if "NAVE" in h: idx_nave = i
            if idx_bkg != -1:
                for row in data:
                    if idx_bkg < len(row):
                        bkg = str(row[idx_bkg]).strip().upper()
                        nave = str(row[idx_nave]).strip().upper() if idx_nave != -1 and idx_nave < len(row) else None
                        if bkg: mappings.append({"booking": bkg, "nave_arribo": nave})

    try:
        db.query(ReporteEmbarques).delete()
        if mappings: db.bulk_insert_mappings(ReporteEmbarques, mappings)
        db.commit()
        return {"status": "success", "summary": {"processed": len(mappings), "message": "Reporte de embarques actualizado"}}
    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}

@router.get("/posicionamiento/list")
def list_posicionamiento(db: Session = Depends(get_db)):
    return db.query(Posicionamiento).all()

@router.get("/pedidos/list")
def list_pedidos(db: Session = Depends(get_db)):
    return db.query(PedidoComercial).all()

@router.get("/reportes/embarques/list")
def list_reportes_embarques(db: Session = Depends(get_db)):
    return db.query(ReporteEmbarques).all()
