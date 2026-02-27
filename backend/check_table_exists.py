from app.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print("Tables in DB:", tables)
if "logistica_facturas" in tables:
    print("logistica_facturas EXISTS")
    for col in inspector.get_columns("logistica_facturas"):
        print(col)
else:
    print("logistica_facturas DOES NOT EXIST")
