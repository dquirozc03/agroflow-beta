import logging
from sqlalchemy.orm import Session
from app.models.auditoria import RegistroEvento

logger = logging.getLogger(__name__)

def registrar_evento(
    db: Session,
    registro_id: int | None,
    accion: str,
    antes: dict | None = None,
    despues: dict | None = None,
    motivo: str | None = None,
    usuario: str | None = "sistema",
):
    """
    Registra un evento en la tabla de auditoría.
    registro_id puede ser None para eventos globales (ej: gestión de usuarios).
    """
    try:
        db.add(
            RegistroEvento(
                registro_id=registro_id,
                accion=accion,
                antes=antes,
                despues=despues,
                motivo=(motivo or None),
                usuario=(usuario or None),
            )
        )
    except Exception as e:
        logger.error(f"Fallo crítico al preparar registro de auditoría para registro_id {registro_id}: {str(e)}")
