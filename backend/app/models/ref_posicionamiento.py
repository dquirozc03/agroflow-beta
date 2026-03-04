from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class RefPosicionamiento(Base):
    __tablename__ = "ref_posicionamiento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    # Identificación
    booking_limpio: Mapped[str | None] = mapped_column(String(50), nullable=True)
    nave: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Operativo & Status
    status_fcl: Mapped[str | None] = mapped_column(String(50), nullable=True)
    orden_beta_final: Mapped[str | None] = mapped_column(String(50), nullable=True) # O/BETA FINAL
    planta_empacadora: Mapped[str | None] = mapped_column(String(150), nullable=True)
    cultivo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Fechas Booking (Originales)
    etd_booking: Mapped[str | None] = mapped_column(String(50), nullable=True)
    eta_booking: Mapped[str | None] = mapped_column(String(50), nullable=True)
    week_eta_booking: Mapped[str | None] = mapped_column(String(20), nullable=True)
    dias_tt_booking: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Fechas Finales / Reales
    etd_final: Mapped[str | None] = mapped_column(String(50), nullable=True)
    eta_final: Mapped[str | None] = mapped_column(String(50), nullable=True)
    week_eta_real: Mapped[str | None] = mapped_column(String(20), nullable=True)
    dias_tt_real: Mapped[int | None] = mapped_column(Integer, nullable=True)
    week_debe_arribar: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pol: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Historial de Cambios
    o_beta_inicial: Mapped[str | None] = mapped_column(String(50), nullable=True)
    o_beta_cambio_1: Mapped[str | None] = mapped_column(String(50), nullable=True)
    motivo_cambio_1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    o_beta_cambio_2: Mapped[str | None] = mapped_column(String(50), nullable=True)
    motivo_cambio_2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    area_responsable: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Equipo
    detalle_adicional: Mapped[str | None] = mapped_column(String(255), nullable=True)
    deposito_vacio: Mapped[str | None] = mapped_column(String(150), nullable=True)
    nro_contenedor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tipo_contenedor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Adicionales que conservamos por utilidad
    awb: Mapped[str | None] = mapped_column(String(50), nullable=True)

    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
