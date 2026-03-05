from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.ref_posicionamiento import RefPosicionamiento
from app.services.pdf_generator import generate_ie_pdf
from typing import List

router = APIRouter(prefix="/api/v1/ie", tags=["Instrucciones de Embarque"])

@router.get("/search")
def search_bookings(q: str, db: Session = Depends(get_db)):
    """Busca bookings por código para el autocompletado"""
    results = db.query(RefPosicionamiento).filter(
        RefPosicionamiento.booking.ilike(f"%{q}%")
    ).limit(10).all()
    
    return [
        {
            "booking": r.booking,
            "cultivo": r.cultivo,
            "cliente": r.cliente,
            "orden_beta": r.orden_beta_final
        } for r in results
    ]

from app.models.ie_models import RegistroIE
from datetime import date, datetime

@router.get("/history")
def get_ie_history(
    start_date: date = None,
    end_date: date = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Obtiene el historial de IEs generadas"""
    if not start_date:
        start_date = date.today()
    
    query = db.query(RegistroIE)
    
    # Filtro por fecha (fecha_generacion es datetime)
    query = query.filter(RegistroIE.fecha_generacion >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(RegistroIE.fecha_generacion <= datetime.combine(end_date, datetime.max.time()))
    
    total = query.count()
    results = query.order_by(RegistroIE.fecha_generacion.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": results
    }

@router.get("/generate/{booking}")
def download_ie_pdf(booking: str, db: Session = Depends(get_db)):
    """Genera y descarga el PDF de Instrucciones de Embarque y lo registra"""
    try:
        # Recuperar data para el registro
        posic = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
        
        pdf_buffer = generate_ie_pdf(booking, db)
        
        # Registrar en el historial
        registro = RegistroIE(
            booking=booking,
            o_beta=posic.orden_beta_final if posic else None,
            cultivo=posic.cultivo if posic else None,
            cliente=posic.cliente if posic else None,
            creado_por="System" # Podría extraerse del token JWT si hubiera auth completa
        )
        db.add(registro)
        db.commit()

        return Response(
            content=pdf_buffer.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=IE_{booking}.pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar PDF: {str(e)}")
