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

# Mapeo de columnas: Nombre en Excel (Inge Daniel) -> Nombre en la Base de Datos
COLUMN_MAPPING = {
    "Planta de Llenado": "PLANTA_LLENADO",
    "Cultivo": "CULTIVO",
    "Booking": "BOOKING",
    "Nave": "NAVE",
    "ETD (Booking)": "ETD",
    "ETA (Booking)": "ETA",
    "POL": "POL",
    "Orden Beta": "ORDEN_BETA",
    "Precinto de Senasa": "PRECINTO_SENASA",
    "Operador Logistico": "OPERADOR_LOGISTICO",
    "Naviera": "NAVIERA",
    "Termoregistros": "TERMOREGISTROS",
    "AC": "AC",
    "C/T": "CT",
    "Ventilación": "VENTILACION",
    "Temperatura": "TEMPERATURA",
    "Humedad": "HUMEDAD",
    "Filtros": "FILTROS",
    "Fecha Programada de embarque": "FECHA_PROGRAMADA",
    "Hora programada": "HORA_PROGRAMADA",
    "Cajas Vacías": "CAJAS_VACIAS"
}

@router.post("/posicionamiento/raw")
async def sync_posicionamiento_raw(
    payload: List[List[str]],
    x_sync_token: str = Header(None, alias="X-Sync-Token"),
    db: Session = Depends(get_db)
):
    """
    Endpoint de nivel profesional para sincronización masiva desde Excel/Power Automate.
    Realiza un mapeo inteligente y Upsert basado en el 'Booking'.
    """
    
    # 1. Validación de Seguridad (Inge Daniel Sync Token)
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN:
        logger.warning(f"Intento de sincronización con token inválido: {x_sync_token}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de sincronización inválido o ausente."
        )

    if not payload or len(payload) < 2:
        return {"status": "error", "mensaje": "El payload no contiene datos suficientes (mínimo header + 1 fila).", "procesados": 0, "errores": 0}

    # 2. Análisis de Cabeceras
    excel_headers = [h.strip() if h else "" for h in payload[0]]
    data_rows = payload[1:]
    
    # Mapear qué columna de la BD está en qué índice del Excel
    mapping_indices = {}
    for excel_col, db_col in COLUMN_MAPPING.items():
        if excel_col in excel_headers:
            mapping_indices[db_col] = excel_headers.index(excel_col)

    if "BOOKING" not in mapping_indices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estructura de Excel inválida: No se encontró la columna crítica 'Booking'."
        )

    # 3. Procesamiento Masivo con Lógica de Upsert
    procesados = 0
    errores = 0
    
    for row in data_rows:
        try:
            # Construir diccionario de datos para esta fila
            row_data = {}
            for db_col, idx in mapping_indices.items():
                if idx < len(row):
                    val = row[idx].strip() if row[idx] else None
                    
                    # Limpieza básica de datos vacíos o guiones
                    if val in ["", "-", "N/A", "NONE"]:
                        val = None
                        
                    row_data[db_col] = val

            # Validar que al menos tenga el Booking
            if not row_data.get("BOOKING"):
                continue

            # Upsert: Insertar o actualizar si hay conflicto en BOOKING
            stmt = insert(Posicionamiento).values(**row_data)
            upsert_stmt = stmt.on_conflict_do_update(
                index_elements=[Posicionamiento.BOOKING],
                set_={k: v for k, v in row_data.items() if k != "BOOKING"}
            )
            
            db.execute(upsert_stmt)
            procesados += 1
            
        except Exception as e:
            logger.error(f"Error procesando fila de Excel: {str(e)}")
            errores += 1

    db.commit()

    return {
        "status": "success",
        "mensaje": f"Sincronización completada. Se procesaron {procesados} registros correctamente.",
        "procesados": procesados,
        "errores": errores
    }
