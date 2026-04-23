from app.database import SessionLocal
from app.models.maestros import VehiculoCarreta, VehiculoTracto

db = SessionLocal()

search = "TLT"

carretas = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta.ilike(f"%{search}%")).all()
print(f"CARRETAS LIKE '{search}':")
for c in carretas:
    print(f"- '{c.placa_carreta}'")

tractos = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto.ilike(f"%{search}%")).all()
print(f"\nTRACTOS LIKE '{search}':")
for t in tractos:
    print(f"- '{t.placa_tracto}'")

db.close()
