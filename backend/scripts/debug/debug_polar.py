import sys
import os
from sqlalchemy.orm import Session
from backend.app.database import engine, SessionLocal
from backend.app.models.posicionamiento import Posicionamiento
from backend.app.models.pedido import PedidoComercial

def test():
    db = SessionLocal()
    OGL_KEYWORD = "OPINION GLOBAL"
    
    # Check what bookings are under Polar Chile and match OGL
    pos_polar = db.query(Posicionamiento).filter(Posicionamiento.NAVE.ilike("%POLAR CHILE%")).all()
    print(f"POLAR CHILE total posicionamientos: {len(pos_polar)}")
    for pos in pos_polar:
        if not pos.ORDEN_BETA: continue
        val_upper = pos.ORDEN_BETA.strip().upper()
        # My strip logic:
        has_letters = any(c.isalpha() for c in val_upper)
        if has_letters and not ("BG" in val_upper or "CO" in val_upper):
            orden_num = val_upper
        else:
            import re
            numeric = re.sub(r'[^0-9]', '', val_upper)
            orden_num = numeric if numeric else None
            
        if orden_num:
            pedido_ogl = db.query(PedidoComercial).filter(
                PedidoComercial.orden_beta == orden_num,
                PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
            ).first()
            if pedido_ogl:
                print(f"MATCH! Posicionamiento {pos.BOOKING} | ORDEN_BETA: {pos.ORDEN_BETA} -> Stripped {orden_num} -> Pedido OGL: {pedido_ogl.orden_beta} (Cliente: {pedido_ogl.cliente})")

if __name__ == "__main__":
    # path fix
    sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/backend")
    test()
