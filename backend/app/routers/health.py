from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter(prefix="/api/v1", tags=["Health"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    """
    Healthcheck profesional:
    - responde rápido
    - valida que la app vive
    - valida DB (SELECT 1)
    """
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return {"ok": True, "db_ok": db_ok}
