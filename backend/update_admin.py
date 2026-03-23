import os
import sys

# Agregar el directorio actual al path para importar la app
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.auth import Usuario

def update_admin():
    db = SessionLocal()
    try:
        admin = db.query(Usuario).filter(Usuario.usuario == "admin").first()
        if admin:
            admin.requiere_cambio_password = False
            db.commit()
            print("Usuario 'admin' actualizado localmente: ya no requiere cambio forzoso.")
        else:
            print("Error: No se encontró al usuario admin.")
    finally:
        db.close()

if __name__ == "__main__":
    update_admin()
