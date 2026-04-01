# Ajustar el path para encontrar el backend (estando en scripts/testing)
_base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _base not in sys.path: sys.path.append(_base)

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
