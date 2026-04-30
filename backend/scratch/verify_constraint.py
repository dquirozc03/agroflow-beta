from app.database import engine
from sqlalchemy import text

def verify():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT conname FROM pg_constraint WHERE conname = 'unique_orden_beta'"))
        row = res.fetchone()
        if row:
            print(f"CONFIRMADO: La restriccion '{row[0]}' existe.")
        else:
            print("ERROR: La restriccion 'unique_orden_beta' NO existe en la base de datos.")
            
        # Listar todos los indices para estar seguros
        print("\n--- Todos los indices en pedidos_comerciales ---")
        indices = conn.execute(text("SELECT indexname FROM pg_indexes WHERE tablename = 'pedidos_comerciales'")).fetchall()
        for i in indices:
            print(f"Index: {i[0]}")

if __name__ == "__main__":
    verify()
