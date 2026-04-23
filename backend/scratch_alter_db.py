import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE posicionamientos ADD COLUMN destino_booking VARCHAR(100);"))
        print("Added destino_booking")
    except Exception as e:
        print(f"Error adding destino_booking: {e}")

    try:
        conn.execute(text("ALTER TABLE posicionamientos ADD COLUMN fecha_llenado_reporte DATE;"))
        print("Added fecha_llenado_reporte")
    except Exception as e:
        print(f"Error adding fecha_llenado_reporte: {e}")

    try:
        conn.execute(text("ALTER TABLE posicionamientos ADD COLUMN hora_llenado_reporte TIME;"))
        print("Added hora_llenado_reporte")
    except Exception as e:
        print(f"Error adding hora_llenado_reporte: {e}")

    try:
        conn.execute(text("ALTER TABLE posicionamientos ADD COLUMN tipo_tecnologia VARCHAR(100);"))
        print("Added tipo_tecnologia")
    except Exception as e:
        print(f"Error adding tipo_tecnologia: {e}")
    
    conn.commit()

print("Done")
