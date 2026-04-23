from app.database import SessionLocal
from app.models.maestros import VehiculoCarreta, VehiculoTracto
from sqlalchemy import func

db = SessionLocal()

# Trim all plates in VehiculoCarreta
carretas = db.query(VehiculoCarreta).all()
updated_carretas = 0
for c in carretas:
    trimmed = c.placa_carreta.strip().upper()
    if trimmed != c.placa_carreta:
        print(f"Trimming carreta: '{c.placa_carreta}' -> '{trimmed}'")
        c.placa_carreta = trimmed
        updated_carretas += 1

# Trim all plates in VehiculoTracto
tractos = db.query(VehiculoTracto).all()
updated_tractos = 0
for t in tractos:
    trimmed = t.placa_tracto.strip().upper()
    if trimmed != t.placa_tracto:
        print(f"Trimming tracto: '{t.placa_tracto}' -> '{trimmed}'")
        t.placa_tracto = trimmed
        updated_tractos += 1

if updated_carretas > 0 or updated_tractos > 0:
    db.commit()
    print(f"\nSUCCESS: Updated {updated_carretas} carretas and {updated_tractos} tractos.")
else:
    print("\nNo plates needed trimming.")

db.close()
