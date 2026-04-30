from app.database import engine
from sqlalchemy import text

def check_unique():
    with engine.connect() as conn:
        # Ver si existe un indice unico en orden_beta
        query = text("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'pedidos_comerciales'
        """)
        results = conn.execute(query).fetchall()
        print("--- Indices en pedidos_comerciales ---")
        found_unique = False
        for row in results:
            print(f"Index: {row.indexname}")
            if "UNIQUE" in row.indexdef.upper() and "orden_beta" in row.indexdef.lower():
                found_unique = True
                print("  [!] ENCONTRADO UNICO PARA orden_beta")
        
        if not found_unique:
            print("\n[AVISO] No se encontro indice UNIQUE para 'orden_beta'.")
            print("Intentando crear indice UNIQUE para evitar bloqueos en UPSERT...")
            try:
                conn.execute(text("ALTER TABLE pedidos_comerciales ADD CONSTRAINT unique_orden_beta UNIQUE (orden_beta)"))
                conn.commit()
                print("Exito: Restriccion UNIQUE añadida.")
            except Exception as e:
                print(f"Error al crear restriccion: {e}")

if __name__ == "__main__":
    check_unique()
