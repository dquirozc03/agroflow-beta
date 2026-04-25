from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'pedidos_comerciales'"))
    columns = [r[0] for r in res]
    print("Columnas encontradas en pedidos_comerciales:")
    for col in columns:
        print(f"- {col}")
    
    if 'semana_eta' in columns:
        print("\n✅ La columna 'semana_eta' EXISTE.")
    else:
        print("\n❌ La columna 'semana_eta' NO EXISTE.")
