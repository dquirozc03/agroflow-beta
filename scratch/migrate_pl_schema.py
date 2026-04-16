import sys
import os

# Ajustar path para encontrar el módulo app
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", "backend"))
sys.path.append(project_root)

from sqlalchemy import text
from app.database import engine

def migrate():
    print("Iniciando migracion manual: Agregando orden_beta a detalle_emision_packing_list...")
    with engine.connect() as conn:
        try:
            # Primero verificamos si ya existe para evitar errores raros
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='detalle_emision_packing_list' AND column_name='orden_beta';
            """))
            if result.fetchone():
                print("La columna 'orden_beta' ya existe. No se requiere accion.")
            else:
                conn.execute(text("ALTER TABLE detalle_emision_packing_list ADD COLUMN orden_beta VARCHAR(100);"))
                conn.commit()
                print("Columna 'orden_beta' agregada exitosamente.")
        except Exception as e:
            print(f"Error durante la migracion: {e}")

if __name__ == "__main__":
    migrate()
