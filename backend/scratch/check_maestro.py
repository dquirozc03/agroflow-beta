from sqlalchemy import create_engine, text
import os

db_url = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
engine = create_engine(db_url)

with engine.connect() as conn:
    print("\n--- MAESTRO CLIENTES ---")
    clientes = conn.execute(text("SELECT id, nombre_legal, pais, cultivo FROM clientes_ie WHERE nombre_legal ILIKE '%BETA BEST%'")).fetchall()
    for c in clientes:
        print(c)
