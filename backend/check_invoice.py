import sys
import os
from sqlalchemy import text

# Añadir el directorio raíz al path
sys.path.append(os.getcwd())

from app.database import SessionLocal

def check_invoice():
    db = SessionLocal()
    try:
        # Buscamos la factura específica de la imagen: F500-992682
        factura_id = "F500-992682"
        print(f"Buscando factura {factura_id} en la base de datos...")
        
        sql = text("SELECT id, proveedor_ruc, serie_correlativo, contenedor, creado_en FROM logistica_facturas WHERE serie_correlativo = :val")
        row = db.execute(sql, {"val": factura_id}).fetchone()
        
        if row:
            print(f"Factura encontrada!")
            print(f"ID: {row.id}")
            print(f"RUC: {row.proveedor_ruc}")
            print(f"Serie: {row.serie_correlativo}")
            print(f"Contenedor en BD: '{row.contenedor}'")
            print(f"Creado en: {row.creado_en}")
        else:
            print("No se encontró la factura con ese número correlativo.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_invoice()
