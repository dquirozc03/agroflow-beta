from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
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
    dam: str

class PosicionamientoItem(BaseModel):
    booking: str
    etd: Optional[str] = None
    eta: Optional[str] = None
    week_eta: Optional[str] = None
    dias_tt: Optional[int] = None
    wk_debe_arribar: Optional[str] = None
    
    nave: Optional[str] = None
    pol: Optional[str] = None
    o_beta: Optional[str] = None
    cliente: Optional[str] = None
    pod: Optional[str] = None
    po_number: Optional[str] = None
    
    aforo_planta: Optional[bool] = False
    termog: Optional[str] = None
    temperatura: Optional[str] = None
    ventilacion: Optional[str] = None
    flete: Optional[str] = None
    operador_logistico: Optional[str] = None
    naviera: Optional[str] = None

    ac_option: Optional[bool] = False
    ct_option: Optional[bool] = False

    fecha_llenado: Optional[str] = None
    hora_posicionamiento: Optional[str] = None
    planta_llenado: Optional[str] = None
    
    cultivo: Optional[str] = None
    tipo_caja: Optional[str] = None
    etiqueta: Optional[str] = None
    presentacion: Optional[str] = None
    cj_kg: Optional[str] = None
    total: Optional[str] = None

    es_reprogramado: Optional[bool] = False
    awb: Optional[str] = None


@router.post("/posicionamiento")
def sync_posicionamiento(
    items: List[PosicionamientoItem],
    db: Session = Depends(get_db),
    x_sync_token: str | None = Header(default=None),
):
    validar_token(x_sync_token)

    upserts = 0
    for it in items:
        booking = normalizar(it.booking)
        if not booking:
            continue

        row = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
        if not row:
            row = RefPosicionamiento(booking=booking)
            db.add(row)
        
        row.etd = normalizar(it.etd)
        row.eta = normalizar(it.eta)
        row.week_eta = normalizar(it.week_eta)
        row.dias_tt = it.dias_tt
        row.wk_debe_arribar = normalizar(it.wk_debe_arribar)
        
        row.nave = normalizar(it.nave)
        row.pol = normalizar(it.pol)
        row.o_beta = normalizar(it.o_beta)
        row.cliente = normalizar(it.cliente)
        row.pod = normalizar(it.pod)
        row.po_number = normalizar(it.po_number)
        
        row.aforo_planta = 1 if it.aforo_planta else 0
        row.termog = normalizar(it.termog)
        row.temperatura = normalizar(it.temperatura)
        row.ventilacion = normalizar(it.ventilacion)
        row.flete = normalizar(it.flete)
        row.operador_logistico = normalizar(it.operador_logistico)
        row.naviera = normalizar(it.naviera)

        row.ac_option = 1 if it.ac_option else 0
        row.ct_option = 1 if it.ct_option else 0

        row.fecha_llenado = normalizar(it.fecha_llenado)
        row.hora_posicionamiento = normalizar(it.hora_posicionamiento)
        row.planta_llenado = normalizar(it.planta_llenado)
        
        row.cultivo = normalizar(it.cultivo)
        row.tipo_caja = normalizar(it.tipo_caja)
        row.etiqueta = normalizar(it.etiqueta)
        row.presentacion = normalizar(it.presentacion)
        row.cj_kg = normalizar(it.cj_kg)
        row.total = normalizar(it.total)

        row.es_reprogramado = 1 if it.es_reprogramado else 0
        row.awb = normalizar(it.awb)
        
        upserts += 1

    db.commit()
    return {"ok": True, "upserts": upserts}


@router.post("/dams")
def sync_dams(
    items: List[DamItem],
    db: Session = Depends(get_db),
    x_sync_token: str | None = Header(default=None),
):
    validar_token(x_sync_token)

    upserts = 0
    for it in items:
        booking = normalizar(it.booking)
        awb = normalizar(it.awb)
        dam = normalizar(it.dam)
        if not booking:
            continue

        row = db.query(RefBookingDam).filter(RefBookingDam.booking == booking).first()
        if not row:
            row = RefBookingDam(booking=booking)
            db.add(row)
            
        row.awb = awb
        row.dam = dam
        upserts += 1

    db.commit()
    return {"ok": True, "upserts": upserts}
