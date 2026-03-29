import sys
import os
from sqlalchemy import text

# Cambiar CWD al directorio del script
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database import engine

def apply_migration():
    print(f"🚀 Verificando tabla 'clientes_ie' en: {engine.url.database}...")
    
    # SQL para agregar la columna si no existe (Safe way for Postgres)
    query = text("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='clientes_ie' AND column_name='cultivo') THEN
                ALTER TABLE clientes_ie ADD COLUMN cultivo VARCHAR(100);
                RAISE NOTICE 'Columna cultivo agregada correctamente.';
            ELSE
                RAISE NOTICE 'La columna cultivo ya existe.';
            END IF;
        END $$;
    """)

    try:
        with engine.connect() as conn:
            conn.execute(query)
            conn.commit()
            print("✅ El parche de base de datos se aplicó con éxito.")
    except Exception as e:
        print(f"❌ Error al aplicar el parche: {e}")

if __name__ == "__main__":
    apply_migration()
