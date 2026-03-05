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

@router.get("/generate/{booking}")
def download_ie_pdf(booking: str, db: Session = Depends(get_db)):
    """Genera y descarga el PDF de Instrucciones de Embarque"""
    try:
        pdf_buffer = generate_ie_pdf(booking, db)
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
