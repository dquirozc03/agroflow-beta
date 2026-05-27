import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.pedido import PedidoComercial
from app.models.posicionamiento import Posicionamiento
from app.models.embarque import ReporteEmbarques

db = SessionLocal()

def strip_orden_beta(orden_beta):
    if not orden_beta: return None
    import re
    m = re.search(r'\d+', orden_beta)
    return m.group(0) if m else None

# Buscar pedidos de la semana 24, OGL, Palta
pedidos_semana = db.query(PedidoComercial).filter(
    PedidoComercial.semana_eta == 24,
    PedidoComercial.cliente.ilike("%OGL%"),
    PedidoComercial.cultivo.ilike("%PALTA%")
).all()

ordenes_semana = set(strip_orden_beta(p.orden_beta) for p in pedidos_semana if p.orden_beta)

query_pos = db.query(Posicionamiento).filter(
    Posicionamiento.ORDEN_BETA.isnot(None),
    Posicionamiento.CULTIVO.ilike("%PALTA%")
).all()

pos_semana = [p for p in query_pos if strip_orden_beta(p.ORDEN_BETA) in ordenes_semana]

nave_etas = {}
for p in pos_semana:
    if not p.NAVE: continue
    rep = db.query(ReporteEmbarques).filter(ReporteEmbarques.booking == p.BOOKING).first()
    n_name_raw = (rep.nave_arribo if rep and rep.nave_arribo else p.NAVE).strip().upper()
    n_name = n_name_raw.replace(" / ", " ").replace("/", " ")
    etd_val = p.ETD if p.ETD else p.ETA
    if etd_val:
        if n_name not in nave_etas or etd_val < nave_etas[n_name]:
            nave_etas[n_name] = etd_val

naves_ordenadas = sorted(nave_etas.items(), key=lambda x: (x[1], x[0]))

print("Naves de la Semana 24 ordenadas por ETD:")
for i, (nave, etd) in enumerate(naves_ordenadas):
    print(f"Posición {i+1}: {nave} - ETD: {etd}")

db.close()
