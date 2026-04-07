import sys
import os

# Asegurar que el script encuentre la carpeta 'app'
sys.path.append(os.getcwd())

from app.database import engine
from sqlalchemy import text

def fix_db_anexo1():
    """
    Script de emergencia para inyectar campos de pesaje en Producción.
    Evita el error 500 (CORS) causado por desajuste de esquema.
    """
    queries = [
        "ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS peso_bruto NUMERIC(10, 2);",
        "ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS peso_tara_contenedor NUMERIC(10, 2);",
        "ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS peso_neto_carga NUMERIC(10, 2);"
    ]
    
    try:
        with engine.connect() as conn:
            for q in queries:
                print(f"Ejecutando: {q}")
                conn.execute(text(q))
                conn.commit()
        print("✅ Base de Datos actualizada para Anexo 1 con éxito! 🚀")
    except Exception as e:
        print(f"❌ Error al actualizar DB: {str(e)}")

if __name__ == "__main__":
    fix_db_anexo1()
