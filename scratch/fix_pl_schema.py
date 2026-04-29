import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables de entorno desde .env.local
load_dotenv(dotenv_path="d:/PROJECTS/BETA/BETA LogiCapture 1.0/backend/.env.local")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL no encontrada.")
    exit(1)

engine = create_engine(DATABASE_URL.strip())

def fix_schema():
    cols_to_add = [
        ("estado", "VARCHAR(20) DEFAULT 'ACTIVO'"),
        ("motivo_anulacion", "VARCHAR(500)"),
        ("usuario_anulacion", "VARCHAR(100)"),
        ("fecha_anulacion", "TIMESTAMP WITH TIME ZONE"),
        ("archivo_nombre", "VARCHAR(500)")
    ]

    with engine.connect() as conn:
        print("Verificando columnas en 'emision_packing_list'...")
        
        # Obtener columnas existentes
        res = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'emision_packing_list'
        """))
        existing_cols = [row[0] for row in res.fetchall()]
        print(f"Columnas existentes: {existing_cols}")

        for col_name, col_type in cols_to_add:
            if col_name not in existing_cols:
                print(f"Añadiendo columna '{col_name}'...")
                try:
                    conn.execute(text(f"ALTER TABLE emision_packing_list ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Columna '{col_name}' añadida con éxito.")
                except Exception as e:
                    print(f"Error al añadir '{col_name}': {e}")
            else:
                print(f"La columna '{col_name}' ya existe.")

if __name__ == "__main__":
    fix_schema()
