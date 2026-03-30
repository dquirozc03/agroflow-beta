import sys
import os
from sqlalchemy import text

# Cambiar CWD al directorio del script
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database import engine

def apply_cleanup():
    print(f"🚀 Limpiando tabla 'clientes_ie' en: {engine.url.database}...")
    
    # SQL para remover la columna
    query = text("""
        DO $$ 
        BEGIN 
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='clientes_ie' AND column_name='nombres_alternativos') THEN
                ALTER TABLE clientes_ie DROP COLUMN nombres_alternativos;
                RAISE NOTICE 'Columna nombres_alternativos eliminada correctamente.';
            ELSE
                RAISE NOTICE 'La columna nombres_alternativos no existe.';
            END IF;
        END $$;
    """)

    try:
        with engine.connect() as conn:
            conn.execute(query)
            conn.commit()
            print("✅ Limpieza de base de datos exitosa.")
    except Exception as e:
        print(f"❌ Error al limpiar: {e}")

if __name__ == "__main__":
    apply_cleanup()
