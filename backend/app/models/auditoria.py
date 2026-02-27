from __future__ import annotations

from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RegistroEvento(Base):
    __tablename__ = "ope_registro_eventos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    registro_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("ope_registros.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    accion: Mapped[str] = mapped_column(String(30), nullable=False)
    antes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    despues: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    motivo: Mapped[str | None] = mapped_column(String(250), nullable=True)

    usuario: Mapped[str | None] = mapped_column(String(80), nullable=True)

    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
