import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE posicionamientos ADD COLUMN etiqueta_caja VARCHAR(100);"))
        print("Added etiqueta_caja")
    except Exception as e:
        print(f"Error adding etiqueta_caja: {e}")
    
    conn.commit()

print("Done")
