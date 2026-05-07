import sys
import os
sys.path.insert(0, os.path.abspath("/Users/dquiroz/Workspace/AgroFlow_Personal/agroflow-beta/backend"))
from app.database import SessionLocal
from app.models import ReporteEmbarques, Posicionamiento

db = SessionLocal()
bkg = "EBKG16698011"
re = db.query(ReporteEmbarques).filter(ReporteEmbarques.booking == bkg).first()
if re:
    print(f"ReporteEmbarques: {re.booking} -> {re.nave_arribo}")
else:
    print("NO ESTA EN ReporteEmbarques")

pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == bkg).first()
if pos:
    print(f"Posicionamiento: {pos.BOOKING} -> NAVE: {pos.NAVE}")
