import sys
import os
from dotenv import load_dotenv

cwd = os.getcwd()
if "backend" not in cwd:
    backend_path = os.path.join(cwd, "backend")
else:
    backend_path = cwd.split("backend")[0] + "backend"
sys.path.append(backend_path)

load_dotenv(os.path.join(backend_path, ".env.local"))

from app.database import Base, engine
import app.models.packing_list

def create_tables():
    print("Creando tablas de Packing List...")
    Base.metadata.create_all(bind=engine, tables=[
        app.models.packing_list.EmisionPackingList.__table__,
        app.models.packing_list.DetalleEmisionPackingList.__table__
    ])
    print("¡Tablas creadas con éxito!")

if __name__ == "__main__":
    create_tables()
