from pydantic import BaseModel
from typing import List, Optional

class DashboardKpis(BaseModel):
    contenedores_procesados: int
    contenedores_pendientes: int
    alertas_activas: int
    maestros_incompletos: int
    en_alta_mar: int
    programados_hoy: int

class DespachoPorDia(BaseModel):
    fecha: str
    cantidad: int

class DistribucionCultivo(BaseModel):
    cultivo: str
    cantidad: int

class UltimoRegistro(BaseModel):
    id: int
    booking: str
    contenedor: str
    transportista: Optional[str]
    hora: str
    status: str

class ProximoPosicionamiento(BaseModel):
    booking: str
    orden_beta: Optional[str]
    planta_llenado: Optional[str]
    fecha_programada: Optional[str]
    nave: Optional[str]

class DashboardSummaryResponse(BaseModel):
    kpis: DashboardKpis
    despachos_por_dia: List[DespachoPorDia]
    distribucion_cultivos: List[DistribucionCultivo]
    ultimos_registros: List[UltimoRegistro]
    proximos_posicionamientos: List[ProximoPosicionamiento]
