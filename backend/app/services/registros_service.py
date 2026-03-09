from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.catalogos import Chofer, Vehiculo, Transportista
from app.models.operacion import RegistroOperativo
from app.models.unicos import Unico
from app.schemas.operacion import RegistroCrear
from app.utils.unicidad import normalizar, dividir_por_slash, unir_por_slash
from app.utils.audit import registrar_evento

# Tipos de datos para validación de unicidad
TIPOS_HISTORICOS = {
    "O_BETA", "BOOKING", "TERMOGRAFO", "PS_BETA", 
    "PS_ADUANA", "PS_OPERADOR", "SENASA_PS_LINEA"
}
TIPOS_VIGENTES = {"AWB"}
DIAS_TRAVESIA_AWB = 35

class RegistroService:
    @staticmethod
    def normalizar_payload(payload: RegistroCrear) -> RegistroCrear:
        """Limpia y normaliza los datos de entrada."""
        payload.o_beta = normalizar(payload.o_beta)
        payload.booking = normalizar(payload.booking)
        payload.awb = normalizar(payload.awb)
        payload.termografos = unir_por_slash(dividir_por_slash(payload.termografos))
        payload.ps_beta = unir_por_slash(dividir_por_slash(payload.ps_beta))
        payload.ps_aduana = normalizar(payload.ps_aduana)
        payload.ps_operador = normalizar(payload.ps_operador)
        payload.senasa = normalizar(payload.senasa)
        payload.ps_linea = normalizar(payload.ps_linea)
        if hasattr(payload, "dam"):
            payload.dam = normalizar(payload.dam)
        return payload

    @staticmethod
    def construir_items_unicos(payload: RegistroCrear, senasa_ps_linea_norm: str | None) -> list[tuple[str, str, bool]]:
        items: list[tuple[str, str, bool]] = []
        def add(tipo: str, valor: str | None):
            v = normalizar(valor)
            if not v or set(v) == {'*'}: return
            vigente = tipo in TIPOS_VIGENTES
            items.append((tipo, v, vigente))

        add("O_BETA", payload.o_beta)
        add("BOOKING", payload.booking)
        add("AWB", payload.awb)
        for t in dividir_por_slash(payload.termografos): add("TERMOGRAFO", t)
        for ps in dividir_por_slash(payload.ps_beta): add("PS_BETA", ps)
        add("PS_ADUANA", payload.ps_aduana)
        add("PS_OPERADOR", payload.ps_operador)
        add("SENASA_PS_LINEA", senasa_ps_linea_norm)
        return items

    @staticmethod
    def validar_duplicados(db: Session, items: list[tuple[str, str, bool]], referencia_excluir: str = None) -> list[dict]:
        duplicados = []
        ahora = datetime.now(timezone.utc)
        limite_travesia = ahora - timedelta(days=DIAS_TRAVESIA_AWB)

        for tipo, valor, vigente in items:
            q = db.query(Unico).filter(Unico.tipo == tipo, Unico.valor == valor)
            if referencia_excluir:
                q = q.filter(Unico.referencia != referencia_excluir)
            if vigente:
                q = q.filter(Unico.vigente == True, Unico.fecha_uso >= limite_travesia)
            
            existe = q.first()
            if existe:
                duplicados.append({
                    "tipo": tipo, "valor": valor,
                    "mensaje": "Valor en uso (vigente)" if vigente else "Valor ya utilizado (histórico)"
                })
        return duplicados
