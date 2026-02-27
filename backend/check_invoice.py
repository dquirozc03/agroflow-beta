import sys
import os
from sqlalchemy import text

# Añadir el directorio raíz al path
sys.path.append(os.getcwd())

from app.database import SessionLocal

def check_invoice():
    db = SessionLocal()
    try:
        # Buscamos la factura específica
        invoice = db.execute(text("SELECT * FROM logistica_facturas WHERE serie_correlativo = 'F050-121762'")).fetchone()
        if invoice:
            print(f"Factura encontrada: {invoice.serie_correlativo}")
            print(f"Forma Pago: {invoice.forma_pago}")
            print(f"Contenedor: {invoice.contenedor}")
            
            # Ver detalles
            detalles = db.execute(text(f"SELECT descripcion FROM logistica_facturas_detalles WHERE factura_id = {invoice.id}")).fetchall()
            print("Detalles (Resumen de servicios):")
            for d in detalles:
                print(f" - {d[0]}")
        else:
            print("No se encontró la factura F050-121762.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_invoice()
