from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas.dashboard import DashboardSummaryResponse
from app.models.logicapture import LogiCaptureRegistro
from app.models.posicionamiento import Posicionamiento
from app.models.packing_list import EmisionPackingList
from app.models.maestros import Transportista, Chofer, VehiculoTracto, VehiculoCarreta
from sqlalchemy import or_

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    planta: Optional[str] = None,
    cultivo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    hoy = datetime.now()
    hoy_date = hoy.date()
    
    # Base queries for filtering
    lc_base = db.query(LogiCaptureRegistro)
    pos_base = db.query(Posicionamiento)
    
    if planta:
        lc_base = lc_base.filter(LogiCaptureRegistro.planta == planta)
        pos_base = pos_base.filter(Posicionamiento.planta_llenado == planta)
    if cultivo:
        lc_base = lc_base.filter(LogiCaptureRegistro.cultivo == cultivo)
        pos_base = pos_base.filter(Posicionamiento.cultivo == cultivo)

    # 1. KPIs
    procesados = lc_base.filter(LogiCaptureRegistro.status == "PROCESADO").count()
    pendientes = lc_base.filter(LogiCaptureRegistro.status == "PENDIENTE").count()
    alertas = lc_base.filter(LogiCaptureRegistro.status.in_(["PENDIENTE", "ANULADO"])).count()
    
    # Maestros incompletos (Cualquier dato faltante en Transportistas, Choferes o Vehículos)
    trans_incompletos = db.query(Transportista).filter(
        or_(
            Transportista.codigo_sap == None, Transportista.codigo_sap == "",
            Transportista.partida_registral == None, Transportista.partida_registral == ""
        )
    ).count()
    
    choferes_incompletos = db.query(Chofer).filter(
        or_(
            Chofer.licencia == None, Chofer.licencia == "",
            Chofer.apellido_materno == None, Chofer.apellido_materno == ""
        )
    ).count()
    
    tractos_incompletos = db.query(VehiculoTracto).filter(
        or_(
            VehiculoTracto.marca == None, VehiculoTracto.marca == "",
            VehiculoTracto.certificado_vehicular_tracto == None, VehiculoTracto.certificado_vehicular_tracto == "",
            VehiculoTracto.peso_neto_tracto == None,
            VehiculoTracto.largo_tracto == None,
            VehiculoTracto.ancho_tracto == None,
            VehiculoTracto.alto_tracto == None
        )
    ).count()
    
    carretas_incompletas = db.query(VehiculoCarreta).filter(
        or_(
            VehiculoCarreta.certificado_vehicular_carreta == None, VehiculoCarreta.certificado_vehicular_carreta == "",
            VehiculoCarreta.peso_neto_carreta == None,
            VehiculoCarreta.largo_carreta == None,
            VehiculoCarreta.ancho_carreta == None,
            VehiculoCarreta.alto_carreta == None
        )
    ).count()
    
    maestros_incompletos = trans_incompletos + choferes_incompletos + tractos_incompletos + carretas_incompletas
    
    # En Alta Mar
    en_alta_mar = pos_base.filter(
        Posicionamiento.etd <= hoy_date,
        Posicionamiento.eta >= hoy_date
    ).count()

    # Programados Hoy
    programados_hoy = pos_base.filter(
        Posicionamiento.fecha_programada == hoy_date,
        Posicionamiento.estado != "ANULADO"
    ).count()
    
    # 2. Despachos por semana actual (Lunes a Domingo)
    inicio_semana = hoy - timedelta(days=hoy.weekday())
    fin_semana = inicio_semana + timedelta(days=6)
    
    registros_recientes = lc_base.with_entities(
        func.date(LogiCaptureRegistro.fecha_registro).label(\"fecha\"),
        func.count(LogiCaptureRegistro.id).label(\"cantidad\")
    ).filter(
        func.date(LogiCaptureRegistro.fecha_registro) >= inicio_semana.date(),
        func.date(LogiCaptureRegistro.fecha_registro) <= fin_semana.date()
    ).group_by(
        func.date(LogiCaptureRegistro.fecha_registro)
    ).order_by(
        func.date(LogiCaptureRegistro.fecha_registro)
    ).all()
    
    datos_db = {str(r.fecha): r.cantidad for r in registros_recientes}
    
    despachos_por_dia = []
    dias_semana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    for i in range(7):
        dia_actual = inicio_semana + timedelta(days=i)
        fecha_str = dia_actual.strftime("%Y-%m-%d")
        despachos_por_dia.append({
            "fecha": f"{dias_semana[i]} {dia_actual.day}",
            "cantidad": datos_db.get(fecha_str, 0)
        })
            
    # 3. Distribución por Cultivos
    cultivos_query = lc_base.with_entities(
        LogiCaptureRegistro.cultivo,
        func.count(LogiCaptureRegistro.id).label(\"cantidad\")
    ).filter(
        LogiCaptureRegistro.cultivo != None,
        LogiCaptureRegistro.cultivo != \"\"
    ).group_by(
        LogiCaptureRegistro.cultivo
    ).order_by(
        func.count(LogiCaptureRegistro.id).desc()
    )
    
    if cultivo: # Si ya hay filtro de cultivo, solo saldrá 1, es correcto
        cultivos = cultivos_query.all()
    else:
        cultivos = cultivos_query.limit(5).all()
    
    distribucion_cultivos = [
        {"cultivo": c.cultivo.upper() if c.cultivo else "OTROS", "cantidad": c.cantidad} for c in cultivos
    ]
    if not distribucion_cultivos:
         distribucion_cultivos = [{"cultivo": "SIN DATOS", "cantidad": 1}]
         
    # 4. Últimos Registros
    ultimos = lc_base.order_by(LogiCaptureRegistro.fecha_registro.desc()).limit(5).all()
    ultimos_registros = []
    
    from zoneinfo import ZoneInfo
    lima_tz = ZoneInfo("America/Lima")
    
    for r in ultimos:
        if r.fecha_registro:
            try:
                dt = r.fecha_registro if r.fecha_registro.tzinfo else r.fecha_registro.replace(tzinfo=ZoneInfo("UTC"))
                hora_str = dt.astimezone(lima_tz).strftime("%H:%M")
            except Exception:
                hora_str = r.fecha_registro.strftime("%H:%M")
        else:
            hora_str = "N/A"
            
        ultimos_registros.append({
            "id": r.id,
            "booking": r.booking or "S/N",
            "contenedor": r.contenedor or "S/N",
            "transportista": r.empresa_transporte or "N/A",
            "hora": hora_str,
            "status": r.status or "PENDIENTE"
        })
        
    # 5. Próximos Posicionamientos (SOLO los de HOY en adelante que NO estén en LogiCapture)
    # Obtenemos los bookings que ya empezaron a registrarse
    bookings_en_proceso = db.query(LogiCaptureRegistro.booking).distinct().all()
    bookings_excluir = [b[0] for b in bookings_en_proceso if b[0]]

    proximos = pos_base.filter(
        Posicionamiento.estado != \"ANULADO\",
        Posicionamiento.fecha_programada >= hoy_date,
        ~Posicionamiento.booking.in_(bookings_excluir) if bookings_excluir else True
    ).order_by(
        Posicionamiento.fecha_programada.asc().nullslast()
    ).limit(5).all()
    
    proximos_posicionamientos = []
    meses_es = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    
    for p in proximos:
        if p.fecha_programada:
            fecha_str = f"{p.fecha_programada.day} {meses_es[p.fecha_programada.month - 1]} {p.fecha_programada.year}"
        else:
            fecha_str = "Por definir"
            
        proximos_posicionamientos.append({
            "booking": p.booking,
            "orden_beta": p.orden_beta or "S/OB",
            "planta_llenado": p.planta_llenado or "S/A",
            "fecha_programada": fecha_str,
            "nave": p.nave or "TBD"
        })

    return {
        "kpis": {
            "contenedores_procesados": procesados,
            "contenedores_pendientes": pendientes,
            "alertas_activas": alertas,
            "maestros_incompletos": maestros_incompletos,
            "en_alta_mar": en_alta_mar,
            "programados_hoy": programados_hoy
        },
        "despachos_por_dia": despachos_por_dia,
        "distribucion_cultivos": distribucion_cultivos,
        "ultimos_registros": ultimos_registros,
        "proximos_posicionamientos": proximos_posicionamientos
    }

@router.get("/metadata")
def get_dashboard_metadata(db: Session = Depends(get_db)):
    """Retorna listas de plantas y cultivos disponibles para filtros."""
    plantas = db.query(Posicionamiento.planta_llenado).distinct().all()
    cultivos = db.query(LogiCaptureRegistro.cultivo).distinct().all()
    
    return {
        "plantas": sorted([p[0] for p in plantas if p[0]]),
        "cultivos": sorted([c[0] for c in cultivos if c[0]])
    }
