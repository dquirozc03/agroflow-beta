import os
import sys

# Agregar el directorio actual al path para importar la app
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.auth import Usuario
from app.utils.password import hash_password

def seed():
    db = SessionLocal()
    try:
        # Verificar si ya existe un admin
        admin = db.query(Usuario).filter(Usuario.usuario == "admin").first()
        if admin:
            print("El usuario 'admin' ya existe en esta DB.")
            return

        print("Creando usuario administrador inicial...")
        nuevo_admin = Usuario(
            usuario="admin",
            nombre="Administrador AgroFlow",
            rol="administrador",
            password_hash=hash_password("Agro2026!"), # Contraseña inicial segura
            activo=True,
            requiere_cambio_password=True
        )
        db.add(nuevo_admin)
        db.commit()
        print("Administrador creado exitosamente.")
        print("Usuario: admin")
        print("Password temporal: Agro2026!")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed()
