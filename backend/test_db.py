import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import os
from dotenv import load_dotenv

load_dotenv('/Users/dquiroz/Workspace/AgroFlow_Personal/agroflow-beta/backend/.env.local')

engine = create_engine(os.environ["DATABASE_URL"])
Session = sessionmaker(bind=engine)
session = Session()

from app.models.maestros import VehiculoCarreta

carretas = session.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta.ilike('%TFC%')).all()
for c in carretas:
    print(f"ID: {c.id}, Placa: '{c.placa_carreta}'")
