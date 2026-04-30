from app.database import engine
from sqlalchemy import text

def remove_constraint():
    with engine.connect() as conn:
        print("Intentando eliminar indices y restricciones de duplicados...")
        try:
            # Eliminar primero la CONSTRAINT y luego el INDEX
            conn.execute(text("ALTER TABLE pedidos_comerciales DROP CONSTRAINT IF EXISTS unique_pedido_full CASCADE"))
            conn.execute(text("DROP INDEX IF EXISTS unique_pedido_full"))
            conn.execute(text("DROP INDEX IF EXISTS ix_pedidos_comerciales_orden_beta_po_cultivo"))
            conn.commit()
            print("¡Exito! Se han eliminado las restricciones de duplicados en Pedidos.")
        except Exception as e:
            print(f"Error al eliminar restriccion: {e}")

if __name__ == "__main__":
    remove_constraint()
