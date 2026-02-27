import sys
import os
from sqlalchemy import text

# Añadir el directorio raíz al path
sys.path.append(os.getcwd())

from app.database import SessionLocal

def list_all_invoices():
    db = SessionLocal()
    try:
        print("Listando todas las facturas en logistica_facturas...")
        sql = text("SELECT id, serie_correlativo, contenedor, creado_en FROM logistica_facturas ORDER BY creado_en DESC")
        rows = db.execute(sql).fetchall()
        
        if rows:
            for row in rows:
                print(f"ID: {row.id} | Serie: {row.serie_correlativo} | Contenedor: '{row.contenedor}' | Creado: {row.creado_en}")
        else:
            print("No hay facturas registradas en esta base de datos.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_all_invoices()
