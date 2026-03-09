import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import SessionLocal
from app.models.ie_models import CatPlanta

def seed_plantas():
    db = SessionLocal()
    try:
        # ICA
        planta_ica = db.query(CatPlanta).filter(CatPlanta.nombre == "ICA").first()
        if not planta_ica:
            planta_ica = CatPlanta(
                nombre="ICA", 
                direccion="CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU"
            )
            db.add(planta_ica)
            print("Planta ICA creada.")
        else:
            planta_ica.direccion = "CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU"
            print("Planta ICA actualizada.")
        
        db.commit()
    except Exception as e:
        print(f"Error seeding plantas: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_plantas()
