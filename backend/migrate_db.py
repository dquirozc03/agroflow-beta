from app.database import engine
from sqlalchemy import text

if __name__ == "__main__":
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE ie_registros_historial ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'ACTIVO'"))
            conn.execute(text("ALTER TABLE packing_cuadro_pedidos ADD COLUMN IF NOT EXISTS carton_content VARCHAR(100)"))
            conn.commit()
            print("Migrations successful")
        except Exception as e:
            print("Some migrations might have failed or are already applied:", e)
