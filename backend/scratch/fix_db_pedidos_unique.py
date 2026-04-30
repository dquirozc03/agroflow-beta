from app.database import engine
from sqlalchemy import text

def cleanup_and_fix():
    with engine.connect() as conn:
        print("--- Limpiando duplicados en pedidos_comerciales ---")
        # Borrar duplicados manteniendo el ID más alto
        cleanup_query = text("""
            DELETE FROM pedidos_comerciales a
            USING pedidos_comerciales b
            WHERE a.id < b.id
            AND a.orden_beta = b.orden_beta;
        """)
        res = conn.execute(cleanup_query)
        conn.commit()
        print(f"Filas duplicadas eliminadas: {res.rowcount}")

        print("\nIntentando añadir restricción UNIQUE de nuevo...")
        try:
            conn.execute(text("ALTER TABLE pedidos_comerciales ADD CONSTRAINT unique_orden_beta UNIQUE (orden_beta)"))
            conn.commit()
            print("¡Éxito! Restricción UNIQUE añadida correctamente.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    cleanup_and_fix()
