import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env vars
load_dotenv(".env.local")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env.local")
    sys.exit(1)

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT id, usuario, nombre, rol, activo FROM auth_usuarios"))
        print("\n--- Usuarios Encontrados en DB Local ---")
        for row in result:
            print(f"ID: {row.id} | User: {row.usuario} | Nombre: {row.nombre} | Rol: {row.rol} | Activo: {row.activo}")
        print("----------------------------------------\n")
except Exception as e:
    print(f"Error connecting to DB: {e}")
