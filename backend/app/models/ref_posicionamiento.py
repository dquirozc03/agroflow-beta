from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class RefPosicionamiento(Base):
    __tablename__ = "ref_posicionamiento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    naviera: Mapped[str | None] = mapped_column(String(100), nullable=True)
    nave: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pol: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pod: Mapped[str | None] = mapped_column(String(100), nullable=True)
    temperatura: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ventilacion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    planta_llenado: Mapped[str | None] = mapped_column(String(100), nullable=True)
    hora_posicionamiento: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ac_option: Mapped[bool | None] = mapped_column(Integer, default=0, nullable=True)
    ct_option: Mapped[bool | None] = mapped_column(Integer, default=0, nullable=True)
    operador_logistico: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cultivo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    es_reprogramado: Mapped[bool | None] = mapped_column(Integer, default=0, nullable=True)

    # Legacy fields (keeping for compatibility if they were used)
    o_beta: Mapped[str | None] = mapped_column(String(30), nullable=True)
    awb: Mapped[str | None] = mapped_column(String(30), nullable=True)

    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
