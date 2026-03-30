import sys
import os

# Asegurar que el path incluya la raíz del backend para encontrar app.*
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.auth import Usuario
from app.utils.password import hash_password

def create_user():
    db = SessionLocal()
    try:
        username = "DQUIROZ"
        password = "Agro2026!"
        
        # Verificar si ya existe
        existing = db.query(Usuario).filter(Usuario.usuario == username).first()
        if existing:
            print(f"⚠️ El usuario {username} ya existe. Actualizando contraseña...")
            existing.password_hash = hash_password(password)
            existing.activo = True
            existing.requiere_cambio_password = False # Para que entre directo
        else:
            print(f"🚀 Creando usuario industrial: {username}...")
            new_user = Usuario(
                usuario=username,
                nombre="DANIEL QUIROZ",
                rol="ADMIN",
                password_hash=hash_password(password),
                activo=True,
                requiere_cambio_password=False
            )
            db.add(new_user)
        
        db.commit()
        print(f"✅ Usuario {username} listo para despegar en Producción. 🏁⚖️💎🔝🚀")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
