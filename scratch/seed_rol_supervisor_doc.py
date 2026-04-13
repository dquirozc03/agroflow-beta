"""
Script para crear el rol "SUPERVISOR DOCUMENTARIO" en la base de datos.
Ejecutar desde la raíz del proyecto: python scratch/seed_rol_supervisor_doc.py
"""
import sys
import os
from dotenv import load_dotenv

# Setup path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_path)
load_dotenv(os.path.join(backend_path, ".env.local"))

from app.database import SessionLocal
from app.models.auth import RolMaster

def seed_rol():
    db = SessionLocal()
    try:
        # Verificar si ya existe
        existente = db.query(RolMaster).filter(RolMaster.nombre_rol == "SUPERVISOR DOCUMENTARIO").first()
        if existente:
            print(f"✅ El rol 'SUPERVISOR DOCUMENTARIO' ya existe (ID: {existente.id}). No se necesita hacer nada.")
            return

        nuevo_rol = RolMaster(
            nombre_rol="SUPERVISOR DOCUMENTARIO",
            descripcion="Supervisión y control de documentos de exportación. Autorizado para anular Packing Lists.",
            permisos_plantilla={
                "lc_registro": False,
                "lc_bandeja": True,
                "op_instrucciones": True,
                "op_packing_list": True,
                "m_bulk": False,
                "m_contenedores": False,
                "m_transportistas": False,
                "m_vehiculos": False,
                "m_choferes": False,
                "m_clientes_ie": True,
                "sys_usuarios": False,
                "sys_roles": False
            }
        )
        db.add(nuevo_rol)
        db.commit()
        db.refresh(nuevo_rol)
        print(f"✅ Rol 'SUPERVISOR DOCUMENTARIO' creado exitosamente con ID: {nuevo_rol.id}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear el rol: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_rol()
