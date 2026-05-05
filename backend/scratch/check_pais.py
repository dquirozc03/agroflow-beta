from sqlalchemy import create_engine, text
import os

db_url = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
engine = create_engine(db_url)

with engine.connect() as conn:
    print("\n--- PEDIDOS BG190 ---")
    peds = conn.execute(text("SELECT orden_beta, cliente, cultivo, pais FROM pedidos_comerciales WHERE orden_beta ILIKE '%190%'")).fetchall()
    for p in peds:
        print(p)
