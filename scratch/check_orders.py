import os
os.environ["DATABASE_URL"] = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
os.environ["SYNC_TOKEN"] = "e2R5SKkbFn1nYRGW3b0CIxp_NVHl5eeCaEaE0bHrRv8"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.models.posicionamiento import Posicionamiento

engine = create_engine(os.environ["DATABASE_URL"])
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("--- BUSCANDO ORDENES EN POSICIONAMIENTO ---")
orders = ["BG0124", "BG0123", "124", "123", "BG124", "BG123"]
for o in orders:
    pos = db.query(Posicionamiento).filter(Posicionamiento.ORDEN_BETA.ilike(f"%{o}%")).all()
    print(f"Orden {o}: {len(pos)} registros")
    for p in pos:
        print(f"  ID: {p.ID} | Booking: {p.BOOKING} | Nave: {p.NAVE} | Estado: {p.ESTADO}")

db.close()
