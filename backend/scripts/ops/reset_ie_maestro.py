import sys
import os
from sqlalchemy import text

# Ajustar el path para encontrar el backend (estando en scripts/ops)
_base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _base not in sys.path: sys.path.append(_base)

from app.database import engine

def hard_reset_maestro_tables():
    print(f"🚀 Iniciando Reestructuración Maestra en: {engine.url.database}...")
    
    commands = [
        # 1. Eliminar tablas antiguas por completo
        "DROP TABLE IF EXISTS clientes_ie_fito CASCADE",
        "DROP TABLE IF EXISTS clientes_ie CASCADE",
        "DROP TABLE IF EXISTS maestro_fitos CASCADE",
        
        # 2. Crear Maestro Fitos (Nueva estructura normalizada)
        """
        CREATE TABLE maestro_fitos (
            id SERIAL PRIMARY KEY,
            consignatario_fito VARCHAR(500) NOT NULL,
            direccion_fito VARCHAR(1000) NOT NULL,
            fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT _fito_data_uc UNIQUE (consignatario_fito, direccion_fito)
        )
        """,
        
        # 3. Crear Clientes IE (Nueva estructura con vinculación)
        """
        CREATE TABLE clientes_ie (
            id SERIAL PRIMARY KEY,
            nombre_legal VARCHAR(255) NOT NULL,
            cultivo VARCHAR(100),
            pais VARCHAR(100) NOT NULL,
            destino VARCHAR(100),
            consignatario_bl VARCHAR(500),
            direccion_consignatario VARCHAR(1000),
            notify_bl VARCHAR(500),
            direccion_notify VARCHAR(1000),
            eori_consignatario VARCHAR(100),
            eori_notify VARCHAR(100),
            emision_bl VARCHAR(100),
            estado VARCHAR(20) DEFAULT 'ACTIVO',
            fito_id INTEGER REFERENCES maestro_fitos(id) ON DELETE SET NULL,
            fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT _cliente_ruta_uc UNIQUE (nombre_legal, cultivo, pais, destino)
        )
        """
    ]

    try:
        with engine.connect() as conn:
            for cmd in commands:
                conn.execute(text(cmd))
            conn.commit()
            print("✅ Tablas Maetras reconfiguradas con éxito. Redundancia eliminada.")
    except Exception as e:
        print(f"❌ Error durante el reset: {e}")

if __name__ == "__main__":
    hard_reset_maestro_tables()
