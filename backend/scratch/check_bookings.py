from sqlalchemy import create_engine, text
import os

# Use the DATABASE_URL from the user's .env.local
db_url = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

engine = create_engine(db_url)

with engine.connect() as conn:
    print("--- 5 Bookings de PALTA ---")
    result = conn.execute(text("SELECT booking, cultivo, tipo_tecnologia, orden_beta FROM posicionamientos WHERE cultivo ILIKE '%PALTA%' LIMIT 5"))
    for row in result:
        print(f"Booking: {row[0]} | Cultivo: {row[1]} | Tech: {row[2]} | Orden: {row[3]}")
    
    print("\n--- 5 Bookings de GRANADA ---")
    result = conn.execute(text("SELECT booking, cultivo, tipo_tecnologia, orden_beta FROM posicionamientos WHERE cultivo ILIKE '%GRANADA%' LIMIT 5"))
    for row in result:
        print(f"Booking: {row[0]} | Cultivo: {row[1]} | Tech: {row[2]} | Orden: {row[3]}")
