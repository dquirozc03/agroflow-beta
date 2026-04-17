import sys
import os

sys.path.append(r"d:\Workspace\AgroFlow\beta-agroflow-backend-01")

from app.database import SessionLocal
from app.models.embarque import ReporteEmbarques
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial

db = SessionLocal()

shipments = db.query(ReporteEmbarques).all()
print(f"Total shipments: {len(shipments)}")

nave_stats = {}
for s in shipments:
    nave = s.nave_arribo if s.nave_arribo else "SIN NAVE"
    if nave not in nave_stats:
        nave_stats[nave] = []
    if s.booking and s.booking not in nave_stats[nave]:
        nave_stats[nave].append(s.booking)

for nave, bookings in nave_stats.items():
    print(f"Nave: {nave}, Bookings: {len(bookings)}")
    for b in bookings:
        pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == b).first()
        if pos:
            # print(f"  Booking {b} found in Posicionamiento. ORDEN_BETA: {pos.ORDEN_BETA}")
            if pos.ORDEN_BETA:
                upper_beta = pos.ORDEN_BETA.strip().upper()
                if "BG" in upper_beta or "CO" in upper_beta:
                    import re
                    numeric = re.sub(r'[^0-9]', '', upper_beta)
                    pedido_ogl = db.query(PedidoComercial).filter(
                        PedidoComercial.orden_beta == numeric,
                        PedidoComercial.cliente.ilike(f"%OGL%")
                    ).first()
                    if pedido_ogl:
                        print(f"    [MATCH] Booking {b} has OGL pedido! (Orden: {numeric})")
                    # else:
                        # print(f"    No OGL pedido for orden {numeric}")
                # else:
                    # print(f"    No BG/CO in {upper_beta}")
        # else:
            # print(f"  Booking {b} NOT found in Posicionamiento")
