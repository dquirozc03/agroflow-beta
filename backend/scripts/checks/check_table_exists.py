import sys
import os
from sqlalchemy import create_engine, inspect

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from app.configuracion import settings

def check_tables():
    print(f"Checking database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'LOCAL'}")
    
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    tables = inspector.get_table_names()
    targets = ["ope_registro_eventos", "logistica_facturas"]
    
    print("Tables in DB:", tables)
    for target in targets:
        if target in tables:
            print(f"SUCCESS: Table '{target}' EXISTS.")
            columns = [c['name'] for c in inspector.get_columns(target)]
            print(f"Columns in {target}: {columns}")
        else:
            print(f"FAILURE: Table '{target}' DOES NOT EXIST.")

if __name__ == "__main__":
    check_tables()
