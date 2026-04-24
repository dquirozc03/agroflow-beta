import sys
import os
from sqlalchemy import text

sys.path.append(os.getcwd())

try:
    from app.database import engine
    
    with engine.connect() as conn:
        # Intentamos la migracion
        conn.execute(text("ALTER TABLE clientes_ie ADD COLUMN IF NOT EXISTS po VARCHAR(50);"))
        conn.commit()
        print("SUCCESS: Columna PO verificada en la base de datos.")
except Exception as e:
    print("ERROR: " + str(e))
