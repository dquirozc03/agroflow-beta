from app.database import SessionLocal
from app.models.maestros import VehiculoCarreta, VehiculoTracto

db = SessionLocal()

placa = "TLT990"

carreta = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == placa).first()
if carreta:
    print(f"CARRETA FOUND: {carreta.placa_carreta}")
else:
    print("CARRETA NOT FOUND in database")

tracto = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == placa).first()
if tracto:
    print(f"TRACTO FOUND: {tracto.placa_tracto}")
else:
    print("TRACTO NOT FOUND in database")

# List all carretas to see if there are similar ones
carretas = db.query(VehiculoCarreta).limit(10).all()
print("\nFirst 10 carretas in DB:")
for c in carretas:
    print(f"- '{c.placa_carreta}'")

db.close()
