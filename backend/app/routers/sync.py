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
import re
import json
from dateutil.parser import parse as parse_date

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/sync", tags=["sincronizacion"])

# Mapeo de columnas: Nombre Exacto en Excel -> Nombre de columna en DB (minúsculas)
COLUMN_MAPPING = {
    "PLT. EMPACADORA": "planta_llenado",
    "CULTIVO": "cultivo",
    "BOOKING": "booking",
    "BOOKING LIMPIO": "booking",
    "NAVE": "nave",
    "ETD BOOKING": "etd",
    "ETA BOOKING": "eta",
    "POL": "pol",
    "O/BETA FINAL": "orden_beta",
    "O/BETA": "orden_beta",
    "ORDEN BETA": "orden_beta",
    "PRECINTO SENASA (SI/NO)": "precinto_senasa",
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
    "DESTINO (BOOKING)": "destino_booking",
    "FECHA DE LLENADO (REPORTE)": "fecha_llenado_reporte",
    "HORA DE LLENADO (REPORTE)": "hora_llenado_reporte",
    "TIPO DE TECNOLOGIA": "tipo_tecnologia",
    "ETIQUETA CAJA": "etiqueta_caja",
    "CAJAS VACIAS (SI/NO)": "cajas_vacias"
}

def clean_data_value(val: str, db_column: str):
    null_and_errors = {"", "-", "N/A", "NONE", "NULL", "NAN", "#¡VALOR!", "#VALUE!", "#REF!", "#DIV/0!"}
    if val is None: return None
    val_str = str(val).strip()
    if not val_str or val_str.upper() in null_and_errors: return None
    
    if db_column == "cajas_vacias":
        if val_str.upper() == "SI": return 1
        if val_str.upper() == "NO": return 0
        try: return int(float(val_str))
        except: return 0
    if db_column in ["etd", "eta", "fecha_programada", "fecha_llenado_reporte"]:
        try: return parse_date(val_str).date()
        except: return None
    if db_column in ["hora_programada", "hora_llenado_reporte"]:
        try: return parse_date(val_str).time()
        except: return None
    return val_str.replace(";", "").strip()

@router.post("/posicionamiento/raw")
async def sync_posicionamiento_raw(payload: Any = Body(...), x_sync_token: str = Header(None, alias="X-Sync-Token"), db: Session = Depends(get_db)):
    if isinstance(payload, str): payload = json.loads(payload)
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN: raise HTTPException(status_code=401)
    
    headers = [str(h).strip().upper() for h in payload[0]]
    logger.info(f"Sync Headers received: {headers}")
    data_rows = payload[1:]
    
    mapping_indices = {db_col: headers.index(ex_col.upper()) for ex_col, db_col in COLUMN_MAPPING.items() if ex_col.upper() in headers}
    logger.info(f"Mapping indices: {mapping_indices}")
    
    for row in data_rows:
        row_data = {db_col: clean_data_value(row[idx], db_col) for db_col, idx in mapping_indices.items() if idx < len(row)}
        if not row_data.get("booking"): continue
        stmt = insert(Posicionamiento).values(**row_data)
        update_data = {k: v for k, v in row_data.items() if k != "booking" and v is not None}
        upsert_stmt = stmt.on_conflict_do_update(index_elements=[Posicionamiento.BOOKING], set_=update_data) if update_data else stmt.on_conflict_do_nothing(index_elements=[Posicionamiento.BOOKING])
        db.execute(upsert_stmt)
    db.commit()
    return {"status": "success"}

@router.get("/posicionamiento/list")
def list_posicionamiento(db: Session = Depends(get_db)):
    return db.query(Posicionamiento).order_by(Posicionamiento.FECHA_CREACION.desc()).all()
