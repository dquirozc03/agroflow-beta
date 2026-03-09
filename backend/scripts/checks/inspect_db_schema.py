from sqlalchemy import create_engine, inspect
from app.configuracion import settings

def inspect_db():
    engine = create_engine(settings.DATABASE_URL)
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
