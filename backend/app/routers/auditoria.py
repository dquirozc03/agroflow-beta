from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.auditoria import RegistroEvento
from app.models.auth import Usuario
from app.dependencies.auth import require_role
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

router = APIRouter(prefix="/api/v1/auditoria", tags=["Auditoría"])

class AuditLogResponse(BaseModel):
    id: int
    registro_id: Optional[int] = None
    accion: str
    motivo: Optional[str] = None
    usuario: Optional[str] = None
    creado_en: datetime
    antes: Optional[Any] = None
    despues: Optional[Any] = None

    class Config:
        orm_mode = True
        from_attributes = True

@router.get("", response_model=list[AuditLogResponse])
def get_audit_logs(
    usuario: str | None = Query(None, description="Filtrar por usuario (username)"),
    accion: str | None = Query(None, description="Filtrar por acción (CREAR, ANULAR, EDITAR, PROCESAR)"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(["administrador", "gerencia", "supervisor_facturacion"]))
):
    q = db.query(RegistroEvento)

    # REGLA DE PRIVACIDAD: Solo administradores ven temas de usuarios.
    # Gerencia y Supervisor solo ven temas operativos.
    if current_user.rol != "administrador":
        q = q.filter(~RegistroEvento.accion.startswith("USUARIO_"))

    if usuario:
        q = q.filter(RegistroEvento.usuario.ilike(f"%{usuario}%"))
    
    if accion and accion != "ALL":
        q = q.filter(RegistroEvento.accion == accion)

    # Ordenar por fecha descendente (lo más reciente primero)
    q = q.order_by(desc(RegistroEvento.creado_en))
    
    return q.offset(offset).limit(limit).all()
