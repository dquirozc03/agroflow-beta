"""
Crea usuarios de prueba para todos los roles (admin, supervisor, facturador, documentaria).
Ejecutar después de aplicar la migración auth_usuarios:

  cd backend
  python -m app.scripts.seed_all_roles

Contraseña por defecto = nombre de usuario (cambiar en producción).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.auth import Usuario
from app.utils.password import hash_password

USERS = [
    ("admin", "Administrador", "administrador"),
    ("supervisor", "Supervisor Facturación", "supervisor_facturacion"),
    ("facturador", "Facturador", "facturador"),
    ("doc", "Documentaría", "documentaria"),
    ("gerencia", "Gerencia General", "gerencia"),
]


def main():
    db = SessionLocal()
    try:
        for usuario, nombre, rol in USERS:
            existing = db.query(Usuario).filter(Usuario.usuario == usuario).first()
            if existing:
                print(f"  Ya existe: {usuario}")
                continue
            password_hash = hash_password(usuario)
            db.add(Usuario(usuario=usuario, password_hash=password_hash, nombre=nombre, rol=rol, activo=True))
            print(f"  Creado: {usuario} ({rol})")
        db.commit()
        print("\n  ⚠ En producción cambie las contraseñas de estos usuarios (ahora = nombre de usuario).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
