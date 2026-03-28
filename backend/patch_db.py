import sys
import os
from sqlalchemy import text
from dotenv import load_dotenv

# Cambiar CWD al directorio del script para que Pydantic encuentre .env.local
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

load_dotenv(".env.local")

from app.database import engine

def patch():
    print("🚀 Patching AWS/Supabase DB columns...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS nombre_chofer VARCHAR(200);"))
            conn.execute(text("ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS licencia_chofer VARCHAR(100);"))
            conn.execute(text("ALTER TABLE logicapture_registros ADD COLUMN IF NOT EXISTS partida_registral VARCHAR(100);"))
            conn.commit()
            print("✅ Columns added successfully.")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    patch()
