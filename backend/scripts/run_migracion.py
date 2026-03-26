import os
import sys

# Añadir el directorio base al path para que reconozca el módulo 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def run_migration():
    sql_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sql", "migracion_v2_posicionamientos.sql")
    
    if not os.path.exists(sql_path):
        print(f"Error: No se encuentra el script SQL en {sql_path}")
        return

    with open(sql_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print(">>> Iniciando Saneamiento de Supabase (Inge Daniel Special)...")
    
    # Separar comandos por ';' cuidando de no romper bloques complejos si los hubiera
    # Para este script simple, el split por ';' funciona perfecto.
    commands = sql_content.split(";")
    
    try:
        with engine.connect() as connection:
            print("Ejecutando script completo...")
            connection.execute(text(sql_content))
            connection.commit()
            print("\n>>> Saneamiento y Creación de 'posicionamientos' Exitosa! 🚀")
            print(">>> Las tablas obsoletas han sido eliminadas y la nueva estructura está activa.")
            
    except Exception as e:
        print(f"\nError crítico durante la ejecución: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
