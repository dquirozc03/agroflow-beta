from fastapi import APIRouter, Header, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.database import get_db
from app.configuracion import settings
from app.models.posicionamiento import Posicionamiento
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/sync", tags=["sincronizacion"])

# Mapeo de columnas: Nombre Exacto en Excel (Inge Daniel) -> Nombre en la Base de Datos
COLUMN_MAPPING = {
    "PLT. EMPACADORA": "PLANTA_LLENADO",
    "CULTIVO": "CULTIVO",
    "BOOKING LIMPIO": "BOOKING",
    "NAVE": "NAVE",
    "ETD BOOKING": "ETD",
    "ETA BOOKING": "ETA",
    "POL": "POL",
    "O/BETA FINAL": "ORDEN_BETA",
    "PRECINTO SENASA (SI/NO)": "PRECINTO_SENASA",
    "OPERADOR": "OPERADOR_LOGISTICO",
    "NAVIERA": "NAVIERA",
    "TERMOREGISTROS": "TERMOREGISTROS",
    "AC": "AC",
    "C/T": "CT",
    "VENT": "VENTILACION",
    "T°": "TEMPERATURA",
    "HUMEDAD": "HUMEDAD",
    "FILTROS": "FILTROS",
    "FECHA SOLICITADA (OPERADOR)": "FECHA_PROGRAMADA",
    "HORA SOLICITADA (OPERADOR)": "HORA_PROGRAMADA",
    "CAJAS VACIAS (SI/NO)": "CAJAS_VACIAS"
}

from dateutil.parser import parse as parse_date

def clean_data_value(val: str, db_column: str):
    """
    Limpia y convierte valores de texto de Excel a tipos compatibles con la DB.
    """
    if not val or str(val).strip().upper() in ["", "-", "N/A", "NONE", "NULL"]:
        return None
    
    val_str = str(val).strip()
    
    # 1. Manejo de Enteros (ej. CAJAS_VACIAS)
    if db_column == "CAJAS_VACIAS":
        if val_str.upper() == "SI": return 1
        if val_str.upper() == "NO": return 0
        try:
            return int(float(val_str))
        except:
            return 0

    # 2. Manejo de Fechas (ETD, ETA, FECHA_PROGRAMADA)
    if db_column in ["ETD", "ETA", "FECHA_PROGRAMADA"]:
        try:
            return parse_date(val_str).date()
        except:
            logger.warning(f"No se pudo parsear fecha: {val_str} para {db_column}")
            return None

    # 3. Manejo de Horas (HORA_PROGRAMADA)
    if db_column == "HORA_PROGRAMADA":
        try:
            return parse_date(val_str).time()
        except:
            return None

    return val_str

@router.post("/posicionamiento/raw")
async def sync_posicionamiento_raw(
    payload: List[List[str]],
    x_sync_token: str = Header(None, alias="X-Sync-Token"),
    db: Session = Depends(get_db)
):
    """
    Endpoint de nivel profesional para sincronización masiva desde Excel.
    Incluye blindaje de tipos de datos y recolección de errores por fila.
    """
    
    # 1. Validación de Seguridad (Inge Daniel Sync Token)
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN:
        logger.warning(f"Intento de sincronización con token inválido: {x_sync_token}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de sincronización inválido o ausente."
        )

    if not payload or len(payload) < 2:
        return {"status": "error", "mensaje": "El payload no contiene datos suficientes.", "procesados": 0, "errores": 0}

    # 2. Análisis de Cabeceras (Robustez Extrema)
    import re
    
    def clean_header(h: str):
        if not h: return ""
        # Eliminar espacios múltiples, saltos de línea y trim
        return re.sub(r'\s+', ' ', str(h).strip()).upper()

    excel_headers_cleaned = [clean_header(h) for h in payload[0]]
    data_rows = payload[1:]
    
    mapping_indices = {}
    columnas_detectadas = []
    
    for excel_col, db_col in COLUMN_MAPPING.items():
        clean_target = clean_header(excel_col)
        if clean_target in excel_headers_cleaned:
            idx = excel_headers_cleaned.index(clean_target)
            mapping_indices[db_col] = idx
            columnas_detectadas.append(f"{excel_col} -> {db_col}")

    if "BOOKING" not in mapping_indices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "No se encontró la columna crítica 'Booking'",
                "cabeceras_recibidas": excel_headers_cleaned,
                "mapeo_esperado": [clean_header(k) for k in COLUMN_MAPPING.keys()]
            }
        )

    # 3. Procesamiento Masivo con Blindaje
    procesados = 0
    errores = 0
    detalle_errores = []
    
    for idx, row in enumerate(data_rows):
        fila_num = idx + 2 # +1 por 0-index, +1 por header
        try:
            row_data = {}
            for db_col, col_idx in mapping_indices.items():
                if col_idx < len(row):
                    raw_val = row[col_idx]
                    row_data[db_col] = clean_data_value(raw_val, db_col)

            if not row_data.get("BOOKING"):
                continue

            # Upsert
            stmt = insert(Posicionamiento).values(**row_data)
            upsert_stmt = stmt.on_conflict_do_update(
                index_elements=[Posicionamiento.BOOKING],
                set_={k: v for k, v in row_data.items() if k != "BOOKING"}
            )
            
            db.execute(upsert_stmt)
            procesados += 1
            
        except Exception as e:
            msg_error = f"Fila {fila_num}: {str(e)}"
            logger.error(msg_error)
            detalle_errores.append(msg_error)
            errores += 1

    db.commit()

    return {
        "status": "success" if errores == 0 else "partial_success",
        "mensaje": f"Sincronización finalizada. {procesados} éxitos, {errores} errores.",
        "columnas_mapeadas": columnas_detectadas,
        "procesados": procesados,
        "errores": errores,
        "detalle_errores": detalle_errores[:10] # Mostrar los primeros 10 para debug
    }
