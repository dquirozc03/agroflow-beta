import sys
import os

# Buscamos la carpeta 'backend' para añadirla al path
cwd = os.getcwd()
if "backend" not in cwd:
    backend_path = os.path.join(cwd, "backend")
else:
    # Ya estamos en backend o en una subcarpeta
    backend_path = cwd.split("backend")[0] + "backend"

sys.path.append(backend_path)
print(f"Backend path added: {backend_path}")

try:
    from app.database import SessionLocal
    from app.models.pedido import PedidoComercial
    print("Módulos importados correctamente.")
except ImportError as e:
    print(f"Error al importar: {e}")
    sys.exit(1)

def check_order(order_num):
    db = SessionLocal()
    try:
        search_val = str(order_num)
        print(f"Buscando Orden Beta: '{search_val}'...")
        pedidos = db.query(PedidoComercial).filter(PedidoComercial.orden_beta == search_val).all()
        
        if not pedidos:
            print(f"No se encontró la orden '{search_val}' en la tabla pedidos_comerciales.")
            parciales = db.query(PedidoComercial).filter(PedidoComercial.orden_beta.like(f"%{search_val}%")).all()
            if parciales:
                print(f"Se encontraron {len(parciales)} coincidencias parciales:")
                for p in parciales:
                    print(f"- ID: {p.id}, Orden: {p.orden_beta}, PO: {p.po}, Cliente: {p.cliente}")
        else:
            print(f"¡Se encontró la orden {search_val}! Filas encontradas: {len(pedidos)}")
            for p in pedidos:
                print(f"\n--- [ Fila ID: {p.id} ] ---")
                print(f"PLANTA: {p.planta}")
                print(f"ORDEN BETA: {p.orden_beta}")
                print(f"PO: {p.po if p.po and p.po.strip() else '--- NO TIENE PO ---'}")
                print(f"CLIENTE: {p.cliente}")
                print(f"CONSIGNATARIO: {p.consignatario}")
                print(f"CULTIVO: {p.cultivo}")
                print(f"TOTAL CAJAS: {p.total_cajas}")
                print(f"ULTIMA ACTUALIZACION: {p.fecha_actualizacion}")
    except Exception as e:
        print(f"Error en la consulta: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_order("161")
