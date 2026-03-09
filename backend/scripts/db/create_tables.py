from app.database import engine, Base
import app.models # Carga todos los modelos registrados en __init__.py
from sqlalchemy import text

print("Creando tablas faltantes...")
Base.metadata.create_all(bind=engine)
print("¡Tablas creadas con éxito!")

with engine.connect() as conn:
    print("Asegurándonos de que la tabla final tenga las columnas adicionales...")
    conn.execute(text("ALTER TABLE logistica_facturas ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(100)"))
    conn.execute(text("ALTER TABLE logistica_facturas ADD COLUMN IF NOT EXISTS advertencia VARCHAR(500)"))
    conn.execute(text("ALTER TABLE logistica_facturas ADD COLUMN IF NOT EXISTS descripcion VARCHAR(500)"))
    conn.execute(text("ALTER TABLE logistica_facturas ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(10)"))
    conn.commit()
    print("Columnas verificadas (Descripción y UM añadidas)")
