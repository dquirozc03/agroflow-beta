import sys
import os

# Add the current directory to path so we can import app
sys.path.append(os.getcwd())

from sqlalchemy import text
from app.database import engine

def migrate():
    print("Iniciando migración para añadir columna requiere_cambio_password...")
    try:
        with engine.connect() as conn:
            # Intentar añadir la columna (funciona en PostgreSQL y SQLite)
            try:
                conn.execute(text("ALTER TABLE auth_usuarios ADD COLUMN requiere_cambio_password BOOLEAN DEFAULT FALSE"))
                conn.commit()
                print("Columna añadida con éxito.")
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                    print("La columna ya existe. No se requiere acción.")
                else:
                    print(f"Error al añadir columna: {e}")
                    # En SQLite si falla por sintaxis o algo, intentamos otra vez o ignoramos si es por existencia
    except Exception as e:
        print(f"Error de conexión: {e}")

if __name__ == "__main__":
    migrate()
