from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Union
from sqlalchemy.orm import Session

from app.database import get_db
from app.configuracion import settings
from app.models.ref_posicionamiento import RefPosicionamiento
from app.models.ref_booking_dam import RefBookingDam

router = APIRouter(prefix="/api/v1/sync", tags=["Sync"])

def normalizar(v: str | None) -> str | None:
    if v is None:
        return None
    v = " ".join(v.strip().split()).upper()
    return v or None

def validar_token(x_sync_token: str | None):
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN:
        raise HTTPException(status_code=401, detail="Token de sync inválido")

class DamItem(BaseModel):
    booking: str
    awb: Optional[str] = None
    dam: Optional[str] = None

class PosicionamientoItem(BaseModel):
    # Identificación
    booking: str = Field(alias="BOOKING")
    nro_item: Optional[str] = Field(None, alias="N°")
    booking_limpio: Optional[str] = Field(None, alias="BOOKING LIMPIO")
    status_fcl: Optional[str] = Field(None, alias="Semaforización")
    nave: Optional[str] = Field(None, alias="NAVE")
    orden_beta_final: Optional[str] = Field(None, alias="O/BETA FINAL")
    status_beta_text: Optional[str] = Field(None, alias="O/BETA (STATUS FINAL)")
    planta_empacadora: Optional[str] = Field(None, alias="PLANTA EMPACADORA")
    cultivo: Optional[str] = Field(None, alias="CULTIVO")
    
    # Cliente y Destino
    cliente: Optional[str] = Field(None, alias="CLIENTE")
    recibidor: Optional[str] = Field(None, alias="RECIBIDOR")
    destino_pedido: Optional[str] = Field(None, alias="DESTINO (PEDIDO)")
    po_number: Optional[str] = Field(None, alias="PO")
    destino_booking: Optional[str] = Field(None, alias="DESTINO (BOOKING)")
    pais_booking: Optional[str] = Field(None, alias="PAIS (BOOKING)")
    
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
    
    # Historial de Cambios
    o_beta_inicial: Optional[str] = Field(None, alias="O/BETA INICIAL")
    o_beta_cambio_1: Optional[str] = Field(None, alias="O/BETA CAMBIO 1")
    motivo_cambio_1: Optional[str] = Field(None, alias="MOTIVO CAMBIO 1")
    o_beta_cambio_2: Optional[str] = Field(None, alias="O/BETA CAMBIO 2")
    motivo_cambio_2: Optional[str] = Field(None, alias="MOTIVO CAMBIO 2")
    area_responsable: Optional[str] = Field(None, alias="ÁREA RESPONSABLE CAMBIO DE O/BETA")
    
    # Contenedor
    nro_fcl: Optional[str] = Field(None, alias="N° FCL")
    nro_fcl_seguridad: Optional[str] = Field(None, alias="N° FCL-SEGURIDAD")
    deposito_retiro: Optional[str] = Field(None, alias="DEPOT DE RETIRO")
    operador: Optional[str] = Field(None, alias="OPERADOR")
    naviera: Optional[str] = Field(None, alias="NAVIERA")
    detalle_adicional_equipo: Optional[str] = Field(None, alias="DETALLE ADICIONAL")
    
    # Parámetros Carga
    termoregistros: Optional[str] = Field(None, alias="TERMOREGISTROS")
    termos_verif: Optional[str] = Field(None, alias="TERMOS/VERIF")
    ac_option: Optional[str] = Field(None, alias="AC")
    ct_option: Optional[str] = Field(None, alias="C/T")
    ventilacion: Optional[str] = Field(None, alias="VENT")
    temperatura: Optional[str] = Field(None, alias="T°")
    motivo_cambio_parametros: Optional[str] = Field(None, alias="MOTIVO CAMB. PARÁMETROS")
    aforo_en_planta: Optional[str] = Field(None, alias="AFORO EN PLANTA")
    
    # Producción
    fecha_solicitada_produccion: Optional[str] = Field(None, alias="FECHA SOLICITADA (PRODUCCIÓN)")
    hora_solicitada_produccion: Optional[str] = Field(None, alias="HORA SOLICITADA (PRODUCCIÓN)")
    fecha_solicitada_operador: Optional[str] = Field(None, alias="FECHA SOLICITADA (OPERADOR)")
    hora_solicitada_operador: Optional[str] = Field(None, alias="HORA SOLICITADA (OPERADOR)")
    fecha_real_llenado: Optional[str] = Field(None, alias="FECHA REAL DE LLENADO")
    week_llenado: Optional[str] = Field(None, alias="WEEK LLENADO")
    
    # Mercadería
    variedad: Optional[str] = Field(None, alias="VARIEDAD")
    tipo_caja: Optional[str] = Field(None, alias="TIPO DE CAJA")
    etiqueta_caja: Optional[str] = Field(None, alias="ETIQUETA CAJA")
    presentacion: Optional[str] = Field(None, alias="PRESENTACIÓN")
    calibre: Optional[str] = Field(None, alias="CALIBRE")
    cj_kg: Optional[str] = Field(None, alias="CJ/KG")
    total_unidades: Optional[str] = Field(None, alias="TOTAL")
    
    # Logística
    incoterm: Optional[str] = Field(None, alias="INCOTERM")
    flete: Optional[str] = Field(None, alias="FLETE")
    confirmacion_operador: Optional[str] = Field(None, alias="CONFIRMACIÓN OPERADOR")
    detalle_confirmacion_operador: Optional[str] = Field(None, alias="DETALLE DE LA CONFIRMACIÓN (OPERADOR)")
    rezagado: Optional[str] = Field(None, alias="REZAGADO")
    motivos_rezagado: Optional[str] = Field(None, alias="MOTIVOS DE REZAGADO")
    fecha_vgm: Optional[str] = Field(None, alias="FECHA VGM")
    hora_vgm: Optional[str] = Field(None, alias="HORA VGM")
    fecha_cut_off: Optional[str] = Field(None, alias="FECHA CUT OFF")
    hora_cut_off: Optional[str] = Field(None, alias="HORA CUT OFF")
    fecha_lar: Optional[str] = Field(None, alias="FECHA LAR")
    hora_lar: Optional[str] = Field(None, alias="HORA LAR")
    awb_master: Optional[str] = Field(None, alias="AWB")

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
        
        # Mapeo Masivo
        row.nro_item = normalizar(it.nro_item)
        row.booking_limpio = normalizar(it.booking_limpio)
        row.status_fcl = normalizar(it.status_fcl)
        row.nave = normalizar(it.nave)
        row.orden_beta_final = normalizar(it.orden_beta_final)
        row.status_beta_text = normalizar(it.status_beta_text)
        row.planta_empacadora = normalizar(it.planta_empacadora)
        row.cultivo = normalizar(it.cultivo)
        
        row.cliente = normalizar(it.cliente)
        row.recibidor = normalizar(it.recibidor)
        row.destino_pedido = normalizar(it.destino_pedido)
        row.po_number = normalizar(it.po_number)
        row.destino_booking = normalizar(it.destino_booking)
        row.pais_booking = normalizar(it.pais_booking)
        
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
        row.o_beta_cambio_1 = normalizar(it.o_beta_cambio_1)
        row.motivo_cambio_1 = normalizar(it.motivo_cambio_1)
        row.o_beta_cambio_2 = normalizar(it.o_beta_cambio_2)
        row.motivo_cambio_2 = normalizar(it.motivo_cambio_2)
        row.area_responsable = normalizar(it.area_responsable)
        
        row.nro_fcl = normalizar(it.nro_fcl)
        row.nro_fcl_seguridad = normalizar(it.nro_fcl_seguridad)
        row.deposito_retiro = normalizar(it.deposito_retiro)
        row.operador = normalizar(it.operador)
        row.naviera = normalizar(it.naviera)
        row.detalle_adicional_equipo = normalizar(it.detalle_adicional_equipo)
        
        row.termoregistros = normalizar(it.termoregistros)
        row.termos_verif = normalizar(it.termos_verif)
        row.ac_option = normalizar(it.ac_option)
        row.ct_option = normalizar(it.ct_option)
        row.ventilacion = normalizar(it.ventilacion)
        row.temperatura = normalizar(it.temperatura)
        row.motivo_cambio_parametros = normalizar(it.motivo_cambio_parametros)
        row.aforo_en_planta = normalizar(it.aforo_en_planta)
        
        row.fecha_solicitada_produccion = normalizar(it.fecha_solicitada_produccion)
        row.hora_solicitada_produccion = normalizar(it.hora_solicitada_produccion)
        row.fecha_solicitada_operador = normalizar(it.fecha_solicitada_operador)
        row.hora_solicitada_operador = normalizar(it.hora_solicitada_operador)
        row.fecha_real_llenado = normalizar(it.fecha_real_llenado)
        row.week_llenado = normalizar(it.week_llenado)
        
        row.variedad = normalizar(it.variedad)
        row.tipo_caja = normalizar(it.tipo_caja)
        row.etiqueta_caja = normalizar(it.etiqueta_caja)
        row.presentacion = normalizar(it.presentacion)
        row.calibre = normalizar(it.calibre)
        row.cj_kg = normalizar(it.cj_kg)
        row.total_unidades = normalizar(it.total_unidades)
        
        row.incoterm = normalizar(it.incoterm)
        row.flete = normalizar(it.flete)
        row.confirmacion_operador = normalizar(it.confirmacion_operador)
        row.detalle_confirmacion_operador = normalizar(it.detalle_confirmacion_operador)
        row.rezagado = normalizar(it.rezagado)
        row.motivos_rezagado = normalizar(it.motivos_rezagado)
        row.fecha_vgm = normalizar(it.fecha_vgm)
        row.hora_vgm = normalizar(it.hora_vgm)
        row.fecha_cut_off = normalizar(it.fecha_cut_off)
        row.hora_cut_off = normalizar(it.hora_cut_off)
        row.fecha_lar = normalizar(it.fecha_lar)
        row.hora_lar = normalizar(it.hora_lar)
        row.awb_master = normalizar(it.awb_master)
        
        upserts += 1

    db.commit()
    return {"ok": True, "upserts": upserts}

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
