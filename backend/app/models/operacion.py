from __future__ import annotations

from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RegistroOperativo(Base):
    __tablename__ = "ope_registros"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    o_beta: Mapped[str | None] = mapped_column(String(50), nullable=True)
    booking: Mapped[str | None] = mapped_column(String(50), nullable=True)
    awb: Mapped[str | None] = mapped_column(String(50), nullable=True)  # contenedor

    chofer_id: Mapped[int] = mapped_column(ForeignKey("cat_choferes.id"), nullable=False)
    vehiculo_id: Mapped[int] = mapped_column(ForeignKey("cat_vehiculos.id"), nullable=False)
    transportista_id: Mapped[int] = mapped_column(ForeignKey("cat_transportistas.id"), nullable=False)

    termografos: Mapped[str | None] = mapped_column(String(200), nullable=True)

    ps_beta: Mapped[str | None] = mapped_column(String(80), nullable=True)
    ps_aduana: Mapped[str | None] = mapped_column(String(80), nullable=True)
    ps_operador: Mapped[str | None] = mapped_column(String(80), nullable=True)

    senasa: Mapped[str | None] = mapped_column(String(80), nullable=True)
    ps_linea: Mapped[str | None] = mapped_column(String(80), nullable=True)
    senasa_ps_linea: Mapped[str | None] = mapped_column(String(120), nullable=True)

    dam: Mapped[str | None] = mapped_column(String(80), nullable=True)

    # Estados persistentes:
    # - pendiente: listo para copiar/pegar a SAP (manual)
    # - procesado: confirmado como cargado en SAP (manual)
    # - anulado: invalidado (no se elimina)
    estado: Mapped[str] = mapped_column(String(20), default="pendiente", nullable=False)

    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    anulado_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    anulado_motivo: Mapped[str | None] = mapped_column(String(250), nullable=True)

    creado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    chofer = relationship("Chofer")
    vehiculo = relationship("Vehiculo")
    transportista = relationship("Transportista")
