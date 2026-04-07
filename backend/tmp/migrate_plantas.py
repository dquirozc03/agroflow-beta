from sqlalchemy import create_engine, text
from app.configuracion import settings
import os

def migrate():
    print("🚀 Iniciando migración de tabla 'plantas'...")
    engine = create_engine(settings.DATABASE_URL.strip())
    
    with engine.connect() as conn:
        # 1. Agregar columnas si no existen (PostgreSQL/SQLite compatible)
        try:
            print("💎 Añadiendo columnas regionales...")
            conn.execute(text("ALTER TABLE plantas ADD COLUMN IF NOT EXISTS distrito VARCHAR(100)"))
            conn.execute(text("ALTER TABLE plantas ADD COLUMN IF NOT EXISTS provincia VARCHAR(100)"))
            conn.execute(text("ALTER TABLE plantas ADD COLUMN IF NOT EXISTS departamento VARCHAR(100)"))
            conn.commit()
            print("✅ Columnas añadidas con éxito.")
        except Exception as e:
            print(f"⚠️ Error al añadir columnas (tal vez ya existen): {e}")

        # 2. Poblar datos para Sede ICA
        try:
            print("📍 Actualizando datos para Sede ICA...")
            # Buscamos plantas que contengan 'ICA' o el nombre específico
            res = conn.execute(text("UPDATE plantas SET distrito = 'SANTIAGO', provincia = 'ICA', departamento = 'ICA' WHERE planta ILIKE '%ICA%' OR planta ILIKE '%SANTA MARGARITA%'"))
            conn.commit()
            print(f"✅ Se actualizaron {res.rowcount} registros para ICA.")
        except Exception as e:
            print(f"❌ Error al poblar datos: {e}")

if __name__ == "__main__":
    # Asegurarnos de que el path sea correcto para importar app
    import sys
    sys.path.append(os.getcwd())
    migrate()
