import os
import sys

# Añadir el directorio base al path para que reconozca el módulo 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def run_db_update():
    print(">>> Iniciando actualización de base de datos para Auditoría de PL...")
    
    with engine.connect() as connection:
        # 1. Verificar si las columnas ya existen
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='emision_packing_list' 
            AND column_name IN ('usuario_anulacion', 'fecha_anulacion');
        """)
        existing_cols = connection.execute(check_query).fetchall()
        existing_names = [r[0] for r in existing_cols]
        
        # 2. Agregar usuario_anulacion si no existe
        if 'usuario_anulacion' not in existing_names:
            print("Agregando columna 'usuario_anulacion'...")
            connection.execute(text("ALTER TABLE emision_packing_list ADD COLUMN usuario_anulacion VARCHAR(100);"))
        else:
            print("Columna 'usuario_anulacion' ya existe.")
            
        # 3. Agregar fecha_anulacion si no existe
        if 'fecha_anulacion' not in existing_names:
            print("Agregando columna 'fecha_anulacion'...")
            connection.execute(text("ALTER TABLE emision_packing_list ADD COLUMN fecha_anulacion TIMESTAMPTZ;"))
        else:
            print("Columna 'fecha_anulacion' ya existe.")
            
        connection.commit()
        print(">>> Actualización de base de datos completada con éxito! 🚀")

if __name__ == "__main__":
    run_db_update()
