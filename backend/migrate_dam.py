from app.database import engine
from sqlalchemy import text

if __name__ == "__main__":
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE ref_booking_dam ADD COLUMN licencia VARCHAR(50)"))
            conn.execute(text("ALTER TABLE ref_booking_dam ADD COLUMN chofer VARCHAR(150)"))
            conn.execute(text("ALTER TABLE ref_booking_dam ADD COLUMN placas VARCHAR(50)"))
            conn.execute(text("ALTER TABLE ref_booking_dam ADD COLUMN transportista VARCHAR(150)"))
            conn.commit()
            print("Migration successful")
        except Exception as e:
            print("Migration failed or already applied:", e)
