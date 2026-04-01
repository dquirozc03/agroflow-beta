import os
import sys

# Forzar variables de entorno para que Settings() no falle
os.environ["DATABASE_URL"] = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
os.environ["SYNC_TOKEN"] = "e2R5SKkbFn1nYRGW3b0CIxp_NVHl5eeCaEaE0bHrRv8"

# Ajustar el path para encontrar el backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.database import SessionLocal
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.embarque import ReporteEmbarques

def sync_db_with_excel_data():
    db = SessionLocal()
    try:
        # 1. Limpiar datos viejos de OGL
        print("--- INICIANDO LIMPIEZA DE DATOS OGL ---")
        db.query(ReporteEmbarques).delete() 
        
        # Insertar los datos exactos del Excel para la prueba
        datos_excel = [
            {"booking": "BK_001", "nave_arribo": "MSC RAYSHMI NX616A", "orden": "BG001"},
            {"booking": "BK_004", "nave_arribo": "MSC RAYSHMI NX612R", "orden": "BG004"},
            {"booking": "BK_002", "nave_arribo": "MSC RAYSHMI NX616A", "orden": "BG002"},
            {"booking": "BK_003", "nave_arribo": "MAERSK BULAN / 612N", "orden": "BG003"},
            {"booking": "BK_117", "nave_arribo": "SINAR BUKITTINGGI 069S (IGGT)", "orden": "BG117"}
        ]
        
        for d in datos_excel:
            # Crear entrada en ReporteEmbarques (fuente para el Packing List)
            new_shipment = ReporteEmbarques(
                booking=d["booking"],
                nave_arribo=d["nave_arribo"]
            )
            db.add(new_shipment)
            
            # Asegurar PedidoComercial con cliente OGL
            orden_num = d["orden"].replace("BG", "")
            pedido = db.query(PedidoComercial).filter(PedidoComercial.orden_beta == orden_num).first()
            if pedido:
                pedido.cliente = "OPINION GLOBAL"
                pedido.orden_beta = orden_num
            else:
                new_pedido = PedidoComercial(
                    orden_beta=orden_num,
                    cliente="OPINION GLOBAL",
                    variedad="WONDERFUL"
                )
                db.add(new_pedido)
                
            # Asegurar Posicionamiento correcto
            pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == d["booking"]).first()
            if not pos:
                new_pos = Posicionamiento(
                    BOOKING=d["booking"],
                    ORDEN_BETA=d["orden"],
                    NAVE=d["nave_arribo"]
                )
                db.add(new_pos)
            else:
                pos.ORDEN_BETA = d["orden"]
                pos.NAVE = d["nave_arribo"]

        db.commit()
        print("--- BASE DE DATOS SINCRONIZADA CON EXCEL CON EXITO ---")
        
    except Exception as e:
        db.rollback()
        print(f"Error sincronizando: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync_db_with_excel_data()
