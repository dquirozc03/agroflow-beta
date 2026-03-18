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

        def extract_sap_code(text: str) -> str:
            if not text: return ""
            match = re.search(r'SAP[^\d]*(\d+)', text, flags=re.IGNORECASE)
            if match: return match.group(1)
            match_fb = re.search(r'\b\d{5,10}\b', text)
            if match_fb: return match_fb.group(0)
            return ""

        raw_headers = payload[0]
        processed_headers = [fuzzy_key(h) for h in raw_headers]
        
        WHITELIST_MAP = {
            fuzzy_key("CLIENTE"): "nombre_comercial",
            fuzzy_key("CODIGO SAP CLIENTE"): "codigo_sap_cliente",
            fuzzy_key("CODIGO SA CLIENTE"): "codigo_sap_cliente",
            fuzzy_key("CÓDIGO SAP CLIENTE"): "codigo_sap_cliente",
            fuzzy_key("DESTINO"): "destino",
            fuzzy_key("PAIS"): "pais",
            fuzzy_key("EORI CONSIGNE"): "eori_consignatario",
            fuzzy_key("CONSIGNE BL"): "consignatario_bl",
            fuzzy_key("Datos Referenciales CONSIGNE"): "datos_referenciales_consignatario",
            fuzzy_key("CODIGO SAP NOTIFY"): "codigo_sap_notify",
            fuzzy_key("EORI NOTIFY"): "eori_notify",
            fuzzy_key("NOTIFY BL"): "notificante_bl",
            fuzzy_key("Datos Referenciales NOTIFY"): "datos_referenciales_notify",
            fuzzy_key("EMISION BL"): "emision_bl",
            fuzzy_key("CLIENTE DE FITOSANITARIO"): "cliente_fito",
            fuzzy_key("OBSERVACIONES"): "observaciones",
        }

        col_indices = {}
        for i, h in enumerate(processed_headers):
            if h in WHITELIST_MAP:
                f = WHITELIST_MAP[h]
                if f not in col_indices: 
                    col_indices[f] = i
                    
        # Fallback ultra-agresivo para Excel roto:
        for i, h in enumerate(processed_headers):
            if "codigo_sap_cliente" not in col_indices and "CLIENTE" in h and ("SAP" in h or "SA" in h) and "NOTIFY" not in h:
                col_indices["codigo_sap_cliente"] = i
            if "codigo_sap_notify" not in col_indices and "NOTIF" in h and ("SAP" in h or "SA" in h):
                col_indices["codigo_sap_notify"] = i

        if "nombre_comercial" not in col_indices:
            return {"ok": False, "detail": "No se encontró la columna CLIENTE"}

        upserts = 0
        for row_idx in range(1, len(payload)):
            row = payload[row_idx]
            if not row: continue
            
            # Nombre comercial (para cruzar con posicionamiento)
            nombre = str(row[col_indices["nombre_comercial"]] or "").strip() if "nombre_comercial" in col_indices else ""
            if not nombre: continue

            # Destino (importante para duplicados con distintas direcciones)
            destino = str(row[col_indices["destino"]] or "").strip() if "destino" in col_indices else ""

            # Buscar o crear (Key: nombre + destino + cultivo)
            db_item = db.query(CatClienteIE).filter(
                CatClienteIE.nombre_comercial == nombre,
                CatClienteIE.destino == destino,
                CatClienteIE.cultivo == cultivo
            ).first()
            
            if not db_item:
                db_item = CatClienteIE(nombre_comercial=nombre, destino=destino, cultivo=cultivo)
                db.add(db_item)

            # Mapear todos los campos
            if "codigo_sap_cliente" in col_indices: db_item.codigo_sap_cliente = extract_sap_code(str(row[col_indices["codigo_sap_cliente"]] or ""))
            if "pais" in col_indices: db_item.pais = str(row[col_indices["pais"]] or "").strip()
            if "eori_consignatario" in col_indices: db_item.eori_consignatario = str(row[col_indices["eori_consignatario"]] or "").strip()
            if "consignatario_bl" in col_indices: db_item.consignatario_bl = str(row[col_indices["consignatario_bl"]] or "").strip()
            if "datos_referenciales_consignatario" in col_indices: db_item.datos_referenciales_consignatario = str(row[col_indices["datos_referenciales_consignatario"]] or "").strip()
            if "codigo_sap_notify" in col_indices: db_item.codigo_sap_notify = extract_sap_code(str(row[col_indices["codigo_sap_notify"]] or ""))
            if "eori_notify" in col_indices: db_item.eori_notify = str(row[col_indices["eori_notify"]] or "").strip()
            if "notificante_bl" in col_indices: db_item.notificante_bl = str(row[col_indices["notificante_bl"]] or "").strip()
            if "datos_referenciales_notify" in col_indices: db_item.datos_referenciales_notify = str(row[col_indices["datos_referenciales_notify"]] or "").strip()
            if "emision_bl" in col_indices: db_item.emision_bl = str(row[col_indices["emision_bl"]] or "").strip()
            if "cliente_fito" in col_indices: db_item.cliente_fito = str(row[col_indices["cliente_fito"]] or "").strip()
            if "observaciones" in col_indices: db_item.observaciones = str(row[col_indices["observaciones"]] or "").strip()

            upserts += 1

        db.commit()
        return {
            "ok": True, 
            "upserts": upserts, 
            "cultivo": cultivo,
            "columnas_detectadas": list(col_indices.keys()),
            "_debug_raw_headers": raw_headers
        }
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
