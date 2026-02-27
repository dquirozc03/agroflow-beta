import sys
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://neondb_owner:npg_YJ1tMQzo8uIm@ep-broad-mud-aipz3jiw.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def migrate():
    print("Iniciando migración manual para Neon DB...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            print("Conexión establecida.")
            # Añadir la columna si no existe
            sql = "ALTER TABLE auth_usuarios ADD COLUMN IF NOT EXISTS requiere_cambio_password BOOLEAN DEFAULT FALSE"
            conn.execute(text(sql))
            conn.commit()
            print("Migración completada con éxito (ALTER TABLE ... IF NOT EXISTS).")
            
            # También asegurar que intentos_fallidos y bloqueado existan por si acaso
            conn.execute(text("ALTER TABLE auth_usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER DEFAULT 0"))
            conn.execute(text("ALTER TABLE auth_usuarios ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Columnas de seguridad verificadas.")
            
    except Exception as e:
        print(f"Error durante la migración: {e}")

if __name__ == "__main__":
    migrate()
