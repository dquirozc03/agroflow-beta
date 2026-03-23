import sqlalchemy
from app.database import SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        # PostgreSQL doesn't support IF NOT EXISTS in ADD COLUMN directly in older versions, 
        # but let's try a safer approach
        print("Buscando columnas...")
        res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'packing_cuadro_pedidos' AND column_name = 'carton_content'")).fetchone()
        
        if not res:
            print("Agregando columna carton_content...")
            db.execute(text("ALTER TABLE packing_cuadro_pedidos ADD COLUMN carton_content VARCHAR(100)"))
            db.commit()
            print("Columna agregada exitosamente.")
        else:
            print("La columna carton_content ya existe.")
    except Exception as e:
        print(f"Error en migración: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
