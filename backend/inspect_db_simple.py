from sqlalchemy import create_engine, inspect
import os
import re

def get_db_url():
    try:
        with open("backend/.env.local", "r") as f:
            content = f.read()
            match = re.search(r'DATABASE_URL=(.*)', content)
            if match:
                return match.group(1).strip()
    except:
        pass
    return None

def inspect_db():
    url = get_db_url()
    if not url:
        print("DATABASE_URL no encontrada en .env.local")
        return

    engine = create_engine(url)
    inspector = inspect(engine)
    
    tables = inspector.get_table_names()
    print(f"Tablas encontradas: {tables}")
    
    if "ref_posicionamiento" in tables:
        columns = inspector.get_columns("ref_posicionamiento")
        print("\nColumnas en 'ref_posicionamiento':")
        for col in columns:
            print(f"- {col['name']} ({col['type']})")
    else:
        print("\n'ref_posicionamiento' no encontrada.")

if __name__ == "__main__":
    inspect_db()
