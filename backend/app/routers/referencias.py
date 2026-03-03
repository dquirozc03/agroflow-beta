from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.ref_posicionamiento import RefPosicionamiento
from app.models.ref_booking_dam import RefBookingDam

router = APIRouter(prefix="/api/v1/ref", tags=["Referencias"])

def normalizar(v: str) -> str:
    return " ".join(v.strip().split()).upper()

@router.get("/booking/{booking}")
def ref_por_booking(booking: str, db: Session = Depends(get_db)):
    b = normalizar(booking)

    pos = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == b).first()
    dam_row = db.query(RefBookingDam).filter(RefBookingDam.booking == b).first()

    if not pos and not dam_row:
        raise HTTPException(status_code=404, detail="Booking no encontrado en referencias")

    # Si no hay posicionamiento pero sí DAM, devolvemos lo que hay
    if not pos:
        return {
            "booking": b,
            "awb": dam_row.awb if dam_row else None,
            "dam": dam_row.dam if dam_row else None,
        }

    # Retornar objeto completo unificado
    return {
        "booking": pos.booking,
        "etd": pos.etd,
        "eta": pos.eta,
        "week_eta": pos.week_eta,
        "dias_tt": pos.dias_tt,
        "wk_debe_arribar": pos.wk_debe_arribar,
        "nave": pos.nave,
        "pol": pos.pol,
        "o_beta": pos.o_beta,
        "cliente": pos.cliente,
        "pod": pos.pod,
        "po_number": pos.po_number,
        "aforo_planta": bool(pos.aforo_planta),
        "termog": pos.termog,
        "temperatura": pos.temperatura,
        "ventilacion": pos.ventilacion,
        "flete": pos.flete,
        "operador_logistico": pos.operador_logistico,
        "naviera": pos.naviera,
        "ac_option": bool(pos.ac_option),
        "ct_option": bool(pos.ct_option),
        "fecha_llenado": pos.fecha_llenado,
        "hora_posicionamiento": pos.hora_posicionamiento,
        "planta_llenado": pos.planta_llenado,
        "cultivo": pos.cultivo,
        "tipo_caja": pos.tipo_caja,
        "etiqueta": pos.etiqueta,
        "presentacion": pos.presentacion,
        "cj_kg": pos.cj_kg,
        "total": pos.total,
        "es_reprogramado": bool(pos.es_reprogramado),
        # Priorizar AWB de la tabla de DAMs si existe
        "awb": dam_row.awb if dam_row and dam_row.awb else pos.awb,
        "dam": dam_row.dam if dam_row else None,
    }
