import sys
import os

# Ajustar path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", "backend"))
sys.path.append(project_root)

from sqlalchemy import func
from app.database import SessionLocal
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.embarque import ReporteEmbarques
import re

def strip_orden_beta(orden):
    if not orden: return ""
    return re.sub(r'[^0-9]', '', str(orden))

def debug_wk():
    db = SessionLocal()
    target_nave = "MAERSK GENOA / 620E"
    nave_clean = target_nave.strip().upper()
    
    # Supongamos que estamos en la semana del 19/05/2026
    semana_eta = 21
    anio_eta = 2026
    
    print(f"Analizando Semana {semana_eta} del {anio_eta} para la nave: {target_nave}")
    
    # 1. Buscar todos los posicionamientos de esa misma semana
    pos_semana = db.query(Posicionamiento).filter(
        func.extract('week', Posicionamiento.ETA) == semana_eta,
        func.extract('year', Posicionamiento.ETA) == anio_eta
    ).all()
    
    print(f"Total registros en Posicionamiento para esta semana: {len(pos_semana)}")

    # 2. Mapear naves con carga OGL a su fecha mínima de ETA
    nave_etas = {}
    OGL_KEYWORD = "OGL"
    
    for p in pos_semana:
        if not p.NAVE or not p.ETA or not p.ORDEN_BETA: continue
        num_ord = strip_orden_beta(p.ORDEN_BETA)
        if not num_ord: continue
        
        pedido_ogl = db.query(PedidoComercial).filter(
            PedidoComercial.orden_beta == num_ord,
            PedidoComercial.cliente.ilike(f"%{OGL_KEYWORD}%")
        ).first()
        
        if pedido_ogl:
            n_up = p.NAVE.strip().upper()
            if n_up not in nave_etas or p.ETA < nave_etas[n_up]:
                nave_etas[n_up] = p.ETA
                print(f"  [OGL ENCONTRADO EN POS] Nave: {n_up} | ETA: {p.ETA} | Orden: {p.ORDEN_BETA}")

    # 3. Asegurar que la nave actual está en el mapa
    if nave_clean not in nave_etas:
        # Intentamos buscar ETA de la nave actual en Reporte
        rep = db.query(ReporteEmbarques).filter(ReporteEmbarques.nave_arribo.ilike(f"%{target_nave}%")).first()
        if rep:
             # Nota: Asumimos que Reporte tiene ETA (aunque el modelo que vi era minimal, tal vez en DB tiene mas)
             # Pero como no estoy seguro, uso el dato del screenshot
             from datetime import datetime
             nave_etas[nave_clean] = datetime(2026, 5, 19)
             print(f"  [NAVE ACTUAL] {nave_clean} agregada manualmente para debug con ETA 2026-05-19")
        else:
             from datetime import datetime
             nave_etas[nave_clean] = datetime(2026, 5, 19)
             print(f"  [NAVE ACTUAL] {nave_clean} agregada con ETA 19/05 (dato de screenshot)")

    # 4. Ordenar naves por su ETA mínima cronológica
    naves_ordenadas = sorted(nave_etas.items(), key=lambda x: x[1])
    
    print("\nRanking de naves para la formula WK (Ordenadas por ETA):")
    for i, (n_name, eta_val) in enumerate(naves_ordenadas):
        idx = i + 1
        print(f"{idx}. {n_name} (ETA: {eta_val})")
        if n_name == nave_clean:
            print(f"   >>> ESTA ES TU NAVE >>> WK{semana_eta}{idx}")

if __name__ == "__main__":
    debug_wk()
