from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import func
import re

from app.database import get_db
from app.utils.unicidad import format_container_number
from app.configuracion import settings
from app.models.ref_posicionamiento import RefPosicionamiento
from app.models.ref_booking_dam import RefBookingDam
from app.models.catalogos import Transportista, Vehiculo, Chofer
from app.models.packing_ogl import CuadroPedido

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
    repls = {"Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", "Ñ": "N"}
    for k, v in repls.items():
        h = h.replace(k, v)
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
    booking: str = Field(alias="BOOKING")
    status_fcl: Optional[str] = Field(None, alias="STATUS - FCL")
    status_beta_text: Optional[str] = Field(None, alias="O/BETA (STATUS FINAL)")
    planta_empacadora: Optional[str] = Field(None, alias="PLT. EMPACADORA")
    cultivo: Optional[str] = Field(None, alias="CULTIVO")
    nave: Optional[str] = Field(None, alias="NAVE")
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
    o_beta_inicial: Optional[str] = Field(None, alias="O/BETA INICIAL")
    orden_beta_final: Optional[str] = Field(None, alias="O/BETA FINAL")
    cliente: Optional[str] = Field(None, alias="CLIENTE")
    recibidor: Optional[str] = Field(None, alias="RECIBIDOR")
    destino_pedido: Optional[str] = Field(None, alias="DESTINO (PEDIDO)")
    po_number: Optional[str] = Field(None, alias="PO")
    destino_booking: Optional[str] = Field(None, alias="DESTINO (BOOKING)")
    pais_booking: Optional[str] = Field(None, alias="PAIS (BOOKING)")
    nro_fcl: Optional[str] = Field(None, alias="N° FCL")
    deposito_retiro: Optional[str] = Field(None, alias="DEPOT DE RETIRO")
    operador: Optional[str] = Field(None, alias="OPERADOR")
    naviera: Optional[str] = Field(None, alias="NAVIERA")
    termoregistros: Optional[str] = Field(None, alias="TERMOREGISTROS")
    ac_option: Optional[str] = Field(None, alias="AC")
    ct_option: Optional[str] = Field(None, alias="C/T")
    ventilacion: Optional[str] = Field(None, alias="VENT")
    temperatura: Optional[str] = Field(None, alias="T°")
    humedad: Optional[str] = Field(None, alias="HUMEDAD")
    filtros: Optional[str] = Field(None, alias="FILTROS")
    hora_solicitada_operador: Optional[str] = Field(None, alias="HORA SOLICITADA (OPERADOR)")
    fecha_solicitada_operador: Optional[str] = Field(None, alias="FECHA SOLICITADA (OPERADOR)")
    fecha_real_llenado: Optional[str] = Field(None, alias="FECHA REAL DE LLENADO")
    week_llenado: Optional[str] = Field(None, alias="WEEK LLENADO")
    variedad: Optional[str] = Field(None, alias="VARIEDAD")
    tipo_caja: Optional[str] = Field(None, alias="TIPO DE CAJA")
    etiqueta_caja: Optional[str] = Field(None, alias="ETIQUETA CAJA")
    presentacion: Optional[str] = Field(None, alias="PRESENTACIÓN")
    calibre: Optional[str] = Field(None, alias="CALIBRE")
    cj_kg: Optional[str] = Field(None, alias="CJ/KG")
    total_unidades: Optional[int] = Field(None, alias="TOTAL")
    total_pallet: Optional[int] = Field(None, alias="TOTAL DE PALLETS")
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
        
        cliente_ref = normalizar(it.cliente)
        recibidor_ref = normalizar(it.recibidor)
        if cliente_ref and "-" in cliente_ref:
            partes = [p.strip() for p in cliente_ref.split("-", 1)]
            row.cliente = partes[0]
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
        row.nro_fcl = format_container_number(it.nro_fcl)
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
    for i, h in enumerate(processed_headers):
        if h in WHITELIST_MAP:
            f = WHITELIST_MAP[h]
            if f not in col_indices: col_indices[f] = i
    if "booking" not in col_indices:
        return {"ok": False, "detail": "No se encontró BOOKING"}
    upserts = 0
    for row_idx in range(1, len(payload)):
        row = payload[row_idx]
        if not row: continue
        val_booking = str(row[col_indices["booking"]] or "").strip()
        clean_booking = re.sub(r'[^A-Z0-9]+$', '', val_booking, flags=re.I)
        clean_booking = re.sub(r'(AL|L)$', '', clean_booking, flags=re.I)
        booking = normalizar(clean_booking)
        if not booking or len(booking) < 3: continue
        db_row = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
        if not db_row:
            db_row = RefPosicionamiento(booking=booking)
            db.add(db_row)
        for field, idx in col_indices.items():
            if field == "booking": continue
            val = row[idx] if idx < len(row) else None
            if field in ["dias_tt_booking", "dias_tt_real", "total_pallet"]:
                try: setattr(db_row, field, int(float(val)))
                except: pass
            else:
                setattr(db_row, field, normalizar(str(val)) if val not in [None, ""] else None)
    db.commit()
    return {"ok": True, "upserts": upserts}

@router.post("/dams")
def sync_dams(payload: Union[DamItem, List[DamItem]], db: Session = Depends(get_db), x_sync_token: str | None = Header(default=None)):
    validar_token(x_sync_token)
    items = [payload] if isinstance(payload, DamItem) else payload
    upserts = 0
    for it in items:
        booking = normalizar(it.booking)
        if not booking: continue
        row = db.query(RefBookingDam).filter(RefBookingDam.booking == booking).first()
        if not row: row = RefBookingDam(booking=booking); db.add(row)
        row.awb = normalizar(it.awb); row.dam = normalizar(it.dam)
        upserts += 1
    db.commit()
    return {"ok": True, "upserts": upserts}

@router.post("/asignacion/raw")
def sync_asignacion_raw(payload: List[List[Union[str, int, float, None]]], db: Session = Depends(get_db), x_sync_token: str | None = Header(default=None)):
    validar_token(x_sync_token)
    if not payload or len(payload) < 2: return {"ok": False, "detail": "Datos insuficientes"}
    try:
        raw_headers = payload[0]
        processed_headers = [fuzzy_key(h) for h in raw_headers]
        WHITELIST_MAP = {
            fuzzy_key("BOOKING"): "booking", fuzzy_key("DAM"): "dam", fuzzy_key("CONTENEDOR"): "contenedor",
            fuzzy_key("EMPRESA DE TRANSPORTE"): "transportista", fuzzy_key("RUC"): "ruc", fuzzy_key("CHOFER"): "conductor",
            fuzzy_key("PLACA DE TRACTO"): "placa_tracto", fuzzy_key("PLACA DE CARRETA"): "placa_carreta", fuzzy_key("LICENCIA"): "licencia"
        }
        col_indices = {WHITELIST_MAP[h]: i for i, h in enumerate(processed_headers) if h in WHITELIST_MAP}
        if "booking" not in col_indices: return {"ok": False, "detail": "No se encontró BOOKING"}
        
        upserts = 0
        for row in payload[1:]:
            if not row or len(row) <= col_indices["booking"]: continue
            booking = normalizar(str(row[col_indices["booking"]] or "").strip())
            if not booking: continue
            
            # --- 1. DAM y Contenedor ---
            posic = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
            db_dam = db.query(RefBookingDam).filter(RefBookingDam.booking == booking).first()
            if not db_dam:
                db_dam = RefBookingDam(booking=booking)
                db.add(db_dam)
            
            if "dam" in col_indices:
                db_dam.dam = normalizar(str(row[col_indices["dam"]] or "").strip())
            
            if "contenedor" in col_indices:
                val_cont = str(row[col_indices["contenedor"]] or "").strip()
                cont = format_container_number(val_cont)
                if cont:
                    db_dam.awb = cont
                    if posic:
                        if posic.nro_fcl and posic.nro_fcl != cont:
                            # Opcional: Log discrepancia
                            pass
                        posic.nro_fcl = cont

            # --- 2. Transportista ---
            t_id = None
            ruc_val = normalizar(str(row[col_indices["ruc"]] or "").strip()) if "ruc" in col_indices else None
            nom_trans = normalizar(str(row[col_indices["transportista"]] or "").strip()) if "transportista" in col_indices else None
            
            if ruc_val or nom_trans:
                trans = None
                if ruc_val: trans = db.query(Transportista).filter(Transportista.ruc == ruc_val).first()
                if not trans and nom_trans: trans = db.query(Transportista).filter(Transportista.razon_social == nom_trans).first()
                if not trans and nom_trans:
                    trans = Transportista(razon_social=nom_trans, ruc=ruc_val)
                    db.add(trans); db.flush()
                if trans: t_id = trans.id

            # --- 3. Chofer ---
            c_id = None
            cond_val = str(row[col_indices["conductor"]] or "").strip() if "conductor" in col_indices else ""
            lic_val = normalizar(str(row[col_indices["licencia"]] or "").strip()) if "licencia" in col_indices else None
            
            if cond_val:
                dni = re.search(r'\d{8,}', cond_val)
                dni_val = dni.group(0) if dni else None
                nombres_raw = re.sub(r'\d+', '', cond_val).replace('-', '').strip()
                
                chof = None
                if dni_val: chof = db.query(Chofer).filter(Chofer.dni == dni_val).first()
                if not chof and lic_val: chof = db.query(Chofer).filter(func.upper(Chofer.licencia) == lic_val.upper()).first()
                
                if not chof and nombres_raw:
                    chof = Chofer(nombre_completo=nombres_raw, dni=dni_val, licencia=lic_val)
                    db.add(chof); db.flush()
                if chof:
                    if lic_val: chof.licencia = lic_val
                    c_id = chof.id

            # --- 4. Vehículo ---
            v_id = None
            p_tracto = normalizar(str(row[col_indices["placa_tracto"]] or "").strip()) if "placa_tracto" in col_indices else None
            p_carreta = normalizar(str(row[col_indices["placa_carreta"]] or "").strip()) if "placa_carreta" in col_indices else None
            
            if p_tracto:
                clean_p = re.sub(r'[^A-Z0-9]', '', p_tracto)
                veh = db.query(Vehiculo).filter(Vehiculo.placas == clean_p).first()
                if not veh:
                    veh = Vehiculo(placas=clean_p, tipo="TRACTO")
                    db.add(veh); db.flush()
                veh.placa_carreta = p_carreta
                v_id = veh.id

            # Vincular a la DAM
            if t_id: db_dam.transportista_id = t_id
            if c_id: db_dam.chofer_id = c_id
            if v_id: db_dam.vehiculo_id = v_id
                
            upserts += 1
        db.commit()
        return {"ok": True, "upserts": upserts}
    except Exception as e: 
        db.rollback()
        import traceback
        print(traceback.format_exc())
        return {"ok": False, "error": str(e)}

@router.post("/posicionamiento/pedidos-pallets/raw")
def sync_pedidos_pallets_raw(payload: List[List[Union[str, int, float, None]]], db: Session = Depends(get_db), x_sync_token: str | None = Header(default=None)):
    validar_token(x_sync_token)
    if not payload or len(payload) < 2: return {"ok": False, "detail": "Datos insuficientes"}
    try:
        raw_headers = payload[0]
        processed_headers = [fuzzy_key(h) for h in raw_headers]
        col_map = {"orden": -1, "pallets": -1, "product": -1, "peso_caja": -1, "house_gln": -1, "cajas_por_pallet": -1, "carton_content": -1, "notes": -1}
        for i, h in enumerate(processed_headers):
            if "ORDEN" == h: col_map["orden"] = i
            if "TOTAL" in h and "PALLET" in h: col_map["pallets"] = i
            if "PRODUCT" in h: col_map["product"] = i
            if "PESO" in h and "CAJA" in h: col_map["peso_caja"] = i
            if "HOUSEGLN" in h: col_map["house_gln"] = i
            if "CAJAPORPALLET" in h or "CAJAPORPALET" in h or "CAJAPALLET" in h: col_map["cajas_por_pallet"] = i
            if (("TIPO" in h and "CAJA" in h) or "CARTONCONTENT" in h): col_map["carton_content"] = i
            if ("ADDITIONAL" in h or "NOTES" in h): col_map["notes"] = i
        if col_map["orden"] == -1: return {"ok": False, "detail": "Columna ORDEN no encontrada"}
        import math
        from collections import defaultdict
        sumas_pallets = defaultdict(int)
        meta_por_orden = {}
        for row in payload[1:]:
            if not row or len(row) <= col_map["orden"]: continue
            val_orden_raw = str(row[col_map["orden"]] or "").strip()
            solo_nums = re.sub(r'\D', '', val_orden_raw)
            if not solo_nums: continue
            num_orden = int(solo_nums)
            if col_map["pallets"] != -1 and col_map["pallets"] < len(row):
                try: sumas_pallets[num_orden] += int(math.ceil(float(re.sub(r'[^\d\.]', '', str(row[col_map["pallets"]])))))
                except: pass
            if num_orden not in meta_por_orden:
                def get_v(key): 
                    idx = col_map[key]
                    return row[idx] if idx != -1 and idx < len(row) else None
                meta_por_orden[num_orden] = {
                    "orden_beta": f"BAM-{str(num_orden).zfill(3)}",
                    "product": get_v("product"), "peso_caja": get_v("peso_caja"),
                    "house_gln": get_v("house_gln"), "cajas_por_pallet": get_v("cajas_por_pallet"),
                    "carton_content": get_v("carton_content"), "additional_info": get_v("notes")
                }
        upserts_pos = 0
        todos_pos = db.query(RefPosicionamiento).all()
        for pos in todos_pos:
            text_eval = f"{pos.o_beta_inicial} {pos.orden_beta_final} {pos.booking}".upper()
            db_nums = [int(n) for n in re.findall(r'\d+', text_eval) if n]
            for num, qty in sumas_pallets.items():
                if num in db_nums: pos.total_pallet = qty; upserts_pos += 1; break
        upserts_cuadro = 0
        for num, data in meta_por_orden.items():
            cp = db.query(CuadroPedido).filter(CuadroPedido.orden_beta == data["orden_beta"]).first()
            if not cp: cp = CuadroPedido(orden_beta=data["orden_beta"]); db.add(cp)
            cp.product = str(data["product"]) if data["product"] else None
            try: cp.peso_caja = float(data["peso_caja"])
            except: pass
            cp.house_gln = str(data["house_gln"]) if data["house_gln"] else None
            try: cp.cajas_por_pallet = int(float(data["cajas_por_pallet"]))
            except: pass
            cp.carton_content = str(data["carton_content"]) if data["carton_content"] else None
            cp.additional_info = str(data["additional_info"]) if data["additional_info"] else None
            upserts_cuadro += 1
        db.commit()
        return {"ok": True, "posicionamiento_updated": upserts_pos, "cuadro_pedidos_synced": upserts_cuadro}
    except Exception as e: db.rollback(); return {"ok": False, "error": str(e)}
