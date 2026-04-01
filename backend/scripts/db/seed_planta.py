import os
import sys

# Agregar la ruta del backend al sys.path para imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.database import engine, Base
from app.models.maestros import Planta
from sqlalchemy.orm import Session

# Crear tablas
Base.metadata.create_all(bind=engine)

# Insertar ICA
db = Session(bind=engine)
planta = db.query(Planta).filter_by(planta="ICA").first()
if not planta:
    nueva_planta = Planta(
        planta="ICA",
        direccion="CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU",
        ubigeo="110111"
    )
    db.add(nueva_planta)
    db.commit()
    print("Planta ICA creada con éxito.")
else:
    print("Planta ICA ya existe.")
db.close()
