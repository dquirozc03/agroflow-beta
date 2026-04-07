from sqlalchemy import create_engine, text
from app.configuracion import settings
import os

def migrate():
    print("🚀 Agregando columna 'num_guia' a la tabla 'logicapture_registros'...")
    engine = create_engine(settings.DATABASE_URL.strip())
    
    with engine.connect() as conn:
        try:
            # SQL compatible con PostgreSQL/SQLite
            conn.execute(text("ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS num_guia VARCHAR(50)"))
            conn.commit()
            print("✅ Columna 'num_guia' añadida exitosamente.")
        except Exception as e:
            print(f"⚠️ Error o columna ya existente: {e}")

if __name__ == "__main__":
    import sys
    sys.path.append(os.getcwd())
    migrate()
