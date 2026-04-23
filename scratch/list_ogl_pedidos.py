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

print("--- LISTANDO PEDIDOS OGL ---")
peds = db.query(PedidoComercial).filter(PedidoComercial.cliente.ilike("%OGL%")).limit(20).all()
for p in peds:
    print(f"ID: {p.id} | Orden: {p.orden_beta} | Cliente: {p.cliente}")

db.close()
