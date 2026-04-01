import sys
import os

# Cambiar CWD al directorio del script para que Pydantic encuentre .env.local
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Asegurar que el path incluya la raíz del backend (que ahora es el CWD)
sys.path.append(os.getcwd())

from app.database import engine, Base
# Importar todos los modelos para que Base los registre
try:
    from app.models.auth import Usuario
    from app.models.maestros import Transportista, VehiculoTracto, VehiculoCarreta, Chofer
    from app.models.pedido import PedidoComercial
    from app.models.posicionamiento import Posicionamiento
    from app.models.auditoria import RegistroEvento
    from app.models.embarque import ControlEmbarque
    from app.models.logicapture import LogiCaptureRegistro, LogiCaptureDetalle
    print("📦 Modelos cargados correctamente.")
except ImportError as e:
    print(f"⚠️ Error al cargar modelos: {e}")
    sys.exit(1)

def sync_tables():
    print(f"🚀 Iniciando sincronización de esquemas en: {engine.url.database}...")
    try:
        # Base.metadata.create_all creará las tablas si no existen
        Base.metadata.create_all(bind=engine)
        print("✅ Sincronización exitosa. Las tablas de LogiCapture y maestros están listas.")
    except Exception as e:
        print(f"❌ Error crítico durante la sincronización: {e}")

if __name__ == "__main__":
    sync_tables()
