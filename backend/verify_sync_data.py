import os
from sqlalchemy import create_engine, text
from app.configuracion import settings

def check_sync():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        # Contar filas en posic
        res = conn.execute(text("SELECT count(*) FROM ref_posicionamiento")).scalar()
        print(f"Total filas en ref_posicionamiento: {res}")
        
        # Ver los últimos 5 bookings
        latest = conn.execute(text("SELECT booking, actualizado_en FROM ref_posicionamiento ORDER BY actualizado_en DESC LIMIT 5")).fetchall()
        print("\nÚltimos 5 registros sincronizados:")
        for row in latest:
            print(f"- Booking: {row[0]} | Actualizado: {row[1]}")

if __name__ == "__main__":
    check_sync()
