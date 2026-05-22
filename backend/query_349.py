import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.pedido import PedidoComercial

load_dotenv("/Users/dquiroz/Workspace/AgroFlow_Personal/agroflow-beta/backend/.env.local")
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL found")
    exit(1)

engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
db = Session()

pedidos = db.query(PedidoComercial).filter(PedidoComercial.orden_beta.ilike("%349%")).all()
if not pedidos:
    print("No se encontraron pedidos con orden 349 en la BD.")
else:
    for p in pedidos:
        print(f"ID: {p.id}, Planta: {p.planta}, Orden: {p.orden_beta}, PO: {p.po}, Cultivo: {p.cultivo}, Cliente: {p.cliente}")
