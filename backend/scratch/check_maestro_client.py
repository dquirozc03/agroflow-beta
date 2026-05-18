from sqlalchemy import create_engine, text

db_url = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
engine = create_engine(db_url)

with engine.connect() as conn:
    print("--- CLIENTES EN MAESTRO ---")
    rows = conn.execute(text("SELECT id, nombre_legal, consignatario_bl, pais, destino, cultivo, estado FROM clientes_ie WHERE nombre_legal ILIKE '%WESTFALIA%' OR consignatario_bl ILIKE '%WESTFALIA%'")).fetchall()
    for r in rows:
        print(r)
