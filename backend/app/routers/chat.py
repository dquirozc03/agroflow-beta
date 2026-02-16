"""
Chatbot de consultas en lenguaje natural sobre registros/embarques.
Responde preguntas como "¿Cuántos embarques salieron hoy?" usando la BD.
"""
from __future__ import annotations

from datetime import datetime, time, date, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.operacion import RegistroOperativo

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    pregunta: str


class ChatResponse(BaseModel):
    respuesta: str


def _get_tz():
    try:
        return ZoneInfo("America/Lima")
    except Exception:
        return None


def _hoy_limites(tz):
    if tz:
        now = datetime.now(tz)
        hoy = now.date()
    else:
        now = datetime.utcnow()
        hoy = now.date()
    start = datetime.combine(hoy, time.min)
    end = datetime.combine(hoy, time.max)
    if tz:
        start = start.replace(tzinfo=tz)
        end = end.replace(tzinfo=tz)
    return start, end


def _contar_registros_hoy(db: Session, tz) -> int:
    start, end = _hoy_limites(tz)
    return (
        db.query(func.count(RegistroOperativo.id))
        .filter(
            RegistroOperativo.fecha_registro >= start,
            RegistroOperativo.fecha_registro <= end,
        )
        .scalar()
        or 0
    )


def _contar_por_estado(db: Session, estado: str) -> int:
    return (
        db.query(func.count(RegistroOperativo.id))
        .filter(func.lower(RegistroOperativo.estado) == estado.lower())
        .scalar()
        or 0
    )


def _contar_total(db: Session) -> int:
    return db.query(func.count(RegistroOperativo.id)).scalar() or 0


def _interpretar_y_responder(pregunta: str, db: Session) -> str:
    t = (pregunta or "").strip().lower()
    if not t:
        return "Escribe una pregunta, por ejemplo: ¿Cuántos embarques salieron hoy?"

    tz = _get_tz()

    # ¿Cuántos embarques/registros/órdenes (beta) salieron hoy?
    if any(k in t for k in ["hoy", "del día", "salieron hoy", "registrados hoy"]):
        if any(k in t for k in ["embarque", "registro", "orden", "o_beta", "beta", "cuántos", "cuantos"]):
            n = _contar_registros_hoy(db, tz)
            return f"Hoy se registraron **{n}** embarques (órdenes/registros operativos)."

    # ¿Cuántos hay pendientes / procesados / anulados?
    if "pendiente" in t or "pendientes" in t:
        n = _contar_por_estado(db, "pendiente")
        return f"Hay **{n}** registros en estado pendiente."

    if "procesado" in t or "procesados" in t:
        n = _contar_por_estado(db, "procesado")
        return f"Hay **{n}** registros procesados."

    if "anulado" in t or "anulados" in t:
        n = _contar_por_estado(db, "anulado")
        return f"Hay **{n}** registros anulados."

    # Total general
    if any(k in t for k in ["total", "cuántos hay", "cuantos hay", "todos los registros"]) and not any(
        k in t for k in ["hoy", "pendiente", "procesado", "anulado"]
    ):
        n = _contar_total(db)
        return f"En total hay **{n}** registros en el sistema."

    return (
        "Puedo responder preguntas como: "
        "«¿Cuántos embarques salieron hoy?», "
        "«¿Cuántos registros hay pendientes?», "
        "«¿Cuántos procesados o anulados?»."
    )


@router.post("/pregunta", response_model=ChatResponse)
def chat_pregunta(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    Responde en lenguaje natural sobre registros/embarques.
    Ejemplos: "¿Cuántos embarques salieron hoy?", "¿Cuántos hay pendientes?"
    """
    respuesta = _interpretar_y_responder(payload.pregunta, db)
    return ChatResponse(respuesta=respuesta)
