
from app.database import engine
from sqlalchemy import inspect

def check_tables():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in DB: {tables}")
    
    if "logicapture_registros" in tables:
        print("✅ logicapture_registros found")
    else:
        print("❌ logicapture_registros MISSING")
        
    if "logicapture_detalles" in tables:
        print("✅ logicapture_detalles found")
    else:
        print("❌ logicapture_detalles MISSING")

if __name__ == "__main__":
    check_tables()
