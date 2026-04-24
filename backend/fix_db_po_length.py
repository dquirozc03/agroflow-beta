import sys
import os
from sqlalchemy import text

sys.path.append(os.getcwd())

try:
    from app.database import engine
    
    with engine.connect() as conn:
        print("Ampliando columna 'po' a 500 caracteres...")
        # Cambiamos el tipo de la columna
        conn.execute(text("ALTER TABLE clientes_ie ALTER COLUMN po TYPE VARCHAR(500);"))
        conn.commit()
        print("SUCCESS: Columna PO ampliada a 500 caracteres.")
except Exception as e:
    print("ERROR: " + str(e))
