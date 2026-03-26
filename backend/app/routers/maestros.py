from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
import pandas as pd
import io
import re

from app.database import get_db
from app.models.maestros import Transportista, VehiculoTracto, VehiculoCarreta
from app.utils.logging import logger

router = APIRouter(
    prefix="/api/v1/maestros",
    tags=["Maestros"]
)

def clean_plate(plate: str) -> str:
    """Elimina guiones y espacios de una placa, convirtiéndola a mayúsculas."""
    if not plate: return ""
    return re.sub(r'[^A-Z0-9]', '', str(plate).upper())

@router.post("/bulk-upload")
async def bulk_upload_transportistas(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Carga masiva de transportistas y vehículos desde el Excel 'ASIGNACION DE UNIDADES'.
    Mapeo:
    - Columna F (Indice 5): RUC
    - Columna G (Indice 6): Empresa de Transporte
    - Columna J (Indice 9): Placas (Tracto/Carreta)
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")

    try:
        contents = await file.read()
        # Leemos el Excel saltando las primeras 3 filas (donde están los logos/títulos)
        df = pd.read_excel(io.BytesIO(contents), header=None, skiprows=4)
        
        # Filtrar filas vacías (donde no hay RUC ni Empresa)
        df = df[df[5].notna() | df[6].notna()]

        processed_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                ruc = str(row[5]).strip() if pd.notna(row[5]) else None
                nombre = str(row[6]).strip() if pd.notna(row[6]) else None
                placas_raw = str(row[9]).strip() if pd.notna(row[9]) else ""

                if not ruc or ruc == "nan":
                    continue

                # 1. Buscar o Crear Transportista
                transportista = db.query(Transportista).filter(Transportista.ruc == ruc).first()
                if not transportista:
                    transportista = Transportista(
                        ruc=ruc,
                        nombre_transportista=nombre or "DESCONOCIDO",
                        estado="ACTIVO"
                    )
                    db.add(transportista)
                    db.flush() # Para obtener el ID
                else:
                    if nombre:
                        transportista.nombre_transportista = nombre
                
                # 2. Procesar Placas (Tracto/Carreta)
                # Formato esperado: PLACA1/PLACA2 o solo PLACA1
                partes = placas_raw.split('/')
                placa_t = clean_plate(partes[0]) if len(partes) > 0 else ""
                placa_c = clean_plate(partes[1]) if len(partes) > 1 else ""

                # Registrar Tracto
                if placa_t:
                    tracto = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == placa_t).first()
                    if not tracto:
                        tracto = VehiculoTracto(
                            transportista_id=transportista.id,
                            placa_tracto=placa_t,
                            estado="ACTIVO"
                        )
                        db.add(tracto)
                    else:
                        tracto.transportista_id = transportista.id # Asegurar asociación

                # Registrar Carreta
                if placa_c:
                    carreta = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == placa_c).first()
                    if not carreta:
                        carreta = VehiculoCarreta(
                            transportista_id=transportista.id,
                            placa_carreta=placa_c,
                            estado="ACTIVO"
                        )
                        db.add(carreta)
                    else:
                        carreta.transportista_id = transportista.id # Asegurar asociación

                processed_count += 1

            except Exception as e:
                errors.append(f"Error en fila {index + 5}: {str(e)}")

        db.commit()
        return {
            "status": "success",
            "mensaje": f"Se procesaron {processed_count} filas exitosamente.",
            "errores": errors
        }

    except Exception as e:
        logger.error(f"Error crítico en carga masiva: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error procesando el archivo: {str(e)}")

@router.get("/transportistas")
def list_transportistas(db: Session = Depends(get_db)):
    return db.query(Transportista).all()

@router.patch("/transportistas/{id}/estado")
def patch_estado_transportista(id: int, estado: str, db: Session = Depends(get_db)):
    t = db.query(Transportista).filter(Transportista.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    t.estado = estado.upper()
    db.commit()
    return {"status": "success", "nuevo_estado": t.estado}
