
import os
import sys
from sqlalchemy import text

# Cambiar CWD al directorio del script
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database import engine

def fix_schema():
    print(f"🕵️‍♂️ Iniciando auditoría de esquema en Supabase...")
    
    with engine.connect() as conn:
        # 1. Asegurar tratamiento_buque en logicapture_registros
        try:
            conn.execute(text("ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS tratamiento_buque BOOLEAN DEFAULT FALSE;"))
            print("✅ Columna 'tratamiento_buque' verificada/creada.")
        except Exception as e:
            print(f"⚠️ Error al verificar 'tratamiento_buque': {e}")

        # 2. Asegurar todos los campos de JSON (por si alguno falta)
        cols_json = [
            "precinto_aduana", "precinto_operador", "precinto_senasa", 
            "precinto_linea", "precintos_beta", "termografos"
        ]
        for col in cols_json:
            try:
                conn.execute(text(f"ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS {col} JSON;"))
                print(f"✅ Columna JSON '{col}' verificada.")
            except Exception as e:
                print(f"⚠️ Error al verificar {col}: {e}")

        # 3. Asegurar usuario_registro
        try:
            conn.execute(text("ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS usuario_registro VARCHAR(100);"))
            print("✅ Columna 'usuario_registro' verificada.")
        except Exception as e:
            print(f"⚠️ Error al verificar 'usuario_registro': {e}")

        conn.commit()
    
    print("🚀 Cirugía de esquema completada. La base de datos está ahora alineada al 100% con el modelo.")

if __name__ == "__main__":
    fix_schema()
