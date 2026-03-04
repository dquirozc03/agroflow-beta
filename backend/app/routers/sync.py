from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
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

def to_bool(v: any) -> bool:
    if isinstance(v, bool):
        return v
    if v is None:
        return False
    s = str(v).upper().strip()
    return s in ("SI", "S", "YES", "1", "TRUE", "VERDADERO")

def validar_token(x_sync_token: str | None):
    if not x_sync_token or x_sync_token != settings.SYNC_TOKEN:
        raise HTTPException(status_code=401, detail="Token de sync inválido")

class DamItem(BaseModel):
    booking: str
    awb: Optional[str] = None
    dam: Optional[str] = None

from pydantic import BaseModel, Field

class PosicionamientoItem(BaseModel):
    booking: str = Field(alias="BOOKING")
    status_fcl: Optional[str] = Field(None, alias="Semaforización")
    orden_beta_final: Optional[str] = Field(None, alias="O/BETA FINAL")
    planta_empacadora: Optional[str] = Field(None, alias="PLANTA EMPACADORA")
    cultivo: Optional[str] = Field(None, alias="CULTIVO")
    
    booking_limpio: Optional[str] = Field(None, alias="BOOKING LIMPIO")
    nave: Optional[str] = Field(None, alias="NAVE")
    
    etd_booking: Optional[str] = Field(None, alias="ETD (BOOKING)")
    eta_booking: Optional[str] = Field(None, alias="ETA (BOOKING)")
    week_eta_booking: Optional[str] = Field(None, alias="WEEK ETA (BOOKING)")
    dias_tt_booking: Optional[int] = Field(None, alias="DIAS TT (BOOKING)")
    
    etd_final: Optional[str] = Field(None, alias="ETD FINAL")
    eta_final: Optional[str] = Field(None, alias="ETA FINAL")
    week_eta_real: Optional[str] = Field(None, alias="WEEK ETA REAL")
    dias_tt_real: Optional[int] = Field(None, alias="DIAS TT REAL")
    week_debe_arribar: Optional[str] = Field(None, alias="WEEK DEBE ARRIBAR")
    pol: Optional[str] = Field(None, alias="POL")
    
    o_beta_inicial: Optional[str] = Field(None, alias="O/BETA INICIAL")
    o_beta_cambio_1: Optional[str] = Field(None, alias="O/BETA CAMBIO 1")
    motivo_cambio_1: Optional[str] = Field(None, alias="MOTIVO CAMBIO 1")
    o_beta_cambio_2: Optional[str] = Field(None, alias="O/BETA CAMBIO 2")
    motivo_cambio_2: Optional[str] = Field(None, alias="MOTIVO CAMBIO 2")
    area_responsable: Optional[str] = Field(None, alias="AREA RESPONSABLE")
    
    detalle_adicional: Optional[str] = Field(None, alias="DETALLE ADICIONAL")
    deposito_vacio: Optional[str] = Field(None, alias="DEPOSITO VACIO")
    nro_contenedor: Optional[str] = Field(None, alias="NRO CONTENEDOR")
    tipo_contenedor: Optional[str] = Field(None, alias="TIPO CONTENEDOR")
    
    awb: Optional[str] = Field(None, alias="AWB")

    model_config = {
        "populate_by_name": True
    }

@router.post("/posicionamiento")
def sync_posicionamiento(
    payload: Union[PosicionamientoItem, List[PosicionamientoItem]],
    db: Session = Depends(get_db),
    x_sync_token: str | None = Header(default=None),
):
    validar_token(x_sync_token)

    # Convertir a lista si es un solo objeto
    items = [payload] if isinstance(payload, PosicionamientoItem) else payload

    upserts = 0
    for it in items:
        booking = normalizar(it.booking)
        if not booking:
            continue

        row = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
        if not row:
            row = RefPosicionamiento(booking=booking)
            db.add(row)
        
        row.booking_limpio = normalizar(it.booking_limpio)
        row.nave = normalizar(it.nave)
        
        row.status_fcl = normalizar(it.status_fcl)
        row.orden_beta_final = normalizar(it.orden_beta_final)
        row.planta_empacadora = normalizar(it.planta_empacadora)
        row.cultivo = normalizar(it.cultivo)
        
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
        
        row.detalle_adicional = normalizar(it.detalle_adicional)
        row.deposito_vacio = normalizar(it.deposito_vacio)
        row.nro_contenedor = normalizar(it.nro_contenedor)
        row.tipo_contenedor = normalizar(it.tipo_contenedor)
        
        row.awb = normalizar(it.awb)
        
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

    # Convertir a lista si es un solo objeto
    items = [payload] if isinstance(payload, DamItem) else payload

    upserts = 0
    for it in items:
        booking = normalizar(it.booking)
        if not booking:
            continue

        row = db.query(RefBookingDam).filter(RefBookingDam.booking == booking).first()
        if not row:
            row = RefBookingDam(booking=booking)
            db.add(row)
            
        row.awb = normalizar(it.awb)
        row.dam = normalizar(it.dam)
        upserts += 1

    db.commit()
    return {"ok": True, "upserts": upserts}
