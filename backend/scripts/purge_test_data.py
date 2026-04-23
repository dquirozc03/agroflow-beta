import sys
import os

# Añadir el directorio raíz al path para poder importar la app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.logicapture import LogiCaptureRegistro, LogiCaptureDetalle
from app.models.instruccion import EmisionInstruccion
from app.models.packing_list import EmisionPackingList, DetalleEmisionPackingList

def purge():
    db = SessionLocal()
    try:
        print("Iniciando purga de datos de prueba en PRODUCCIÓN...")
        
        # 1. Limpiar LogiCapture (Registros de garita)
        db.query(LogiCaptureDetalle).delete()
        db.query(LogiCaptureRegistro).delete()
        print("- Se limpió LogiCapture.")
        
        # 2. Limpiar Historial de Instrucciones
        db.query(EmisionInstruccion).delete()
        print("- Se limpiaron Instrucciones.")
        
        # 3. Limpiar Historial de Packing List (Ordenado por FK)
        db.query(DetalleEmisionPackingList).delete()
        db.query(EmisionPackingList).delete()
        print("- Se limpiaron Packing Lists.")
        
        db.commit()
        print("\nPURGA COMPLETADA. El sistema está ahora en estado LIMPIO para producción.")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR durante la purga: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    purge()
