import os
from sqlalchemy import create_engine, text

# Conectar directamente usando la URL de .env.local
DATABASE_URL = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

print("Connecting to database...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # 1. Choferes
    try:
        conn.execute(text("ALTER TABLE choferes ADD COLUMN vencimiento_licencia DATE;"))
        print("Added vencimiento_licencia to choferes")
    except Exception as e:
        print(f"Error adding vencimiento_licencia: {e}")

    # 2. Vehiculos Tracto
    try:
        conn.execute(text("ALTER TABLE vehiculos_tracto ADD COLUMN vencimiento_tarjeta_circulacion DATE;"))
        print("Added vencimiento_tarjeta_circulacion to vehiculos_tracto")
    except Exception as e:
        print(f"Error adding vencimiento_tarjeta_circulacion: {e}")

    try:
        conn.execute(text("ALTER TABLE vehiculos_tracto ADD COLUMN vencimiento_soat DATE;"))
        print("Added vencimiento_soat to vehiculos_tracto")
    except Exception as e:
        print(f"Error adding vencimiento_soat: {e}")

    # 3. Vehiculos Carreta
    try:
        conn.execute(text("ALTER TABLE vehiculos_carreta ADD COLUMN vencimiento_tarjeta_circulacion DATE;"))
        print("Added vencimiento_tarjeta_circulacion to vehiculos_carreta")
    except Exception as e:
        print(f"Error adding vencimiento_tarjeta_circulacion: {e}")

    try:
        conn.execute(text("ALTER TABLE vehiculos_carreta ADD COLUMN vencimiento_soat DATE;"))
        print("Added vencimiento_soat to vehiculos_carreta")
    except Exception as e:
        print(f"Error adding vencimiento_soat: {e}")

    conn.commit()

print("Database modification completed successfully.")
