import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.routers.clientes_ie import ClienteIESchema, list_clientes_ie

db = SessionLocal()
clientes = list_clientes_ie(db)
for c in clientes:
    try:
        schema = ClienteIESchema.model_validate(c)
        print(f"SUCCESS: {schema.id} - {schema.nombre_legal}")
    except Exception as e:
        print(f"ERROR serializing {c.id} - {c.nombre_legal}: {e}")
