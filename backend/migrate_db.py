from app.database import engine
from sqlalchemy import text

if __name__ == "__main__":
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE ie_registros_historial ADD COLUMN estado VARCHAR(50) DEFAULT 'ACTIVO' NOT NULL"))
            conn.commit()
            print("Migration successful")
        except Exception as e:
            print("Migration failed or already applied:", e)
