from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from sqlalchemy.orm import Session
import re

from app.database import get_db
from app.configuracion import settings
from app.models.ref_posicionamiento import RefPosicionamiento
from app.models.ref_booking_dam import RefBookingDam
from app.models.catalogos import Transportista, Vehiculo, Chofer

router = APIRouter(prefix="/api/v1/sync", tags=["Sync"])

def normalizar(v: str | None) -> str | None:
    if v is None:
        return None
    v = " ".join(v.strip().split()).upper()
    return v or None

def normalize_header(h: str) -> str:
    """Remueve acentos y caracteres especiales para matching robusto"""
    if not h: return ""
    h = str(h).upper().strip()
    # Reemplazo manual de acentos comunes
    repls = {"Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", "Ñ": "N"}
    for k, v in repls.items():
        h = h.replace(k, v)
    # Solo dejar letras y números
    return re.sub(r'[^A-Z0-9]', '', h)

def fuzzy_key(h: str) -> str:
    return normalize_header(h)

def validar_token(x_sync_token: str | None):
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN:
        raise HTTPException(status_code=401, detail="Token de sync inválido")

class DamItem(BaseModel):
    booking: str
    awb: Optional[str] = None
    dam: Optional[str] = None

class PosicionamientoItem(BaseModel):
    # Identificación y Status
    booking: str = Field(alias="BOOKING")
    status_fcl: Optional[str] = Field(None, alias="STATUS - FCL")
    status_beta_text: Optional[str] = Field(None, alias="O/BETA (STATUS FINAL)")
    planta_empacadora: Optional[str] = Field(None, alias="PLT. EMPACADORA")
    cultivo: Optional[str] = Field(None, alias="CULTIVO")
    nave: Optional[str] = Field(None, alias="NAVE")
    
    # Fechas y Tránsito
    etd_booking: Optional[str] = Field(None, alias="ETD BOOKING")
    eta_booking: Optional[str] = Field(None, alias="ETA BOOKING")
    week_eta_booking: Optional[str] = Field(None, alias="WEEK ETA BOOKING")
    dias_tt_booking: Optional[int] = Field(None, alias="DIAS TT. BOOKING")
    etd_final: Optional[str] = Field(None, alias="ETD FINAL")
    eta_final: Optional[str] = Field(None, alias="ETA FINAL")
    week_eta_real: Optional[str] = Field(None, alias="WEEK ETA REAL")
    dias_tt_real: Optional[int] = Field(None, alias="DIAS TT. REAL")
    week_debe_arribar: Optional[str] = Field(None, alias="WEEK DEBE ARRIBAR")
    pol: Optional[str] = Field(None, alias="POL")
    
    # Órdenes y Cliente
    o_beta_inicial: Optional[str] = Field(None, alias="O/BETA INICIAL")
    orden_beta_final: Optional[str] = Field(None, alias="O/BETA FINAL")
    cliente: Optional[str] = Field(None, alias="CLIENTE")
    recibidor: Optional[str] = Field(None, alias="RECIBIDOR")
    destino_pedido: Optional[str] = Field(None, alias="DESTINO (PEDIDO)")
    po_number: Optional[str] = Field(None, alias="PO")
    destino_booking: Optional[str] = Field(None, alias="DESTINO (BOOKING)")
    pais_booking: Optional[str] = Field(None, alias="PAIS (BOOKING)")
    
    # Equipo
    nro_fcl: Optional[str] = Field(None, alias="N° FCL")
    deposito_retiro: Optional[str] = Field(None, alias="DEPOT DE RETIRO")
    operador: Optional[str] = Field(None, alias="OPERADOR")
    naviera: Optional[str] = Field(None, alias="NAVIERA")
    
    # Parámetros Carga
    termoregistros: Optional[str] = Field(None, alias="TERMOREGISTROS")
    ac_option: Optional[str] = Field(None, alias="AC")
    ct_option: Optional[str] = Field(None, alias="C/T")
    ventilacion: Optional[str] = Field(None, alias="VENT")
    temperatura: Optional[str] = Field(None, alias="T°")
    humedad: Optional[str] = Field(None, alias="HUMEDAD")
    filtros: Optional[str] = Field(None, alias="FILTROS")
    
    # Producción
    hora_solicitada_operador: Optional[str] = Field(None, alias="HORA SOLICITADA (OPERADOR)")
    fecha_solicitada_operador: Optional[str] = Field(None, alias="FECHA SOLICITADA (OPERADOR)")
    fecha_real_llenado: Optional[str] = Field(None, alias="FECHA REAL DE LLENADO")
    week_llenado: Optional[str] = Field(None, alias="WEEK LLENADO")
    
    # Mercadería
    variedad: Optional[str] = Field(None, alias="VARIEDAD")
    tipo_caja: Optional[str] = Field(None, alias="TIPO DE CAJA")
    etiqueta_caja: Optional[str] = Field(None, alias="ETIQUETA CAJA")
    presentacion: Optional[str] = Field(None, alias="PRESENTACIÓN")
    calibre: Optional[str] = Field(None, alias="CALIBRE")
    cj_kg: Optional[str] = Field(None, alias="CJ/KG")
    total_unidades: Optional[int] = Field(None, alias="TOTAL")
    total_pallet: Optional[int] = Field(None, alias="TOTAL DE PALLETS")
    
    # Logística
    incoterm: Optional[str] = Field(None, alias="INCOTERM")
    flete: Optional[str] = Field(None, alias="FLETE")

    model_config = {"populate_by_name": True}

@router.post("/posicionamiento")
def sync_posicionamiento(
    payload: Union[PosicionamientoItem, List[PosicionamientoItem]],
    db: Session = Depends(get_db),
    x_sync_token: str | None = Header(default=None),
):
    validar_token(x_sync_token)
    items = [payload] if isinstance(payload, PosicionamientoItem) else payload

    upserts = 0
    for it in items:
        booking = normalizar(it.booking)
        if not booking: continue

        row = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
        if not row:
            row = RefPosicionamiento(booking=booking)
            db.add(row)
        
        # Mapeo Optimizando (45 campos)
        row.status_fcl = normalizar(it.status_fcl)
        row.status_beta_text = normalizar(it.status_beta_text)
        row.planta_empacadora = normalizar(it.planta_empacadora)
        row.cultivo = normalizar(it.cultivo)
        row.nave = normalizar(it.nave)
        
        row.etd_booking = normalizar(it.etd_booking)
        row.eta_booking = normalizar(it.eta_booking)
        row.week_eta_booking = normalizar(it.week_eta_booking)
        row.dias_tt_booking = it.dias_tt_booking
        row.etd_final = normalizar(it.etd_final)
        row.eta_final = normalizar(it.eta_final)
        row.week_eta_real = normalizar(it.week_eta_real)
        row.dias_tt_real = it.dias_tt_real
        row.week_debe_arribar = normalizar(it.week_debe_arribar)
        row.pol = normalizar(it.pol)
        
        row.o_beta_inicial = normalizar(it.o_beta_inicial)
        row.orden_beta_final = normalizar(it.orden_beta_final)
        
        # Manejo de Cliente y Recibidor (Separar por '-' ej: OGL-VDH)
        cliente_ref = normalizar(it.cliente)
        recibidor_ref = normalizar(it.recibidor)
        
        if cliente_ref and "-" in cliente_ref:
            partes = [p.strip() for p in cliente_ref.split("-", 1)]
            row.cliente = partes[0]
            # Solo sobreescribe recibidor si el original viene vacío
            if not recibidor_ref and len(partes) > 1:
                row.recibidor = partes[1]
            else:
                row.recibidor = recibidor_ref
        else:
            row.cliente = (cliente_ref or "").strip()
            row.recibidor = (recibidor_ref or "").strip()

        row.destino_pedido = normalizar(it.destino_pedido)
        row.po_number = normalizar(it.po_number)
        row.destino_booking = normalizar(it.destino_booking)
        row.pais_booking = normalizar(it.pais_booking)
        
        row.nro_fcl = normalizar(it.nro_fcl)
        row.deposito_retiro = normalizar(it.deposito_retiro)
        row.operador = normalizar(it.operador)
        row.naviera = normalizar(it.naviera)
        
        row.termoregistros = normalizar(it.termoregistros)
        row.ac_option = normalizar(it.ac_option)
        row.ct_option = normalizar(it.ct_option)
        row.ventilacion = normalizar(it.ventilacion)
        row.temperatura = normalizar(it.temperatura)
        row.humedad = normalizar(it.humedad)
        row.filtros = normalizar(it.filtros)
        
        row.hora_solicitada_operador = normalizar(it.hora_solicitada_operador)
        row.fecha_solicitada_operador = normalizar(it.fecha_solicitada_operador)
        row.fecha_real_llenado = normalizar(it.fecha_real_llenado)
        row.week_llenado = normalizar(it.week_llenado)
        
        row.variedad = normalizar(it.variedad)
        row.tipo_caja = normalizar(it.tipo_caja)
        row.etiqueta_caja = normalizar(it.etiqueta_caja)
        row.presentacion = normalizar(it.presentacion)
        row.calibre = normalizar(it.calibre)
        row.cj_kg = normalizar(it.cj_kg)
        row.total_unidades = normalizar(str(it.total_unidades)) if it.total_unidades is not None else None
        row.total_pallet = it.total_pallet
        
        row.incoterm = normalizar(it.incoterm)
        row.flete = normalizar(it.flete)
        
        upserts += 1

    db.commit()
    return {"ok": True, "upserts": upserts}

@router.post("/posicionamiento/raw")
def sync_posicionamiento_raw(
    payload: List[List[Union[str, int, float, None]]],
    db: Session = Depends(get_db),
    x_sync_token: str | None = Header(default=None),
):
    validar_token(x_sync_token)
    if not payload or len(payload) < 2:
        return {"ok": False, "detail": "Datos insuficientes"}

    # 1. Normalización de cabeceras (Fuzzy Matching Global)

    raw_headers = payload[0]
    processed_headers = [fuzzy_key(h) for h in raw_headers]
    
    WHITELIST_MAP = {
        fuzzy_key("BOOKING"): "booking",
        fuzzy_key("STATUS - FCL"): "status_fcl",
        fuzzy_key("O/BETA (STATUS FINAL)"): "status_beta_text",
        fuzzy_key("PLT. EMPACADORA"): "planta_empacadora",
        fuzzy_key("CULTIVO"): "cultivo",
        fuzzy_key("NAVE"): "nave",
        fuzzy_key("ETD BOOKING"): "etd_booking",
        fuzzy_key("ETA BOOKING"): "eta_booking",
        fuzzy_key("WEEK ETA BOOKING"): "week_eta_booking",
        fuzzy_key("DIAS TT. BOOKING"): "dias_tt_booking",
        fuzzy_key("ETD FINAL"): "etd_final",
        fuzzy_key("ETA FINAL"): "eta_final",
        fuzzy_key("WEEK ETA REAL"): "week_eta_real",
        fuzzy_key("DIAS TT. REAL"): "dias_tt_real",
        fuzzy_key("WEEK DEBE ARRIBAR"): "week_debe_arribar",
        fuzzy_key("POL"): "pol",
        fuzzy_key("O/BETA INICIAL"): "o_beta_inicial",
        fuzzy_key("O/BETA FINAL"): "orden_beta_final",
        fuzzy_key("CLIENTE"): "cliente",
        fuzzy_key("RECIBIDOR"): "recibidor",
        fuzzy_key("DESTINO (PEDIDO)"): "destino_pedido",
        fuzzy_key("PO"): "po_number",
        fuzzy_key("DESTINO (BOOKING)"): "destino_booking",
        fuzzy_key("PAIS (BOOKING)"): "pais_booking",
        fuzzy_key("N° FCL"): "nro_fcl",
        fuzzy_key("DEPOT DE RETIRO"): "deposito_retiro",
        fuzzy_key("OPERADOR"): "operador",
        fuzzy_key("NAVIERA"): "naviera",
        fuzzy_key("TERMOREGISTROS"): "termoregistros",
        fuzzy_key("AC"): "ac_option",
        fuzzy_key("C/T"): "ct_option",
        fuzzy_key("VENT"): "ventilacion",
        fuzzy_key("T°"): "temperatura",
        fuzzy_key("HUMEDAD"): "humedad",
        fuzzy_key("FILTROS"): "filtros",
        fuzzy_key("HORA SOLICITADA (OPERADOR)"): "hora_solicitada_operador",
        fuzzy_key("FECHA SOLICITADA (OPERADOR)"): "fecha_solicitada_operador",
        fuzzy_key("FECHA REAL DE LLENADO"): "fecha_real_llenado",
        fuzzy_key("WEEK LLENADO"): "week_llenado",
        fuzzy_key("VARIEDAD"): "variedad",
        fuzzy_key("TIPO DE CAJA"): "tipo_caja",
        fuzzy_key("ETIQUETA CAJA"): "etiqueta_caja",
        fuzzy_key("PRESENTACIÓN"): "presentacion",
        fuzzy_key("CALIBRE"): "calibre",
        fuzzy_key("CJ/KG"): "cj_kg",
        fuzzy_key("TOTAL"): "total_unidades",
        fuzzy_key("TOTAL DE PALLET"): "total_pallet",
        fuzzy_key("TOTAL DE PALLETS"): "total_pallet",
        fuzzy_key("TOTAL PALLETS"): "total_pallet",
        fuzzy_key("INCOTERM"): "incoterm",
        fuzzy_key("FLETE"): "flete"
    }

    col_indices = {}
    matched_debug = {}
    for i, h in enumerate(processed_headers):
        if h in WHITELIST_MAP:
            f = WHITELIST_MAP[h]
            if f not in col_indices: 
                col_indices[f] = i
                matched_debug[f] = raw_headers[i]

    if "booking" not in col_indices:
        return {
            "ok": False, 
            "detail": "No se encontró la columna BOOKING",
            "headers_detected": processed_headers,
            "raw_headers": raw_headers
        }

    upserts = 0
    errors = []
    
    # 3. Procesar filas
    first_row_received = payload[1] if len(payload) > 1 else None
    for row_idx in range(1, len(payload)):
        row = payload[row_idx]
        if not row: continue
        
        # Booking index
        b_idx = col_indices["booking"]
        val_booking = str(row[b_idx] or "").strip()
        
        # LIMPIEZA ULTRA AGRESIVA
        # 1. Quitar cualquier cosa que no sea letra o número al final (espacios raros, saltos de línea)
        clean_booking = re.sub(r'[^A-Z0-9]+$', '', val_booking, flags=re.I)
        # 2. Quitar específicamente el sufijo L o AL si quedó (sin importar mayúsculas)
        clean_booking = re.sub(r'(AL|L)$', '', clean_booking, flags=re.I)
        
        booking = normalizar(clean_booking)
        
        if not booking or len(booking) < 3: 
            continue
        
        db_row = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
        if not db_row:
            # VALIDACIÓN: Solo crear si la fila trae algún dato útil aparte del booking
            # (Ignorar valores 'SIN CAMBIOS' o celdas vacías)
            has_useful_data = False
            for field, idx in col_indices.items():
                if field == "booking": continue
                val_raw = str(row[idx] or "").strip().upper()
                if val_raw and val_raw not in ["", "NULL", "SIN CAMBIOS", "0"]:
                    has_useful_data = True
                    break
            
            if not has_useful_data:
                continue # Saltar esta fila, no crear stub vacío
            
            db_row = RefPosicionamiento(booking=booking)
            db.add(db_row)
        
        # Mapear el resto de campos
        for field, idx in col_indices.items():
            if field == "booking": continue
            val = row[idx] if idx < len(row) else None
            
            if field in ["dias_tt_booking", "dias_tt_real", "total_pallet"]:
                try:
                    db_val = int(float(val)) if val not in [None, ""] else None
                    setattr(db_row, field, db_val)
                except: setattr(db_row, field, None)
            else:
                final_val = normalizar(str(val)) if val not in [None, ""] else None
                
                # REGLA ESPECIAL: SI ES CLIENTE Y TIENE GUION
                if field == "cliente" and final_val and "-" in final_val:
                    partes = [p.strip() for p in final_val.split("-", 1)]
                    setattr(db_row, "cliente", partes[0])
                    # Solo asigna al recibidor si el campo recibidor no viene ya en el excel
                    if "recibidor" not in col_indices and len(partes) > 1:
                        setattr(db_row, "recibidor", partes[1])
                else:
                    # Evitar sobreescribir si ya se asignó por la regla de arriba
                    if field == "recibidor" and getattr(db_row, "cliente", None) and "-" in str(row[col_indices.get("cliente", -1)] or ""):
                        # Si ya se asignó arriba por split, solo sobreescribe si el valor actual no es nulo
                        if final_val:
                            setattr(db_row, field, final_val)
                    else:
                        setattr(db_row, field, final_val)
        
        upserts += 1

    db.commit()
    return {
        "ok": True, 
        "upserts": upserts, 
        "version": "v1.3-deep-debug",
        "matched_columns": len(col_indices),
        "debug": {
            "first_row_received": first_row_received,
            "matched_mapping": matched_debug,
            "processed_headers": processed_headers,
            "raw_headers": raw_headers
        }
    }

@router.post("/dams")
def sync_dams(
    payload: Union[DamItem, List[DamItem]],
    db: Session = Depends(get_db),
    x_sync_token: str | None = Header(default=None),
):
    validar_token(x_sync_token)
    items = [payload] if isinstance(payload, DamItem) else payload
    upserts = 0
    for it in items:
        booking = normalizar(it.booking)
        if not booking: continue
        row = db.query(RefBookingDam).filter(RefBookingDam.booking == booking).first()
        if not row:
            row = RefBookingDam(booking=booking)
            db.add(row)
        row.awb = normalizar(it.awb)
        row.dam = normalizar(it.dam)
        upserts += 1
    db.commit()
    return {"ok": True, "upserts": upserts}
@router.post("/asignacion/raw")
def sync_asignacion_raw(
    payload: List[List[Union[str, int, float, None]]],
    db: Session = Depends(get_db),
    x_sync_token: str | None = Header(default=None),
):
    validar_token(x_sync_token)
    if not payload or len(payload) < 2:
        return {"ok": False, "detail": "Datos insuficientes"}

    try:
        # 1. Normalización de cabeceras (Fuzzy Matching)
        import re
        import traceback
        def fuzzy_key(h: str) -> str:
            return re.sub(r'[^A-Z0-9]', '', str(h or "").upper())

        raw_headers = payload[0]
        processed_headers = [fuzzy_key(h) for h in raw_headers]
        
        WHITELIST_MAP = {
            fuzzy_key("BOOKING"): "booking",
            fuzzy_key("DAM"): "dam",
            fuzzy_key("CONTENEDOR"): "contenedor",
            fuzzy_key("EMPRESA DE TRANSPORTE"): "transportista",
            fuzzy_key("EMPRESA DA TRANAPORTE"): "transportista",
            fuzzy_key("TRANSPORTISTA"): "transportista",
            fuzzy_key("RUC"): "ruc",
            fuzzy_key("CONDUCTOR"): "conductor",
            fuzzy_key("CHOFER"): "conductor",
            fuzzy_key("PLACAS"): "placas", # A veces la mandan combinada
            fuzzy_key("PLACA DE TRACTO"): "placa_tracto",
            fuzzy_key("PLACA TRACTO"): "placa_tracto",
            fuzzy_key("PLACA DA CARRETA"): "placa_carreta",   
            fuzzy_key("PLACA DE CARRETA"): "placa_carreta",   
            fuzzy_key("PLACA CARRETA"): "placa_carreta",   
            fuzzy_key("LICENCIA"): "licencia",
            fuzzy_key("DNI"): "licencia"
        }

        col_indices = {}
        for i, h in enumerate(processed_headers):
            if h in WHITELIST_MAP:
                f = WHITELIST_MAP[h]
                if f not in col_indices: 
                    col_indices[f] = i

        if "booking" not in col_indices:
            return {"ok": False, "detail": "No se encontró la columna BOOKING"}
            
        def format_chofer_name(raw_name: str) -> str:
            if not raw_name: return ""
            words = [w for w in raw_name.replace(',', ' ').split() if w]
            if len(words) == 0: return ""
            if len(words) == 1: return words[0].upper()
            if len(words) == 2: return f"{words[1]} {words[0]}".upper()
            # Asume ApellidoPaterno ApellidoMaterno Nombre1 [NombreN...] -> Ej: "SALCEDO QUISPE JOSE SANTOS"
            if len(words) >= 3:
                nombres = " ".join(words[2:])
                apellido_paterno = words[0]
                apellido_materno_inicial = words[1][0] + "."
                return f"{nombres} {apellido_paterno} {apellido_materno_inicial}".upper()

        upserts = 0
        for row_idx in range(1, len(payload)):
            row = payload[row_idx]
            if not row or len(row) <= max(col_indices.values(), default=-1): continue
            
            # Booking
            b_idx = col_indices["booking"]
            val_booking = str(row[b_idx] or "").strip()
            val_booking = re.sub(r'[^A-Z0-9]+$', '', val_booking, flags=re.I)
            val_booking = re.sub(r'(AL|L)$', '', val_booking, flags=re.I)
            booking = normalizar(val_booking)
            if not booking: continue

            # Posicionamiento (IMPORTANTE: Solo buscar, NO crear si no existe)
            posic = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()

            # DAM (Este sí se crea siempre para tener el registro de transporte)
            db_dam = db.query(RefBookingDam).filter(RefBookingDam.booking == booking).first()
            if not db_dam:
                db_dam = RefBookingDam(booking=booking)
                db.add(db_dam)

            # DAM Cleaning
            if "dam" in col_indices:
                raw_dam = str(row[col_indices["dam"]] or "").strip()
                clean_dam = re.sub(r'(40-)0+', r'\1', raw_dam)
                if clean_dam: db_dam.dam = clean_dam

            # Transportista
            t_id = None
            if "ruc" in col_indices or "transportista" in col_indices:
                idx_ruc = col_indices.get("ruc", -1)
                idx_trans = col_indices.get("transportista", -1)
                
                ruc = str(row[idx_ruc] or "").strip() if idx_ruc >= 0 and idx_ruc < len(row) else ""
                nombre_t = str(row[idx_trans] or "").strip().upper() if idx_trans >= 0 and idx_trans < len(row) else ""
                
                t = None
                if ruc:
                    t = db.query(Transportista).filter(Transportista.ruc == ruc).first()
                elif nombre_t:
                    t = db.query(Transportista).filter(Transportista.nombre_transportista == nombre_t).first()
                    
                if not t and (ruc or nombre_t):
                    fake_ruc = ruc if ruc else "S/RUC"
                    safe_name = nombre_t if nombre_t else "DESCONOCIDO"
                    t = Transportista(ruc=fake_ruc[:20], nombre_transportista=safe_name, codigo_sap=f"AUTO-{fake_ruc[:20]}")
                    db.add(t)
                    db.flush()
                
                if t:
                    t_id = t.id
                    db_dam.transportista = t.nombre_transportista

            # Licencia y Chofer
            if "licencia" in col_indices or "conductor" in col_indices:
                idx_lic = col_indices.get("licencia", -1)
                idx_cond = col_indices.get("conductor", -1)
                
                raw_lic = str(row[idx_lic] or "").strip().upper() if idx_lic >= 0 and idx_lic < len(row) else ""
                raw_cond = str(row[idx_cond] or "").strip() if idx_cond >= 0 and idx_cond < len(row) else ""
                
                dni = re.sub(r'[^\d]', '', raw_lic)
                
                if dni:
                    db_dam.licencia = dni # Esto alimenta el frontend DNI del chofer
                    
                formated_name = format_chofer_name(raw_cond)
                if formated_name:
                    db_dam.chofer = formated_name
                    
                if dni and formated_name:
                    c = db.query(Chofer).filter(Chofer.dni == dni).first()
                    if not c:
                        c = Chofer(dni=dni, nombre_chofer=formated_name, licencia=raw_lic)
                        db.add(c)
                        db.flush()

            # Placas
            clean_placas = ""
            tracto = ""
            carreta = ""

            if "placas" in col_indices:
                raw_placas = str(row[col_indices["placas"]] or "").strip().upper()
                clean_placas = re.sub(r'[^A-Z0-9/]', '', raw_placas)
                if clean_placas:
                    p_parts = clean_placas.split('/')
                    tracto = p_parts[0] if len(p_parts) > 0 else ""
                    carreta = p_parts[1] if len(p_parts) > 1 else None
            else:
                raw_t = str(row[col_indices.get("placa_tracto")] or "").strip().upper() if "placa_tracto" in col_indices else ""
                raw_c = str(row[col_indices.get("placa_carreta")] or "").strip().upper() if "placa_carreta" in col_indices else ""
                
                tracto = re.sub(r'[^A-Z0-9]', '', raw_t)
                carreta = re.sub(r'[^A-Z0-9]', '', raw_c) if raw_c else None
                
                if tracto:
                    clean_placas = tracto
                    if carreta:
                        clean_placas += f"/{carreta}"

            if clean_placas:
                db_dam.placas = clean_placas # Para autocompletar en el Frontend
                
                if tracto:
                    v = db.query(Vehiculo).filter(Vehiculo.placas == clean_placas).first()
                    if not v:
                        v = Vehiculo(
                            placas=clean_placas, placa_tracto=tracto[:20], placa_carreta=carreta[:20] if carreta else None,
                            transportista_id=t_id, largo_tracto=0, ancho_tracto=0, alto_tracto=0,
                            largo_carreta=0, ancho_carreta=0, alto_carreta=0,
                            configuracion_vehicular="T3/S3", peso_neto_tracto=0, peso_neto_carreta=0, peso_bruto_vehicular=48000
                        )
                        db.add(v)
                        db.flush()

            # Contenedor y Validacion (Solo si existe Posicionamiento previo)
            if "contenedor" in col_indices:
                cont_asignacion = normalizar(str(row[col_indices["contenedor"]] or "").strip())
                db_dam.ce_awb = cont_asignacion
                db_dam.awb = cont_asignacion
                
                if posic:
                    if posic.nro_fcl and cont_asignacion:
                        # Alerta si el contenedor del excel de posicionamiento difiere del de asignación
                        db_dam.alerta_discrepancia = int(posic.nro_fcl != cont_asignacion)
                    
                    if not posic.nro_fcl and cont_asignacion:
                        # Si posicionamiento no tenía contenedor, lo llenamos con el de asignación
                        posic.nro_fcl = cont_asignacion

            upserts += 1

        db.commit()
        return {"ok": True, "upserts": upserts}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}

@router.post("/posicionamiento/pedidos-pallets/raw")
def sync_pedidos_pallets_raw(
    payload: List[List[Union[str, int, float, None]]],
    db: Session = Depends(get_db),
    x_sync_token: str | None = Header(default=None),
):
    """
    Endpoint especializado para procesar el Excel 'Pedidos comerciales granada COPIA',
    sumar todos los pallets segmentados en distintas filas bajo una misma Orden Beta,
    e inyectarlos al Posicionamiento cruzando el número entero de la orden (EJ: '080' hace match con 'BGA080 L')
    """
    validar_token(x_sync_token)
    if not payload or len(payload) < 2:
        return {"ok": False, "detail": "Datos insuficientes en tabla PEDIDOS"}

    try:
        raw_headers = payload[0]
        processed_headers = [fuzzy_key(h) for h in raw_headers]

        col_orden = -1
        col_pallets = -1
        match_orden_str = ""
        match_pallets_str = ""

        for i, h in enumerate(processed_headers):
            if "ORDEN" in h and col_orden == -1: 
                col_orden = i
                match_orden_str = raw_headers[i]
            if "TOTAL" in h and "PALLET" in h and col_pallets == -1: 
                col_pallets = i
                match_pallets_str = raw_headers[i]

        if col_orden == -1 or col_pallets == -1:
            return {"ok": False, "detail": "Columnas ORDEN o PALLETS no encontradas en el Excel", "headers": processed_headers}

        import math
        from collections import defaultdict
        sumas = defaultdict(int)
        debug_filas_anomalas = []

        # 1. Agrupar y sumar matemáticamente todas las filas de la misma ORDEN
        for row in payload[1:]:
            if not row or len(row) <= max(col_orden, col_pallets): continue
            
            val_orden = str(row[col_orden] or "").strip()
            val_pallets = str(row[col_pallets] or "").strip()

            if not val_orden: continue

            # Extraer puramente la parte numérica
            solo_nums = re.sub(r'\D', '', val_orden)
            clean_pallets = re.sub(r'[^\d\.]', '', val_pallets)

            if not solo_nums or not clean_pallets: 
                # Guardar en debug si falló al aislar y valia algo
                if val_orden or val_pallets:
                    if len(debug_filas_anomalas) < 10:
                        debug_filas_anomalas.append({"orden": val_orden, "pallets": val_pallets})
                continue

            try:
                qty = int(math.ceil(float(clean_pallets)))
                sumas[int(solo_nums)] += qty
            except Exception as e:
                if len(debug_filas_anomalas) < 10:
                    debug_filas_anomalas.append({"error": str(e), "val": clean_pallets})

        upserts = 0
        todos_pos = db.query(RefPosicionamiento).all()
        
        # 2. Distribuir a la base de datos general
        for pos in todos_pos:
            # Juntar toda la "basura" de las ordenes beta del posicionamiento (Ej: "BGA080 L  null")
            text_eval = f"{pos.o_beta_inicial} {pos.orden_beta_final} {pos.status_beta_text} {pos.booking}".upper()
            
            # Extraer un arreglo de todos los numeros puros hallados en esta fila de base de datos
            db_nums_strings = re.findall(r'\d+', text_eval)
            db_num_ints = [int(n) for n in db_nums_strings if n]
            
            # 3. Intersectar base de datos numerica vs sumatoria del Excel de hoy
            for numero_orden, total_pallets in sumas.items():
                if numero_orden in db_num_ints:
                    # Si el posicionamiento tiene el "080", inyectamos la sumatoria aquí
                    pos.total_pallet = total_pallets
                    upserts += 1
                    break # Rompemos el ciclo interno, analizamos la siguiente linea DB
        
        db.commit()
        return {
            "ok": True, 
            "upserts": upserts, 
            "sumatoria_calculada": sumas, 
            "diagnostico_columnas": {"col_orden": match_orden_str, "col_pallets": match_pallets_str},
            "filas_anomalas": debug_filas_anomalas
        }
    
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
