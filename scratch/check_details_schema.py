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

def check_details():
    with engine.connect() as conn:
        print("Verificando columnas en 'detalle_emision_packing_list'...")
        res = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'detalle_emision_packing_list'
        """))
        existing_cols = [row[0] for row in res.fetchall()]
        print(f"Columnas existentes: {existing_cols}")

if __name__ == "__main__":
    check_details()
