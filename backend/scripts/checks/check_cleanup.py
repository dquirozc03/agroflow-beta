import sys
import os
from sqlalchemy import text

# Añadir el directorio raíz al path
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine

def check_and_cleanup():
    db = SessionLocal()
    try:
        # Verificar registros actuales
        res_facturas = db.execute(text("SELECT count(*) FROM logistica_facturas")).scalar()
        res_detalles = db.execute(text("SELECT count(*) FROM logistica_factura_detalles")).scalar()
        
        print(f"Registros encontrados: Facturas={res_facturas}, Detalles={res_detalles}")
        
        if res_facturas > 0 or res_detalles > 0:
            print("Procediendo con la eliminación...")
            # Usar TRUNCATE con CASCADE para una limpieza total y reinicio de IDs si es necesario
            db.execute(text("TRUNCATE TABLE logistica_factura_detalles, logistica_facturas RESTART IDENTITY CASCADE"))
            db.commit()
            print("Limpieza completada.")
            
            # Verificar después
            new_count = db.execute(text("SELECT count(*) FROM logistica_facturas")).scalar()
            print(f"Conteo final: {new_count}")
        else:
            print("La base de datos ya estaba limpia o no se encontraron los registros.")
            
    except Exception as e:
        print(f"Error técnico: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    check_and_cleanup()
