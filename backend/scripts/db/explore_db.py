import sys
import os
from sqlalchemy import text

# Añadir el directorio raíz al path
sys.path.append(os.getcwd())

from app.database import SessionLocal

def explore_db():
    db = SessionLocal()
    try:
        print("Explorando esquemas y tablas...")
        
        # Listar esquemas
        schemas = db.execute(text("SELECT schema_name FROM information_schema.schemata")).fetchall()
        print(f"Esquemas: {[s[0] for s in schemas]}")
        
        # Listar tablas en el esquema public (por defecto)
        tables = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")).fetchall()
        print(f"Tablas en 'public': {[t[0] for t in tables]}")
        
        # Si hay otros esquemas sospechosos (ej. dev, prod), listarlos también
        for s in schemas:
            s_name = s[0]
            if s_name not in ['information_schema', 'pg_catalog', 'public']:
                tabs = db.execute(text(f"SELECT table_name FROM information_schema.tables WHERE table_schema = '{s_name}'")).fetchall()
                if tabs:
                    print(f"Tablas en '{s_name}': {[t[0] for t in tabs]}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    explore_db()
