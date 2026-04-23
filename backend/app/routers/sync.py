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

# Mapeo de columnas: Nombre Exacto en Excel (Inge Daniel) -> Nombre en la Base de Datos
COLUMN_MAPPING = {
    "PLT. EMPACADORA": "planta_llenado",
    "CULTIVO": "cultivo",
    "BOOKING LIMPIO": "booking",
    "NAVE": "nave",
    "ETD BOOKING": "etd",
    "ETA BOOKING": "eta",
    "POL": "pol",
    "O/BETA FINAL": "orden_beta",
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
    "CAJAS VACIAS (SI/NO)": "cajas_vacias"
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
    Maneja errores de fórmulas de Excel y valores nulos.
    """
    # Lista extendida de valores que representan "Vacío" o "Error" en Excel
    null_and_errors = {
        "", "-", "N/A", "NONE", "NULL", "NAN", 
        "#¡VALOR!", "#VALUE!", "#REF!", "#¡REF!", "#DIV/0!", "#N/A", "#NAME?", "#¿NOMBRE?"
    }
    
    if val is None:
        return None
        
    val_str = str(val).strip()
    
    if not val_str or val_str.upper() in null_and_errors:
        return None
    
    # 1. Manejo de Enteros (ej. cajas_vacias)
    if db_column == "cajas_vacias":
        if val_str.upper() == "SI": return 1
        if val_str.upper() == "NO": return 0
        try:
            return int(float(val_str))
        except:
            return 0

    # 2. Manejo de Fechas (etd, eta, fecha_programada, fecha_llenado_reporte)
    if db_column in ["etd", "eta", "fecha_programada", "fecha_llenado_reporte"]:
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

    # 3. Manejo de Horas (hora_programada, hora_llenado_reporte)
    if db_column in ["hora_programada", "hora_llenado_reporte"]:
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

    if "booking" not in mapping_indices:
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

            if not row_data.get("booking"):
                continue

            # Upsert Inteligente (Protección contra NULLs)
            stmt = insert(Posicionamiento).values(**row_data)
            
            # Solo actualizamos los campos que NO vienen nulos en esta fila de Excel,
            # manteniendo la información previa si en esta sincronización el campo está vacío.
            update_data = {k: v for k, v in row_data.items() if k != "booking" and v is not None}
            
            if update_data:
                upsert_stmt = stmt.on_conflict_do_update(
                    index_elements=[Posicionamiento.booking],
                    set_=update_data
                )
            else:
                # Si todo el payload es nulo excepto el ID, solo intentamos insertar si no existe
                upsert_stmt = stmt.on_conflict_do_nothing(index_elements=[Posicionamiento.booking])
            
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
    return db.query(Posicionamiento).order_by(Posicionamiento.fecha_creacion.desc()).all()

@router.get("/pedidos/list")
def list_pedidos(db: Session = Depends(get_db)):
    """Retorna listado completo de Pedidos Comerciales para auditoría."""
    return db.query(PedidoComercial).order_by(PedidoComercial.id.asc()).all()

@router.post("/reportes/embarques/raw")
async def sync_reportes_embarques_raw(
    request: Request,
    x_sync_token: str = Header(None, alias="X-Sync-Token"),
    db: Session = Depends(get_db)
):
    """
    Endpoint ultra-flexible para sincronización de Reporte Embarques.
    Usa el objeto Request directamente para evitar errores 422 de validación automática.
    """
    try:
        body_bytes = await request.body()
        if not body_bytes:
            return {"status": "error", "mensaje": "El cuerpo de la petición (body) llegó totalmente vacío desde Power Automate."}
        
        payload = json.loads(body_bytes)
    except Exception as e:
        return {"status": "error", "mensaje": f"Error parseando el JSON enviado: {str(e)}"}

    expected_token = settings.SYNC_TOKEN.strip() if settings.SYNC_TOKEN else None
    if not x_sync_token or x_sync_token.strip() != expected_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")

    if not payload:
        return {"status": "error", "mensaje": "Payload nulo o vacío.", "procesados": 0}

    import re
    def clean_header(h: str): return re.sub(r'[^A-Z0-9]', '', str(h).upper()) if h else ""
    
    # Manejar si el payload es un diccionario único o una lista
    if isinstance(payload, dict):
        payload = [payload]
    
    if not isinstance(payload, list):
         return {"status": "error", "mensaje": "El formato enviado no es una lista de objetos válida."}

    is_dict_payload = len(payload) > 0 and isinstance(payload[0], dict)

    # Identificación de nombres de columnas y extracción de modo dual
    mappings = []
    
    if is_dict_payload:
        # Modo Nativo de Power Automate
        original_booking_key = None
        original_nave_key = None
        
        for k in payload[0].keys():
            clean_k = clean_header(k)
            if not original_booking_key and ("RESERVA" in clean_k or "BOOKING" in clean_k):
                original_booking_key = k
            if not original_nave_key and ("NAVE" in clean_k and "ARRIBO" in clean_k):
                original_nave_key = k
                
        if not original_booking_key:
            raise HTTPException(status_code=400, detail="Columna 'Reserva' o 'Booking' no encontrada en el JSON.")
            
        for row in payload:
            bkg_raw = row.get(original_booking_key)
            if not bkg_raw: continue
            
            bkg_val = str(bkg_raw).strip().upper()
            if not bkg_val or bkg_val in ["", "-", "N/A"]: continue
            
            nave_val = None
            if original_nave_key:
                nave_raw = row.get(original_nave_key)
                if nave_raw:
                    n_val = str(nave_raw).strip().upper()
                    if n_val not in ["", "-", "N/A"]: nave_val = n_val
                    
            mappings.append({"booking": bkg_val, "nave_arribo": nave_val})

    else:
        # Modo Legado Office Scripts (Array de Arrays)
        if len(payload) < 2:
            return {"status": "error", "mensaje": "Payload sin datos.", "procesados": 0}
            
        headers = [clean_header(h) for h in payload[0]]
        data_rows = payload[1:]

        idx_booking = -1
        idx_nave = -1
        
        for i, h in enumerate(headers):
            if idx_booking == -1 and ("RESERVA" in h or "BOOKING" in h): idx_booking = i
            if idx_nave == -1 and ("NAVE" in h and "ARRIBO" in h): idx_nave = i

        if idx_booking == -1:
            raise HTTPException(status_code=400, detail="Columna 'Reserva' o 'Booking' no encontrada.")

        for row in data_rows:
            if not row or not any(str(c).strip() for c in row if c is not None): continue
            if idx_booking >= len(row): continue
            
            bkg_val = str(row[idx_booking]).strip().upper()
            if not bkg_val or bkg_val in ["", "-", "N/A"]: continue
            
            nave_val = None
            if idx_nave != -1 and idx_nave < len(row) and row[idx_nave]:
                nave_val = str(row[idx_nave]).strip().upper()
                if nave_val in ["", "-", "N/A"]: nave_val = None

            mappings.append({"booking": bkg_val, "nave_arribo": nave_val})

    try:
        db.query(ReporteEmbarques).delete()
        if mappings:
            db.bulk_insert_mappings(ReporteEmbarques, mappings)
        db.commit()
        
        return {
            "status": "success",
            "mensaje": f"Sincronización exitosa. {len(mappings)} filas guardadas."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")

@router.get("/reportes/embarques/list")
def list_reportes_embarques(db: Session = Depends(get_db)):
    """Lista auditoría de modelo 01"""
    return db.query(ReporteEmbarques).all()

