from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func, ForeignKey

class RefBookingDam(Base):
    __tablename__ = "ref_booking_dam"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking: Mapped[str] = mapped_column(String(50), ForeignKey("ref_posicionamiento.booking"), unique=True, index=True, nullable=False)

    awb: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dam: Mapped[str | None] = mapped_column(String(50), nullable=True)

    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
