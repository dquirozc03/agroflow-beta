from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class RefBookingDam(Base):
    __tablename__ = "ref_booking_dam"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    awb: Mapped[str | None] = mapped_column(String(50), nullable=True) # Campo legado
    ce_awb: Mapped[str | None] = mapped_column(String(100), nullable=True) # Nuevo campo contenedor
    dam: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Datos adicionales de Asignación de Unidades
    licencia: Mapped[str | None] = mapped_column(String(50), nullable=True)
    chofer: Mapped[str | None] = mapped_column(String(150), nullable=True)
    placas: Mapped[str | None] = mapped_column(String(50), nullable=True)
    transportista: Mapped[str | None] = mapped_column(String(150), nullable=True)

    # Flag para alertas web si los contenedores no coinciden
    alerta_discrepancia: Mapped[int] = mapped_column(Integer, server_default="0", default=0)

    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
