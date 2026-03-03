from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class RefPosicionamiento(Base):
    __tablename__ = "ref_posicionamiento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    etd: Mapped[str | None] = mapped_column(String(50), nullable=True)
    eta: Mapped[str | None] = mapped_column(String(50), nullable=True)
    week_eta: Mapped[str | None] = mapped_column(String(20), nullable=True)
    dias_tt: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wk_debe_arribar: Mapped[str | None] = mapped_column(String(20), nullable=True)
    
    nave: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pol: Mapped[str | None] = mapped_column(String(100), nullable=True)
    o_beta: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cliente: Mapped[str | None] = mapped_column(String(150), nullable=True)
    pod: Mapped[str | None] = mapped_column(String(100), nullable=True)
    po_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    aforo_planta: Mapped[bool | None] = mapped_column(Integer, default=0, nullable=True)
    termog: Mapped[str | None] = mapped_column(String(100), nullable=True)
    temperatura: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ventilacion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    flete: Mapped[str | None] = mapped_column(String(100), nullable=True)
    operador_logistico: Mapped[str | None] = mapped_column(String(150), nullable=True)
    naviera: Mapped[str | None] = mapped_column(String(150), nullable=True)

    ac_option: Mapped[bool | None] = mapped_column(Integer, default=0, nullable=True)
    ct_option: Mapped[bool | None] = mapped_column(Integer, default=0, nullable=True)

    fecha_llenado: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hora_posicionamiento: Mapped[str | None] = mapped_column(String(50), nullable=True)
    planta_llenado: Mapped[str | None] = mapped_column(String(150), nullable=True)
    
    cultivo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tipo_caja: Mapped[str | None] = mapped_column(String(100), nullable=True)
    etiqueta: Mapped[str | None] = mapped_column(String(100), nullable=True)
    presentacion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cj_kg: Mapped[str | None] = mapped_column(String(50), nullable=True) # Often string in excel "10 KG"
    total: Mapped[str | None] = mapped_column(String(50), nullable=True)

    es_reprogramado: Mapped[bool | None] = mapped_column(Integer, default=0, nullable=True)
    awb: Mapped[str | None] = mapped_column(String(50), nullable=True)

    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
