from sqlalchemy import create_engine, text
from app.configuracion import settings
import os

def fix_history():
    print("🚀 Iniciando regularización de registros para DPEÑA...")
    engine = create_engine(settings.DATABASE_URL.strip())
    
    with engine.connect() as conn:
        try:
            # Actualizamos registros donde el usuario sea NULL o esté vacío
            sql = """
            UPDATE logicapture_registros 
            SET usuario_registro = 'DPEÑA' 
            WHERE usuario_registro IS NULL 
               OR usuario_registro = '' 
               OR usuario_registro = '---'
            """
            res = conn.execute(text(sql))
            conn.commit()
            print(f"✅ Se han regularizado {res.rowcount} registros históricos para el usuario DPEÑA.")
        except Exception as e:
            print(f"❌ Error durante la regularización: {e}")

if __name__ == "__main__":
    import sys
    sys.path.append(os.getcwd())
    fix_history()
