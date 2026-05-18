from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    res = conn.execute(text("SELECT id, nombre_transportista FROM transportistas LIMIT 3;"))
    for row in res:
        print(f"Transportista: ID={row[0]}, Name={row[1]}")
