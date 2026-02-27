
import sys
import os

# Add backend directory to sys.path
BACKEND_DIR = r"d:\PROJECTS\BETA\BETA LogiCapture 1.0\backend"
sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal
from app.models.catalogos import Vehiculo, Transportista
from sqlalchemy.orm import joinedload

def test_lookup():
    db = SessionLocal()
    # Test case based on user's manual entry or similar
    # The user didn't provide specific input payload, but let's assume a standard format
    placas_input = "D6P710/C5A977" 
    
    print(f"Testing with placas: {placas_input}")
    
    placas_raw = (placas_input or "").strip().upper()
    parts = [p.strip() for p in placas_raw.split("/")] if placas_raw else []
    tracto = parts[0] if len(parts) > 0 else ""
    carreta = parts[1] if len(parts) > 1 else ""
    
    print(f"Parsed: Tracto='{tracto}', Carreta='{carreta}'")
    
    if not tracto or not carreta:
        print("Error: Missing tracto or carreta")
        return

    try:
        vehiculo = (
            db.query(Vehiculo)
            .options(joinedload(Vehiculo.transportista))
            .filter(Vehiculo.placa_tracto == tracto)
            .first()
        )
        
        if vehiculo:
            print(f"Found Vehicle ID: {vehiculo.id}")
            print(f"Cert Vehicular: {vehiculo.cert_vehicular}")
            if vehiculo.transportista:
                 print(f"Transportista: {vehiculo.transportista.nombre_transportista}")
            else:
                 print("Error: Vehicle has no transportista")
        else:
            print("Error: Vehiculo not found")
            
    except Exception as e:
        print(f"EXCEPTION: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_lookup()
