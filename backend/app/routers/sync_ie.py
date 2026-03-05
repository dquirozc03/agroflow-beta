from typing import List, Union, Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.sync import validar_token, normalizar
from app.models.ie_models import CatClienteIE
import re

router = APIRouter(prefix="/api/v1/sync/ie", tags=["Sync IE"])

@router.post("/clientes/raw")
def sync_clientes_ie_raw(
    payload: List[List[Union[str, int, float, None]]],
    cultivo: str = "GRANADA", # Parametrizado por ahora
    db: Session = Depends(get_db),
    x_sync_token: str | None = Header(default=None),
):
    validar_token(x_sync_token)
    if not payload or len(payload) < 2:
        return {"ok": False, "detail": "Datos insuficientes"}

    try:
        def fuzzy_key(h: str) -> str:
            return re.sub(r'[^A-Z0-9]', '', str(h or "").upper())

        raw_headers = payload[0]
        processed_headers = [fuzzy_key(h) for h in raw_headers]
        
        WHITELIST_MAP = {
            fuzzy_key("CLIENTE"): "nombre_comercial",
            fuzzy_key("CONSIGNE BL"): "consignatario_bl",
            fuzzy_key("NOTIFY BL"): "notificante_bl",
            fuzzy_key("CLIENTE FITOSANITARIO"): "cliente_fito"
        }

        col_indices = {}
        for i, h in enumerate(processed_headers):
            if h in WHITELIST_MAP:
                f = WHITELIST_MAP[h]
                if f not in col_indices: 
                    col_indices[f] = i

        if "nombre_comercial" not in col_indices:
            return {"ok": False, "detail": "No se encontró la columna CLIENTE"}

        upserts = 0
        for row_idx in range(1, len(payload)):
            row = payload[row_idx]
            if not row or len(row) <= max(col_indices.values()): continue
            
            # Nombre comercial (para cruzar con posicionamiento)
            nombre = str(row[col_indices["nombre_comercial"]] or "").strip()
            if not nombre: continue

            # Buscar o crear
            db_item = db.query(CatClienteIE).filter(
                CatClienteIE.nombre_comercial == nombre,
                CatClienteIE.cultivo == cultivo
            ).first()
            
            if not db_item:
                db_item = CatClienteIE(nombre_comercial=nombre, cultivo=cultivo)
                db.add(db_item)

            if "consignatario_bl" in col_indices:
                db_item.consignatario_bl = str(row[col_indices["consignatario_bl"]] or "").strip()
            if "notificante_bl" in col_indices:
                db_item.notificante_bl = str(row[col_indices["notificante_bl"]] or "").strip()
            if "cliente_fito" in col_indices:
                db_item.cliente_fito = str(row[col_indices["cliente_fito"]] or "").strip()

            upserts += 1

        db.commit()
        return {"ok": True, "upserts": upserts, "cultivo": cultivo}
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
