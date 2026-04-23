import os

# SET ENV VARS BEFORE IMPORTS
os.environ["DATABASE_URL"] = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
os.environ["SYNC_TOKEN"] = "e2R5SKkbFn1nYRGW3b0CIxp_NVHl5eeCaEaE0bHrRv8"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.models.posicionamiento import Posicionamiento
from app.models.embarque import ReporteEmbarques
from app.models.packing_list import EmisionPackingList, DetalleEmisionPackingList
from app.models.pedido import PedidoComercial

DB_URL = os.environ["DATABASE_URL"]

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("--- REVISIÓN DE NAVES OGL ---")

# 1. Buscar naves en el historial (lo que el usuario ve)
print("\n[HISTORIAL]")
historial = db.query(EmisionPackingList).order_by(EmisionPackingList.id.desc()).limit(10).all()
for h in historial:
    print(f"ID: {h.id} | Nave: {h.nave} | Estado: {h.estado} | Fecha: {h.fecha_generacion}")

# 2. Buscar si esas naves están en Posicionamiento
print("\n[POSICIONAMIENTO]")
naves_pos = db.query(Posicionamiento.NAVE).distinct().all()
naves_pos_list = [n[0] for n in naves_pos if n[0]]
print(f"Naves únicas en Posicionamiento ({len(naves_pos_list)}): {naves_pos_list[:10]}...")

# 3. Buscar si esas naves están en ReporteEmbarques
print("\n[REPORTE EMBARQUES]")
naves_rep = db.query(ReporteEmbarques.nave_arribo).distinct().all()
naves_rep_list = [n[0] for n in naves_rep if n[0]]
print(f"Naves únicas en ReporteEmbarques ({len(naves_rep_list)}): {naves_rep_list[:10]}...")

# 4. Ver por qué "MAERSK BATUR / 615N" no sale
vessel = "MAERSK BATUR / 615N"
print(f"\n--- Detalle para {vessel} ---")

pos_bookings = [p.BOOKING for p in db.query(Posicionamiento).filter(Posicionamiento.NAVE == vessel).all()]
print(f"Bookings en Posicionamiento: {len(pos_bookings)} -> {pos_bookings[:5]}")

rep_bookings = [r.booking for r in db.query(ReporteEmbarques).filter(ReporteEmbarques.nave_arribo == vessel).all()]
print(f"Bookings en ReporteEmbarques: {len(rep_bookings)} -> {rep_bookings[:5]}")

# 5. Check OGL Pedidos for these bookings
print("\n[PEDIDOS OGL]")
for b in pos_bookings:
    pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == b).first()
    if pos and pos.ORDEN_BETA:
        # Simplificamos el match de orden para debug
        import re
        numeric = re.sub(r'[^0-9]', '', pos.ORDEN_BETA.strip().upper())
        pedido = db.query(PedidoComercial).filter(
            PedidoComercial.orden_beta == numeric,
            PedidoComercial.cliente.ilike("%OGL%")
        ).first()
        if pedido:
            print(f"Booking {b} -> Orden {pos.ORDEN_BETA} -> ¡Pedido OGL ENCONTRADO! Cliente: {pedido.cliente}")
        # else:
        #    print(f"Booking {b} -> Orden {pos.ORDEN_BETA} -> Pedido OGL NO ENCONTRADO para orden {numeric}")

# 6. Check locks
locks = db.query(EmisionPackingList).filter(
    EmisionPackingList.nave == vessel,
    EmisionPackingList.estado == "ACTIVO"
).all()
print(f"\nPLs Activos para esta nave: {[l.id for l in locks]}")

db.close()
