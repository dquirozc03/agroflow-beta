from app.database import engine
from sqlalchemy import text

def update_schema():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE posicionamientos ADD COLUMN IF NOT EXISTS pais_booking VARCHAR(100)"))
            conn.commit()
            print("Columna pais_booking añadida exitosamente.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    update_schema()
