from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Union

def to_bool(v: any) -> bool:
    if isinstance(v, bool):
        return v
    if v is None:
        return False
    s = str(v).upper().strip()
    return s in ("SI", "S", "YES", "1", "TRUE", "VERDADERO")

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
        
        row.aforo_planta = 1 if to_bool(it.aforo_planta) else 0
        row.termog = normalizar(it.termog)
        row.temperatura = normalizar(it.temperatura)
        row.ventilacion = normalizar(it.ventilacion)
        row.flete = normalizar(it.flete)
        row.operador_logistico = normalizar(it.operador_logistico)
        row.naviera = normalizar(it.naviera)

        row.ac_option = 1 if to_bool(it.ac_option) else 0
        row.ct_option = 1 if to_bool(it.ct_option) else 0

        row.fecha_llenado = normalizar(it.fecha_llenado)
        row.hora_posicionamiento = normalizar(it.hora_posicionamiento)
        row.planta_llenado = normalizar(it.planta_llenado)
        
        row.cultivo = normalizar(it.cultivo)
        row.tipo_caja = normalizar(it.tipo_caja)
        row.etiqueta = normalizar(it.etiqueta)
        row.presentacion = normalizar(it.presentacion)
        row.cj_kg = normalizar(it.cj_kg)
        row.total = normalizar(it.total)

        row.es_reprogramado = 1 if to_bool(it.es_reprogramado) else 0
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
