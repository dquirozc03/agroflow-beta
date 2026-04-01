
import os
import sys
from sqlalchemy import text

# Cambiar CWD al directorio del script
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database import engine

def fix_schema():
    print(f"🕵️‍♂️ Iniciando auditoría de esquema ampliado en Supabase...")
    
    with engine.connect() as conn:
        # Colunas extra para Reporte Auditoría Carlos Style
        new_cols = [
            ("nombre_chofer", "VARCHAR(255)"),
            ("licencia_chofer", "VARCHAR(50)"),
            ("partida_registral", "VARCHAR(100)")
        ]

        for col_name, col_type in new_cols:
            try:
                conn.execute(text(f"ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                print(f"✅ Columna '{col_name}' verificada/creada.")
            except Exception as e:
                print(f"⚠️ Error al verificar '{col_name}': {e}")

        conn.commit()
    
    print("🚀 Cirugía de esquema Auditoría v2 completada.")

if __name__ == "__main__":
    fix_schema()
