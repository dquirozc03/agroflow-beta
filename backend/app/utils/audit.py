from sqlalchemy.orm import Session
from app.models.auditoria import RegistroEvento

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
