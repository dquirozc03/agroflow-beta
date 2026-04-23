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

print("--- REVISIÓN GENERAL PEDIDOS ---")
total = db.query(PedidoComercial).count()
print(f"Total registros en PedidoComercial: {total}")

if total > 0:
    first = db.query(PedidoComercial).first()
    print(f"Muestra: ID {first.id} | Cliente: {first.cliente} | Orden: {first.orden_beta}")

db.close()
