from sqlalchemy import create_engine, text

db_url = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
engine = create_engine(db_url)

with engine.connect() as conn:
    row = conn.execute(text("SELECT * FROM pedidos_comerciales WHERE orden_beta = '266'")).fetchone()
    print("Columns:", conn.execute(text("SELECT * FROM pedidos_comerciales LIMIT 0")).keys())
    print("Row:", row)
