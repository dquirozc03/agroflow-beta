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

    # Si no hay posicionamiento pero sí DAM, devolvemos lo básico
    if not pos:
        return {
            "booking": b,
            "awb": dam_row.awb if dam_row else None,
            "dam": dam_row.dam if dam_row else None,
        }

    # Retornar objeto completo con los 45 campos (Nombres consistentes con el modelo)
    return {
        "booking": pos.booking,
        "status_fcl": pos.status_fcl,
        "status_beta_text": pos.status_beta_text,
        "planta_empacadora": pos.planta_empacadora,
        "cultivo": pos.cultivo,
        "nave": pos.nave,
        
        "etd_booking": pos.etd_booking,
        "eta_booking": pos.eta_booking,
        "week_eta_booking": pos.week_eta_booking,
        "dias_tt_booking": pos.dias_tt_booking,
        
        "etd_final": pos.etd_final,
        "eta_final": pos.eta_final,
        "week_eta_real": pos.week_eta_real,
        "dias_tt_real": pos.dias_tt_real,
        "week_debe_arribar": pos.week_debe_arribar,
        "pol": pos.pol,
        
        "o_beta_inicial": pos.o_beta_inicial,
        "orden_beta_final": pos.orden_beta_final,
        
        "cliente": pos.cliente,
        "recibidor": pos.recibidor,
        "destino_pedido": pos.destino_pedido,
        "po_number": pos.po_number,
        "destino_booking": pos.destino_booking,
        "pais_booking": pos.pais_booking,
        
        "nro_fcl": pos.nro_fcl,
        "deposito_retiro": pos.deposito_retiro,
        "operador": pos.operador,
        "naviera": pos.naviera,
        
        "termoregistros": pos.termoregistros,
        "ac_option": pos.ac_option,
        "ct_option": pos.ct_option,
        "ventilacion": pos.ventilacion,
        "temperatura": pos.temperatura,
        
        "hora_solicitada_operador": pos.hora_solicitada_operador,
        "fecha_real_llenado": pos.fecha_real_llenado,
        "week_llenado": pos.week_llenado,
        
        "variedad": pos.variedad,
        "tipo_caja": pos.tipo_caja,
        "etiqueta_caja": pos.etiqueta_caja,
        "presentacion": pos.presentacion,
        "calibre": pos.calibre,
        "cj_kg": pos.cj_kg,
        "total_unidades": pos.total_unidades,
        
        "incoterm": pos.incoterm,
        "flete": pos.flete,
        
        # Priorizar AWB de la tabla de DAMs si existe
        "awb": dam_row.awb if dam_row and dam_row.awb else None,
        "dam": dam_row.dam if dam_row else None,
        
        # Datos de Asignación Automática
        "licencia": dam_row.licencia if dam_row else None,
        "chofer": dam_row.chofer if dam_row else None,
        "placas": dam_row.placas if dam_row else None,
        "transportista": dam_row.transportista if dam_row else None,
    }
