from __future__ import annotations
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class RefPosicionamiento(Base):
    __tablename__ = "ref_posicionamiento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    
    # --- 1. Identificación y Status ---
    nro_item: Mapped[str | None] = mapped_column(String(50), nullable=True) # N°
    booking_limpio: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status_fcl: Mapped[str | None] = mapped_column(String(50), nullable=True) # Semaforización
    nave: Mapped[str | None] = mapped_column(String(100), nullable=True)
    orden_beta_final: Mapped[str | None] = mapped_column(String(50), nullable=True) # O/BETA FINAL
    status_beta_text: Mapped[str | None] = mapped_column(String(100), nullable=True) # O/BETA (STATUS FINAL)
    planta_empacadora: Mapped[str | None] = mapped_column(String(150), nullable=True)
    cultivo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # --- 2. Cliente y Destino ---
    cliente: Mapped[str | None] = mapped_column(String(150), nullable=True)
    recibidor: Mapped[str | None] = mapped_column(String(150), nullable=True)
    destino_pedido: Mapped[str | None] = mapped_column(String(150), nullable=True) # DESTINO (PEDIDO)
    po_number: Mapped[str | None] = mapped_column(String(100), nullable=True) # PO
    destino_booking: Mapped[str | None] = mapped_column(String(150), nullable=True) # DESTINO (BOOKING)
    pais_booking: Mapped[str | None] = mapped_column(String(100), nullable=True) # PAIS (BOOKING)
    
    # --- 3. Fechas y Tránsito ---
    etd_booking: Mapped[str | None] = mapped_column(String(50), nullable=True)
    eta_booking: Mapped[str | None] = mapped_column(String(50), nullable=True)
    week_eta_booking: Mapped[str | None] = mapped_column(String(20), nullable=True)
    dias_tt_booking: Mapped[int | None] = mapped_column(Integer, nullable=True) # DIAS TT. BOOKING
    etd_final: Mapped[str | None] = mapped_column(String(50), nullable=True)
    eta_final: Mapped[str | None] = mapped_column(String(50), nullable=True)
    week_eta_real: Mapped[str | None] = mapped_column(String(20), nullable=True)
    dias_tt_real: Mapped[int | None] = mapped_column(Integer, nullable=True) # DIAS TT. REAL
    week_debe_arribar: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pol: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # --- 4. Historial de Cambios ---
    o_beta_inicial: Mapped[str | None] = mapped_column(String(50), nullable=True)
    o_beta_cambio_1: Mapped[str | None] = mapped_column(String(50), nullable=True)
    motivo_cambio_1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    o_beta_cambio_2: Mapped[str | None] = mapped_column(String(50), nullable=True)
    motivo_cambio_2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    area_responsable: Mapped[str | None] = mapped_column(String(150), nullable=True) # ÁREA RESPONSABLE CAMBIO DE O/BETA
    
    # --- 5. Equipo y Contenedor ---
    nro_fcl: Mapped[str | None] = mapped_column(String(100), nullable=True) # N° FCL
    nro_fcl_seguridad: Mapped[str | None] = mapped_column(String(100), nullable=True) # N° FCL-SEGURIDAD
    deposito_retiro: Mapped[str | None] = mapped_column(String(150), nullable=True) # DEPOT DE RETIRO
    operador: Mapped[str | None] = mapped_column(String(100), nullable=True)
    naviera: Mapped[str | None] = mapped_column(String(100), nullable=True)
    detalle_adicional_equipo: Mapped[str | None] = mapped_column(String(255), nullable=True) # DETALLE ADICIONAL
    deposito_vacio_legacy: Mapped[str | None] = mapped_column(String(150), nullable=True) # Deposito Vacio (Legacy)
    
    # --- 6. Parámetros de Carga ---
    termoregistros: Mapped[str | None] = mapped_column(String(150), nullable=True)
    termos_verif: Mapped[str | None] = mapped_column(String(150), nullable=True) # TERMOS/VERIF
    ac_option: Mapped[str | None] = mapped_column(String(50), nullable=True) # AC
    ct_option: Mapped[str | None] = mapped_column(String(50), nullable=True) # C/T
    ventilacion: Mapped[str | None] = mapped_column(String(50), nullable=True) # VENT
    temperatura: Mapped[str | None] = mapped_column(String(50), nullable=True) # T°
    motivo_cambio_parametros: Mapped[str | None] = mapped_column(String(255), nullable=True) # MOTIVO CAMB. PARÁMETROS
    aforo_en_planta: Mapped[str | None] = mapped_column(String(20), nullable=True) # AFORO EN PLANTA (SI/NO)
    
    # --- 7. Tiempos de Producción ---
    fecha_solicitada_produccion: Mapped[str | None] = mapped_column(String(50), nullable=True) # FECHA SOLICITADA (PRODUCCIÓN)
    hora_solicitada_produccion: Mapped[str | None] = mapped_column(String(50), nullable=True) # HORA SOLICITADA (PRODUCCIÓN)
    fecha_solicitada_operador: Mapped[str | None] = mapped_column(String(50), nullable=True) # FECHA SOLICITADA (OPERADOR)
    hora_solicitada_operador: Mapped[str | None] = mapped_column(String(50), nullable=True) # HORA SOLICITADA (OPERADOR)
    fecha_real_llenado: Mapped[str | None] = mapped_column(String(50), nullable=True) # FECHA REAL DE LLENADO
    week_llenado: Mapped[str | None] = mapped_column(String(20), nullable=True) # WEEK LLENADO
    
    # --- 8. Detalle de Mercadería ---
    variedad: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tipo_caja: Mapped[str | None] = mapped_column(String(100), nullable=True)
    etiqueta_caja: Mapped[str | None] = mapped_column(String(100), nullable=True) # ETIQUETA CAJA
    presentacion: Mapped[str | None] = mapped_column(String(150), nullable=True)
    calibre: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cj_kg: Mapped[str | None] = mapped_column(String(50), nullable=True) # CJ/KG
    total_unidades: Mapped[str | None] = mapped_column(String(50), nullable=True) # TOTAL
    
    # --- 9. Logística y Cierre ---
    incoterm: Mapped[str | None] = mapped_column(String(50), nullable=True)
    flete: Mapped[str | None] = mapped_column(String(50), nullable=True)
    confirmacion_operador: Mapped[str | None] = mapped_column(String(100), nullable=True) # CONFIRMACIÓN OPERADOR
    detalle_confirmacion_operador: Mapped[str | None] = mapped_column(String(255), nullable=True) # DETALLE DE LA CONFIRMACIÓN (OPERADOR)
    rezagado: Mapped[str | None] = mapped_column(String(20), nullable=True) # REZAGADO (SI/NO)
    motivos_rezagado: Mapped[str | None] = mapped_column(String(255), nullable=True) # MOTIVOS DE REZAGADO
    fecha_vgm: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hora_vgm: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fecha_cut_off: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hora_cut_off: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fecha_lar: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hora_lar: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    awb_master: Mapped[str | None] = mapped_column(String(50), nullable=True) # AWB (Legacy/Master)

    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
