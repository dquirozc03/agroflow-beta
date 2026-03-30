from fastapi import APIRouter, Header, Depends, HTTPException, status, Body
from typing import List, Any
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.database import get_db
from app.configuracion import settings
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
import logging
import re
import json
from dateutil.parser import parse as parse_date

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

# Mapeo de columnas: Nombre Exacto en Excel (Pedidos) -> Nombre en la Base de Datos
COLUMN_MAPPING_PEDIDOS = {
    "ZONA": "planta",
    "PLANTA": "planta",
    "ORDEN": "orden_beta",
    "PO": "po",
    "CULTIVO": "cultivo",
    "CLIENTE GENERAL": "cliente",
    "CLIENTE": "cliente",
    "CONSIGNATARIO": "consignatario",
    "RECIBIDOR": "recibidor",
    "POR ID ORIGEN": "port_id_orig",
    "PAIS ": "pais",
    "PAIS": "pais",
    "POD": "pod",
    "POD ID DESTINO": "port_id_dest",
    "POD DESTINO": "port_id_dest",
    "PRESENTACION ": "presentacion",
    "PRESENTACION": "presentacion",
    "VARIEDAD": "variedad",
    "PRODUCT": "product",
    "PESO POR CAJA ": "peso_por_caja",
    "PESO POR CAJA": "peso_por_caja",
    "ADDITIONAL INFORMATION": "additional_info",
    "CAJA POR PALLET": "caja_por_pallet",
    "TOTAL PALLETS": "total_pallets",
    "TOTAL PALLET": "total_pallets",
    "TOTAL PALLETS FCL": "total_pallets",
    "PALLETS": "total_pallets",
    "PALLET": "total_pallets",
    "CANTIDAD PALLETS": "total_pallets",
    "NRO PALLETS": "total_pallets",
    "TOTAL CAJAS": "total_cajas",
    "INCOTERM": "incoterm",
    "TIPO PRECIO": "tipo_precio",
    "TIPO DE PRECIO": "tipo_precio"
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

    # 2. Manejo de Fechas (ETD, ETA, FECHA_PROGRAMADA - Soporte Español)
    if db_column in ["ETD", "ETA", "FECHA_PROGRAMADA"]:
        try:
            # Traducción básica de meses en español a inglés para el parser
            meses_es_en = {
                "ENE": "JAN", "FEB": "FEB", "MAR": "MAR", "ABR": "APR", "MAY": "MAY", "JUN": "JUN",
                "JUL": "JUL", "AGO": "AUG", "SEP": "SEP", "OCT": "OCT", "NOV": "NOV", "DIC": "DEC"
            }
            temp_val = val_str.upper()
            for es, en in meses_es_en.items():
                if es in temp_val:
                    temp_val = temp_val.replace(es, en)
            
            return parse_date(temp_val).date()
        except Exception as e:
            logger.warning(f"No se pudo parsear fecha: {val_str} para {db_column}: {str(e)}")
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
    payload: Any = Body(...),
    x_sync_token: str = Header(None, alias="X-Sync-Token"),
    db: Session = Depends(get_db)
):
    """
    Endpoint de nivel profesional para sincronización masiva desde Excel.
    """
    # Robustez contra Power Automate: Si llega como string, lo parseamos
    if isinstance(payload, str):
        try:
            import json
            payload = json.loads(payload)
        except Exception:
            raise HTTPException(status_code=400, detail="El payload enviado como texto no es un JSON válido.")

    # ... continuación del código ...
    
    # 1. Validación de Seguridad (Inge Daniel Sync Token)
    received_token = x_sync_token.strip() if x_sync_token else None
    expected_token = settings.SYNC_TOKEN.strip() if settings.SYNC_TOKEN else None

    if not received_token or received_token != expected_token:
        logger.warning(f"Intento de sincronización con token inválido: {received_token}")
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

@router.post("/pedidos/raw")
async def sync_pedidos_raw(
    payload: Any = Body(...),
    x_sync_token: str = Header(None, alias="X-Sync-Token"),
    db: Session = Depends(get_db)
):
    """
    Endpoint para sincronización de Pedidos Comerciales.
    Estrategia: RECARGA TOTAL (Delete & Insert).
    Convierte todo el texto a MAYÚSCULAS.
    """
    # Robustez contra Power Automate: Si llega como string, lo parseamos
    if isinstance(payload, str):
        try:
            import json
            payload = json.loads(payload)
        except Exception:
            raise HTTPException(status_code=400, detail="El payload enviado como texto no es un JSON válido.")
    
    # 1. Validación de Seguridad
    received_token = x_sync_token.strip() if x_sync_token else None
    expected_token = settings.SYNC_TOKEN.strip() if settings.SYNC_TOKEN else None

    if not received_token or received_token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de sincronización inválido."
        )

    if not payload or len(payload) < 2:
        return {"status": "error", "mensaje": "Payload vacío.", "procesados": 0}

    # 2. Análisis de Cabeceras
    import re
    def clean_header(h: str):
        if not h: return ""
        # Limpieza profunda: mayúsculas y solo caracteres A-Z-0-9
        return re.sub(r'[^A-Z0-9]', '', str(h).upper())

    def extract_numeric(val: Any) -> float:
        """Extrae el primer número de una cadena (ej: '3.8 KG' -> 3.8)"""
        if val is None: return 0.0
        s = str(val).replace(',', '').strip()
        # Buscamos algo que parezca número (int o float)
        match = re.search(r'(\d+(\.\d+)?)', s)
        if match:
            try:
                return float(match.group(1))
            except:
                return 0.0
        return 0.0

    excel_headers = [clean_header(h) for h in payload[0]]
    data_rows = payload[1:]
    
    mapping_indices = {}
    for excel_col, db_col in COLUMN_MAPPING_PEDIDOS.items():
        clean_target = clean_header(excel_col)
        if clean_target in excel_headers:
            mapping_indices[db_col] = excel_headers.index(clean_target)

    # Lógica de respaldo para Total Pallets si no se encontró exacta
    if "total_pallets" not in mapping_indices:
        for i, h in enumerate(excel_headers):
            if "PALLET" in h and "TOTAL" in h:
                mapping_indices["total_pallets"] = i
                break
    if "total_pallets" not in mapping_indices:
        for i, h in enumerate(excel_headers):
            if h == "PALLETS" or h == "PALLET":
                mapping_indices["total_pallets"] = i
                break

    # 3. RECARGA TOTAL Entrenada (Atómica)
    try:
        # Iniciamos el proceso
        db.query(PedidoComercial).delete()
        
        # 4. Procesamiento de Filas (Filtro de Alto Rendimiento)
        mappings = []
        errores = 0
        numeric_cols = ["peso_por_caja", "caja_por_pallet", "total_pallets", "total_cajas"]
        null_values = {"", "-", "N/A", "NONE", "NULL", "#¡VALOR!", "#VALUE!", "#DIV/0!"}

        # Limitamos a 5000 filas para evitar abusos de memoria y saltamos vacías
        for row in data_rows[:5000]:
            if not row or not any(str(c).strip() for c in row if c is not None):
                continue
                
            try:
                pedido_data = {}
                for db_col, idx in mapping_indices.items():
                    if idx < len(row):
                        raw_val = row[idx]
                        if raw_val is None:
                            pedido_data[db_col] = None
                            continue
                            
                        val = str(raw_val).strip()
                        if not val or val.upper() in null_values:
                            pedido_data[db_col] = None
                        elif db_col in numeric_cols:
                            # Usamos el extractor inteligente
                            num_val = extract_numeric(raw_val)
                            # Si es entero según el modelo, lo castamos
                            if db_col != "peso_por_caja":
                                pedido_data[db_col] = int(num_val)
                            else:
                                pedido_data[db_col] = num_val
                        else:
                            pedido_data[db_col] = val.upper()
                
                if pedido_data:
                    mappings.append(pedido_data)
            except:
                errores += 1

        # 5. Inserción Masiva
        if mappings:
            db.bulk_insert_mappings(PedidoComercial, mappings)
        
        db.commit()
        
        return {
            "status": "success",
            "mensaje": f"Sincronización atómica exitosa. {len(mappings)} filas importadas.",
            "errores_omitidos": errores
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error en sincronización atómica: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fallo en la sincronización: {str(e)}")

@router.get("/posicionamiento/list")
def list_posicionamiento(db: Session = Depends(get_db)):
    """Retorna listado completo del Plan Maestro para el módulo de Instrucciones."""
    return db.query(Posicionamiento).order_by(Posicionamiento.FECHA_CREACION.desc()).all()
