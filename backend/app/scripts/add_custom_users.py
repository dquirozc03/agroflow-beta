
import os
import sys

# Definir explícitamente la ruta al backend
BACKEND_DIR = r"d:\PROJECTS\BETA\BETA LogiCapture 1.0\backend"
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from app.database import SessionLocal
    from app.models.auth import Usuario
    from app.utils.password import hash_password
except ImportError as e:
    print(f"Error de importación: {e}")
    sys.exit(1)

# Format: (username, password, description, role)
NEW_USERS = [
    ("DQUIROZ", "BetaTester", "Administrador (DQUIROZ)", "administrador"),
    ("DCHERO", "Beta2026", "Facturador (DCHERO)", "facturador"),
]

def main():
    print(f"Conectando a BD usando rutas desde: {BACKEND_DIR}")
    db = SessionLocal()
    try:
        print("Iniciando creación de usuarios personalizados...")
        for usuario, password, nombre, rol in NEW_USERS:
            existing = db.query(Usuario).filter(Usuario.usuario == usuario).first()
            if existing:
                print(f"  [OMITIDO] El usuario '{usuario}' ya existe.")
                # Si quisieras actualizar password, descomenta:
                # existing.password_hash = hash_password(password)
                # db.add(existing)
                # print(f"  [ACTUALIZADO] Password de {usuario}")
                continue
            
            hashed = hash_password(password)
            new_user = Usuario(
                usuario=usuario,
                password_hash=hashed,
                nombre=nombre,
                rol=rol,
                activo=True
            )
            db.add(new_user)
            print(f"  [CREADO] Usuario: {usuario} | Rol: {rol}")
        
        db.commit()
        print("\nProceso finalizado exitosamente.")
        
    except Exception as e:
        print(f"\n[ERROR] Ocurrió un error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
