from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class RefPosicionamiento(Base):
    __tablename__ = "ref_posicionamiento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # BOOKING
    
    # --- 1. Identificación y Status ---
    status_fcl: Mapped[str | None] = mapped_column(String(50), nullable=True) # STATUS - FCL
    status_beta_text: Mapped[str | None] = mapped_column(String(100), nullable=True) # O/BETA (STATUS FINAL)
    planta_empacadora: Mapped[str | None] = mapped_column(String(150), nullable=True) # PLT. EMPACADORA
    cultivo: Mapped[str | None] = mapped_column(String(100), nullable=True) # CULTIVO
    nave: Mapped[str | None] = mapped_column(String(100), nullable=True) # NAVE
    
    # --- 2. Fechas y Tránsito ---
    etd_booking: Mapped[str | None] = mapped_column(String(50), nullable=True) # ETD BOOKING
    eta_booking: Mapped[str | None] = mapped_column(String(50), nullable=True) # ETA BOOKING
    week_eta_booking: Mapped[str | None] = mapped_column(String(20), nullable=True) # WEEK ETA BOOKING
    dias_tt_booking: Mapped[int | None] = mapped_column(Integer, nullable=True) # DIAS TT. BOOKING
    etd_final: Mapped[str | None] = mapped_column(String(50), nullable=True) # ETD FINAL
    eta_final: Mapped[str | None] = mapped_column(String(50), nullable=True) # ETA FINAL
    week_eta_real: Mapped[str | None] = mapped_column(String(20), nullable=True) # WEEK ETA REAL
    dias_tt_real: Mapped[int | None] = mapped_column(Integer, nullable=True) # DIAS TT. REAL
    week_debe_arribar: Mapped[str | None] = mapped_column(String(20), nullable=True) # WEEK DEBE ARRIBAR
    pol: Mapped[str | None] = mapped_column(String(100), nullable=True) # POL
    
    # --- 3. Órdenes Beta y Cliente ---
    o_beta_inicial: Mapped[str | None] = mapped_column(String(50), nullable=True) # O/BETA INICIAL
    orden_beta_final: Mapped[str | None] = mapped_column(String(50), nullable=True) # O/BETA FINAL
    cliente: Mapped[str | None] = mapped_column(String(150), nullable=True) # CLIENTE
    recibidor: Mapped[str | None] = mapped_column(String(150), nullable=True) # RECIBIDOR
    destino_pedido: Mapped[str | None] = mapped_column(String(150), nullable=True) # DESTINO (PEDIDO)
    po_number: Mapped[str | None] = mapped_column(String(100), nullable=True) # PO
    destino_booking: Mapped[str | None] = mapped_column(String(150), nullable=True) # DESTINO (BOOKING)
    pais_booking: Mapped[str | None] = mapped_column(String(100), nullable=True) # PAIS (BOOKING)
    
    # --- 4. Equipo y Logística ---
    nro_fcl: Mapped[str | None] = mapped_column(String(100), nullable=True) # N° FCL
    deposito_retiro: Mapped[str | None] = mapped_column(String(150), nullable=True) # DEPOT DE RETIRO
    operador: Mapped[str | None] = mapped_column(String(100), nullable=True) # OPERADOR
    naviera: Mapped[str | None] = mapped_column(String(100), nullable=True) # NAVIERA
    
    # --- 5. Parámetros de Carga ---
    termoregistros: Mapped[str | None] = mapped_column(String(150), nullable=True) # TERMOREGISTROS
    ac_option: Mapped[str | None] = mapped_column(String(50), nullable=True) # AC
    ct_option: Mapped[str | None] = mapped_column(String(50), nullable=True) # C/T
    ventilacion: Mapped[str | None] = mapped_column(String(50), nullable=True) # VENT
    temperatura: Mapped[str | None] = mapped_column(String(50), nullable=True) # T°
    humedad: Mapped[str | None] = mapped_column(String(50), nullable=True) # HUMEDAD
    filtros: Mapped[str | None] = mapped_column(String(150), nullable=True) # FILTROS
    
    # --- 6. Producción y Llenado ---
    hora_solicitada_operador: Mapped[str | None] = mapped_column(String(50), nullable=True) # HORA SOLICITADA (OPERADOR)
    fecha_real_llenado: Mapped[str | None] = mapped_column(String(50), nullable=True) # FECHA REAL DE LLENADO
    week_llenado: Mapped[str | None] = mapped_column(String(20), nullable=True) # WEEK LLENADO
    
    # --- 7. Detalle de Mercadería ---
    variedad: Mapped[str | None] = mapped_column(String(100), nullable=True) # VARIEDAD
    tipo_caja: Mapped[str | None] = mapped_column(String(100), nullable=True) # TIPO DE CAJA
    etiqueta_caja: Mapped[str | None] = mapped_column(String(100), nullable=True) # ETIQUETA CAJA
    presentacion: Mapped[str | None] = mapped_column(String(150), nullable=True) # PRESENTACIÓN
    calibre: Mapped[str | None] = mapped_column(String(50), nullable=True) # CALIBRE
    cj_kg: Mapped[str | None] = mapped_column(String(50), nullable=True) # CJ/KG
    total_unidades: Mapped[str | None] = mapped_column(String(50), nullable=True) # TOTAL
    total_pallet: Mapped[int | None] = mapped_column(Integer, nullable=True) # TOTAL DE PALLETS
    
    # --- 8. Logística Final ---
    incoterm: Mapped[str | None] = mapped_column(String(50), nullable=True) # INCOTERM
    flete: Mapped[str | None] = mapped_column(String(50), nullable=True) # FLETE

    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
