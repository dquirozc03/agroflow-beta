import os
os.environ["DATABASE_URL"] = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
os.environ["SYNC_TOKEN"] = "e2R5SKkbFn1nYRGW3b0CIxp_NVHl5eeCaEaE0bHrRv8"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.models.pedido import PedidoComercial

engine = create_engine(os.environ["DATABASE_URL"])
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("--- BUSCANDO PEDIDOS COMERCIALES ---")
orders = ["124", "123", "0124", "0123"]
for o in orders:
    peds = db.query(PedidoComercial).filter(PedidoComercial.orden_beta == o).all()
    print(f"Orden {o}: {len(peds)} registros")
    for p in peds:
        print(f"  ID: {p.id} | Cliente: {p.cliente} | Variedad: {p.variedad}")

db.close()
