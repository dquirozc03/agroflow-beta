
import os
import sys
from sqlalchemy import text

# Cambiar CWD al directorio del script
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database import engine

def fix_schema():
    print(f"🕵️‍♂️ Iniciando auditoría de esquema ampliado en Supabase...")
    
    with engine.connect() as conn:
        # Lista de nuevas columnas para el Ticket de Bandeja Premium
        new_cols = [
            ("status", "VARCHAR(50) DEFAULT 'PENDIENTE'"),
            ("motivo_anulacion", "VARCHAR(200)"),
            ("fecha_embarque", "TIMESTAMP WITH TIME ZONE"),
            ("planta", "VARCHAR(100)"),
            ("cultivo", "VARCHAR(100)"),
            ("codigo_sap", "VARCHAR(50)"),
            ("ruc_transportista", "VARCHAR(20)"),
            ("marca_tracto", "VARCHAR(50)"),
            ("cert_tracto", "VARCHAR(50)"),
            ("cert_carreta", "VARCHAR(50)")
        ]

        for col_name, col_type in new_cols:
            try:
                conn.execute(text(f"ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                print(f"✅ Columna '{col_name}' verificada/creada.")
            except Exception as e:
                print(f"⚠️ Error al verificar '{col_name}': {e}")

        conn.commit()
    
    print("🚀 Cirugía de esquema Premium completada.")

if __name__ == "__main__":
    fix_schema()
