import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.posicionamiento import Posicionamiento

load_dotenv("/Users/dquiroz/Workspace/AgroFlow_Personal/agroflow-beta/backend/.env.local")
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found")
    exit(1)

engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
db = Session()

posicionamientos = db.query(Posicionamiento).filter(Posicionamiento.NAVE.ilike("%PACIFIC REEFER%")).all()
for p in posicionamientos:
    print(f"ID: {p.ID}, Nave: {p.NAVE}, Booking: {p.BOOKING}, Orden: {p.ORDEN_BETA}, Cultivo: {p.CULTIVO}")
