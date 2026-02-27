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
    naviera: Optional[str] = None
    nave: Optional[str] = None
    pol: Optional[str] = None
    pod: Optional[str] = None
    temperatura: Optional[str] = None
    ventilacion: Optional[str] = None
    planta_llenado: Optional[str] = None
    hora_posicionamiento: Optional[str] = None
    ac_option: Optional[int] = 0
    ct_option: Optional[int] = 0
    operador_logistico: Optional[str] = None
    cultivo: Optional[str] = None
    es_reprogramado: Optional[int] = 0
    # Legacy
    o_beta: Optional[str] = None
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
        
        row.naviera = normalizar(it.naviera)
        row.nave = normalizar(it.nave)
        row.pol = normalizar(it.pol)
        row.pod = normalizar(it.pod)
        row.temperatura = normalizar(it.temperatura)
        row.ventilacion = normalizar(it.ventilacion)
        row.planta_llenado = normalizar(it.planta_llenado)
        row.hora_posicionamiento = normalizar(it.hora_posicionamiento)
        row.ac_option = it.ac_option
        row.ct_option = it.ct_option
        row.operador_logistico = normalizar(it.operador_logistico)
        row.cultivo = normalizar(it.cultivo)
        row.es_reprogramado = it.es_reprogramado
        # Legacy
        row.o_beta = normalizar(it.o_beta)
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
        dam = normalizar(it.dam)
        if not booking or not dam:
            continue

        row = db.query(RefBookingDam).filter(RefBookingDam.booking == booking).first()
        if row:
            row.dam = dam
        else:
            db.add(RefBookingDam(booking=booking, dam=dam))
        upserts += 1

    db.commit()
    return {"ok": True, "upserts": upserts}
