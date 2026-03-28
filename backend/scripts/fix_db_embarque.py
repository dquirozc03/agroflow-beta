import sys
import os
from sqlalchemy import text

# Ajuste de path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.append(backend_root)

from app.database import engine

def drop_cultivo_column():
    print("🚀 Verificando y eliminando columna 'cultivo' en control_embarque...")
    try:
        with engine.connect() as connection:
            # SQL puro para eliminar la columna si existe
            connection.execute(text("ALTER TABLE control_embarque DROP COLUMN IF EXISTS cultivo;"))
            connection.commit()
            print("✅ Columna 'cultivo' eliminada exitosamente (o ya no existía).")
    except Exception as e:
        print(f"❌ Error al intentar eliminar la columna: {e}")

if __name__ == "__main__":
    drop_cultivo_column()
