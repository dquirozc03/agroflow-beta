import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.maestros import ClienteIE

load_dotenv("/Users/dquiroz/Workspace/AgroFlow_Personal/agroflow-beta/backend/.env.local")
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found")
    exit(1)

engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
db = Session()

clientes = db.query(ClienteIE).filter(ClienteIE.nombre_legal.ilike("%BETA BEST%")).all()
for c in clientes:
    print(f"ID: {c.id}, Nombre: {c.nombre_legal}, Pais: {c.pais}, Cultivo: {c.cultivo}")
