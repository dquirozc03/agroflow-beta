import os
import sys
from sqlalchemy import text

# Asegurar que el path incluya la raíz del backend
sys.path.append(os.getcwd())

from app.database import engine

def patch_roles():
    print("🛠️ Aplicando Parche de Maestros de Roles en Supabase...")
    with engine.connect() as conn:
        try:
            # 1. Crear tabla auth_roles si no existe
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS auth_roles (
                    id SERIAL PRIMARY KEY,
                    nombre_rol VARCHAR(50) UNIQUE NOT NULL,
                    descripcion VARCHAR(255),
                    permisos_plantilla JSONB NOT NULL,
                    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            
            # 2. Seed de roles base si están vacíos
            res = conn.execute(text("SELECT COUNT(*) FROM auth_roles")).fetchone()
            if res[0] == 0:
                print("🌱 Sembrando roles maestros base...")
                roles = [
                    ('ADMIN', 'Acceso total al sistema y configuración.', '{"logicapture": true, "maestros": true, "operaciones": true, "sistema": true}'),
                    ('SUPERVISOR', 'Supervisión de operaciones y reportes.', '{"logicapture": true, "maestros": true, "operaciones": true, "sistema": false}'),
                    ('OPERATIVO', 'Registro de campo y LogiCapture.', '{"logicapture": true, "maestros": false, "operaciones": false, "sistema": false}')
                ]
                for r in roles:
                    conn.execute(text("""
                        INSERT INTO auth_roles (nombre_rol, descripcion, permisos_plantilla)
                        VALUES (:nombre, :desc, :perm)
                    """), {"nombre": r[0], "desc": r[1], "perm": r[2]})
            
            conn.commit()
            print("✅ Roles maestros activos y sembrados.")
        except Exception as e:
            print(f"❌ Error al aplicar parche de roles: {e}")

if __name__ == "__main__":
    patch_roles()
