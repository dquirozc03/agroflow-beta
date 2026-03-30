import os
import sys
from sqlalchemy.orm import Session

# Añadir el path para importar app
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine
from app.models.maestros import Planta

def seed_plantas():
    db = SessionLocal()
    try:
        # Planta ICA
        planta_ica = db.query(Planta).filter(Planta.planta == "ICA").first()
        if not planta_ica:
            print("Insertando Planta ICA...")
            planta_ica = Planta(
                planta="ICA",
                direccion="ICA CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU",
                ubigeo="110111"
            )
            db.add(planta_ica)
            
        # Planta CHINCHA (Beta suele tener ambas)
        planta_chincha = db.query(Planta).filter(Planta.planta == "CHINCHA").first()
        if not planta_chincha:
            print("Insertando Planta CHINCHA...")
            planta_chincha = Planta(
                planta="CHINCHA",
                direccion="CALLE LEOPOLDO CARRILLO NRO. 160 - CHINCHA ALTA - PERU",
                ubigeo="110201"
            )
            db.add(planta_chincha)
            
        db.commit()
        print("Master de Plantas actualizado con éxito en Producción. 🛡️🏢🚀")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_plantas()
