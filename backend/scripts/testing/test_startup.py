import sys
import os

# Asegurar que el path está bien
sys.path.append(os.getcwd())

try:
    print("Intentando importar app.main...")
    from app.main import app
    print("¡Importación exitosa!")
except Exception as e:
    print(f"ERROR DURANTE LA IMPORTACIÓN: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
