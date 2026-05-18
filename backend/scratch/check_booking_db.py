from sqlalchemy import create_engine, text

db_url = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
engine = create_engine(db_url)

with engine.connect() as conn:
    print("--- PEDIDOS PARA BP016 / 016 ---")
    rows = conn.execute(text("SELECT id, orden_beta, cliente, presentacion, variedad, pais FROM pedidos_comerciales WHERE orden_beta ILIKE '%016%' OR orden_beta ILIKE '%BP016%'")).fetchall()
    for r in rows:
        print(r)
