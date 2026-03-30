import os
import sys
from sqlalchemy import text

# Asegurar que el path incluya la raíz del backend
sys.path.append(os.getcwd())

from app.database import engine

def patch_db():
    print("🛠️ Aplicando Parche de Permisos Granulares (JSONB) en Supabase...")
    with engine.connect() as conn:
        try:
            # 1. Añadir columna permisos si no existe
            conn.execute(text("""
                ALTER TABLE auth_usuarios 
                ADD COLUMN IF NOT EXISTS permisos JSONB 
                DEFAULT '{"logicapture": true, "maestros": true, "operaciones": true, "sistema": false}'::jsonb;
            """))
            # 2. Actualizar registros existentes (por si acaso)
            conn.execute(text("""
                UPDATE auth_usuarios 
                SET permisos = '{"logicapture": true, "maestros": true, "operaciones": true, "sistema": false}'::jsonb 
                WHERE permisos IS NULL;
            """))
            conn.commit()
            print("✅ Parche aplicado exitosamente. El sistema de permisos está activo.")
        except Exception as e:
            print(f"❌ Error al aplicar parche: {e}")

if __name__ == "__main__":
    patch_db()
