import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.packing_list import EmisionPackingList
import re

db = SessionLocal()

emisiones = db.query(EmisionPackingList).filter(
    EmisionPackingList.estado == "ACTIVO"
).all()

print("Packing Lists ACTIVOS en la BD que contienen WK24:")
for em in emisiones:
    em_id = getattr(em, "pl_id", None) or getattr(em, "archivo_nombre", "")
    m = re.search(r'WK24\d+', em_id or "")
    if m:
        print(f"ID: {em.id} | Nave: {em.nave} | Archivo/PL_ID: {em_id} | Capturado: {m.group(0)}")

db.close()
