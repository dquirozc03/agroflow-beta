import sys
import os

# Asegurar que el path incluya la raíz del backend
backend_root = os.path.dirname(os.path.abspath(__file__))
if backend_root not in sys.path:
    sys.path.append(backend_root)

from app.database import engine, Base
# Importar todos los modelos para que Base los registre
try:
    from app.models.auth import Usuario
    from app.models.maestros import Transportista, VehiculoTracto, VehiculoCarreta, Chofer
    from app.models.pedido import PedidoComercial
    from app.models.posicionamiento import Posicionamiento
    from app.models.auditoria import RegistroEvento
    print("📦 Modelos cargados correctamente.")
except ImportError as e:
    print(f"⚠️ Error al cargar modelos: {e}")
    sys.exit(1)

def sync_tables():
    print(f"🚀 Iniciando sincronización de esquemas en: {engine.url.database}...")
    try:
        # Base.metadata.create_all creará las tablas si no existen
        Base.metadata.create_all(bind=engine)
        print("✅ Sincronización exitosa. Las tablas 'vehiculos_tracto', 'vehiculos_carreta' y 'choferes' están listas.")
    except Exception as e:
        print(f"❌ Error crítico durante la sincronización: {e}")

if __name__ == "__main__":
    sync_tables()
