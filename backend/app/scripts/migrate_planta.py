import sqlalchemy as sa
from sqlalchemy import create_engine, text
import os

# Cadena de conexión desde .env.local
DATABASE_URL = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

def migrate():
    print("Iniciando migración manual: Agregando columna 'centro' a 'plantas'...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Comando SQL puro para inyectar la columna
            conn.execute(text("ALTER TABLE plantas ADD COLUMN IF NOT EXISTS centro VARCHAR(20)"))
            conn.commit()
            print("✅ ¡ÉXITO! La columna 'centro' ya está disponible en tu base de datos.")
        except Exception as e:
            print(f"❌ ERROR durante la migración: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
