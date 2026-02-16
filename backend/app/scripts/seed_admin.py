"""
Script para crear el primer usuario administrador.
Ejecutar una vez después de aplicar la migración auth_usuarios:

  cd backend
  python -m app.scripts.seed_admin

Por defecto crea usuario 'admin' con contraseña 'admin' (cambiar en producción).
Variables de entorno opcionales: SEED_USUARIO, SEED_PASSWORD, SEED_NOMBRE.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.auth import Usuario
from app.utils.password import hash_password


def main():
    usuario = os.environ.get("SEED_USUARIO", "admin")
    password = os.environ.get("SEED_PASSWORD", "admin")
    nombre = os.environ.get("SEED_NOMBRE", "Administrador")

    db = SessionLocal()

    try:
        existing = db.query(Usuario).filter(Usuario.usuario == usuario).first()
        if existing:
            print(f"Ya existe el usuario '{usuario}'. No se crea nada.")
            return
        password_hash = hash_password(password)
        user = Usuario(
            usuario=usuario,
            password_hash=password_hash,
            nombre=nombre,
            rol="administrador",
            activo=True,
        )
        db.add(user)
        db.commit()
        print(f"Usuario '{usuario}' creado correctamente. Rol: administrador.")
        if usuario == "admin" and password == "admin":
            print("  ⚠ En producción cambie la contraseña de admin (no dejar 'admin').")
    finally:
        db.close()


if __name__ == "__main__":
    main()
