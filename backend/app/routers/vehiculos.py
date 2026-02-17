from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.catalogos import Vehiculo, Transportista
from app.schemas.catalogos import (
    VehiculoCrear,
    VehiculoRespuesta,
    VehiculoConTransportistaRespuesta,
    TransportistaRespuesta,
)

router = APIRouter(prefix="/api/v1/vehiculos", tags=["Vehículos"])


class VehiculoActualizarTransportista(BaseModel):
    transportista_id: int | None


@router.post("", response_model=VehiculoRespuesta)
def crear_vehiculo(payload: VehiculoCrear, db: Session = Depends(get_db)):
    existe = db.query(Vehiculo).filter(Vehiculo.placas == payload.placas).first()
    if existe:
        raise HTTPException(status_code=409, detail="Ya existe un vehículo con esas placas")

    data = payload.model_dump()
    
    # Lógica de certificados: si no viene cert_vehicular pero vienen individuales, concatenar
    ct = (data.get("cert_tracto") or "").strip()
    cc = (data.get("cert_carreta") or "").strip()
    cv = (data.get("cert_vehicular") or "").strip()
    
    if not cv and (ct or cc):
        if cc:
            data["cert_vehicular"] = f"{ct}/{cc}"
        else:
            data["cert_vehicular"] = ct
            
    veh = Vehiculo(**data)

    try:
        veh.aplicar_reglas_configuracion()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    db.add(veh)
    db.commit()
    db.refresh(veh)
    return veh


@router.get("", response_model=list[VehiculoRespuesta])
def listar_vehiculos(db: Session = Depends(get_db), limit: int = 50, offset: int = 0):
    return db.query(Vehiculo).order_by(Vehiculo.id.desc()).offset(offset).limit(limit).all()


@router.get("/buscar", response_model=VehiculoRespuesta)
def buscar_por_placas(placas: str, db: Session = Depends(get_db)):
    veh = db.query(Vehiculo).filter(Vehiculo.placas == placas).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return veh


@router.patch("/{vehiculo_id}/transportista", response_model=VehiculoRespuesta)
def actualizar_transportista_vehiculo(
    vehiculo_id: int,
    payload: VehiculoActualizarTransportista,
    db: Session = Depends(get_db),
):
    """Asocia o desasocia un transportista a un vehículo (para pruebas y administración)."""
    veh = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    if payload.transportista_id is not None:
        tra = db.query(Transportista).filter(Transportista.id == payload.transportista_id).first()
        if not tra:
            raise HTTPException(status_code=404, detail="Transportista no encontrado")
        veh.transportista_id = tra.id
    else:
        veh.transportista_id = None

    db.commit()
    db.refresh(veh)
    return veh


@router.get("/por-placas", response_model=VehiculoConTransportistaRespuesta)
def vehiculo_con_transportista_por_placas(
    tracto: str = Query(..., description="Placa tracto (obligatoria; determina el transportista)"),
    carreta: str | None = Query(None, description="Placa carreta (opcional; si es de otro transportista se alerta)"),
    db: Session = Depends(get_db),
):
    """
    Busca por placa TRACTO (la que manda). El transportista es el del tracto.
    Si se envía carreta y esa placa pertenece a otro transportista, se devuelve
    carreta_distinto_transportista=True y el nombre del otro para mostrar alerta.
    """
    tracto_norm = tracto.strip().upper() if tracto else ""
    if not tracto_norm:
        raise HTTPException(status_code=422, detail="Placa tracto es obligatoria")

    # Vehículo por TRACTO (cualquier registro con ese tracto; el transportista es el del tracto)
    veh_tracto = (
        db.query(Vehiculo)
        .options(joinedload(Vehiculo.transportista))
        .filter(Vehiculo.placa_tracto == tracto_norm)
        .first()
    )
    if not veh_tracto:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado para esa placa tracto")

    tra = veh_tracto.transportista
    carreta_distinto = False
    carreta_tra_nombre: str | None = None

    if carreta:
        carreta_norm = carreta.strip().upper()
        if carreta_norm:
            # ¿Existe un vehículo con esa placa carreta y es de otro transportista?
            veh_carreta = (
                db.query(Vehiculo)
                .options(joinedload(Vehiculo.transportista))
                .filter(Vehiculo.placa_carreta == carreta_norm)
                .first()
            )
            if veh_carreta and veh_carreta.transportista_id is not None and tra is not None:
                if veh_carreta.transportista_id != tra.id:
                    carreta_distinto = True
                    carreta_tra_nombre = veh_carreta.transportista.nombre_transportista if veh_carreta.transportista else None

    placas_combined = f"{tracto_norm}/{carreta.strip().upper()}" if (carreta and carreta.strip()) else tracto_norm

    return VehiculoConTransportistaRespuesta(
        id=veh_tracto.id,
        placa_tracto=veh_tracto.placa_tracto,
        placa_carreta=veh_tracto.placa_carreta,
        placas=placas_combined,
        marca=veh_tracto.marca,
        cert_vehicular=veh_tracto.cert_vehicular,
        transportista=TransportistaRespuesta.model_validate(tra) if tra else None,
        carreta_distinto_transportista=carreta_distinto,
        carreta_transportista_nombre=carreta_tra_nombre,
    )
