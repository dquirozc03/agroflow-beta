
import sys
import os
from sqlalchemy import create_engine, inspect, text

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from app.configuracion import settings

def check_table():
    print(f"Checking database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'LOCAL'}")
    
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    tables = inspector.get_table_names()
    target = "ope_registro_eventos"
    
    if target in tables:
        print(f"SUCCESS: Table '{target}' EXISTS.")
        
        # Optional: Check columns
        columns = [c['name'] for c in inspector.get_columns(target)]
        print(f"Columns: {columns}")
        
    else:
        print(f"FAILURE: Table '{target}' DOES NOT EXIST.")
        print(f"Existing tables: {tables}")

if __name__ == "__main__":
    check_table()
