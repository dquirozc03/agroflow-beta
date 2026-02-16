from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ============================================================
# HISTORIAL GENERAL (Dashboard / Lista principal)
# ============================================================

class RegistroListado(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha_registro: datetime
    estado: str | None = None

    booking: str | None = None
    o_beta: str | None = None
    awb: str | None = None
    dam: str | None = None

    # Datos “humanos” para tabla
    dni: str | None = None
    chofer: str | None = None
    placas: str | None = None
    transportista: str | None = None
    codigo_sap: str | None = None

    # Campos útiles para auditoría (no rompen nada si no existen aún)
    processed_at: datetime | None = None
    anulado_at: datetime | None = None


class HistorialResponse(BaseModel):
    """Respuesta paginada del historial de registros (dashboard)."""
    items: list[RegistroListado]
    total: int


# ============================================================
# PROCESADOS PARA BANDEJA SAP (vista estilo SAP)
# ============================================================

class ProcesadoSapItem(BaseModel):
    """
    Representa una fila procesada lista para mostrarse
    en la subtabla "Procesados" de Bandeja SAP.
    """

    model_config = ConfigDict(from_attributes=True)

    registro_id: int
    estado: str | None = None
    processed_at: datetime | None = None
    anulado_at: datetime | None = None

    # Campos tipo SAP (alineados a tu UI actual)
    FECHA: str
    O_BETA: str
    BOOKING: str
    AWB: str
    MARCA: str
    PLACAS: str
    DNI: str
    CHOFER: str
    LICENCIA: str
    TERMOGRAFOS: str
    CODIGO_SAP: str
    TRANSPORTISTA: str
    PS_BETA: str
    PS_ADUANA: str
    PS_OPERADOR: str
    SENASA_PS_LINEA: str
    N_DAM: str
    P_REGISTRAL: str
    CER_VEHICULAR: str


class ProcesadosSapResponse(BaseModel):
    """
    Respuesta paginada de la vista Procesados en Bandeja SAP.
    """
    items: list[ProcesadoSapItem]
    total: int
