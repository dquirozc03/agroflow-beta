from fastapi import APIRouter, Depends
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from app.database import get_db
from app.schemas.dashboard import DashboardSummaryResponse
from app.models.logicapture import LogiCaptureRegistro
from app.models.posicionamiento import Posicionamiento
from app.models.packing_list import EmisionPackingList
from app.models.maestros import Transportista, Chofer, VehiculoTracto, VehiculoCarreta
from app.models.embarque import ControlEmbarque
from sqlalchemy import or_
from zoneinfo import ZoneInfo

LIMA_TZ = ZoneInfo("America/Lima")


router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    planta: Optional[str] = None,
    cultivo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    hoy = datetime.now(LIMA_TZ)
    hoy_date = hoy.date()
    
    # Base queries for filtering
    lc_base = db.query(LogiCaptureRegistro)
    pos_base = db.query(Posicionamiento)
    
    if planta:
        lc_base = lc_base.filter(LogiCaptureRegistro.planta == planta)
        pos_base = pos_base.filter(Posicionamiento.PLANTA_LLENADO == planta)
    if cultivo:
        lc_base = lc_base.filter(LogiCaptureRegistro.cultivo == cultivo)
        pos_base = pos_base.filter(Posicionamiento.CULTIVO == cultivo)

    # 1. KPIs
    # Ajuste: Contenedores Despachados AHORA es semanal (Lunes a Domingo) para coincidir con el gráfico
    inicio_semana = hoy - timedelta(days=hoy.weekday())
    fin_semana = inicio_semana + timedelta(days=6)

    # Expresión para la fecha efectiva en zona horaria de Lima
    effective_timestamp = func.coalesce(LogiCaptureRegistro.fecha_embarque, LogiCaptureRegistro.fecha_registro)
    effective_date_lima = func.date(func.timezone('America/Lima', effective_timestamp))

    procesados = lc_base.filter(
        LogiCaptureRegistro.status == "PROCESADO",
        effective_date_lima >= inicio_semana.date(),
        effective_date_lima <= fin_semana.date()
    ).count()

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
        Posicionamiento.ETD <= hoy_date,
        Posicionamiento.ETA >= hoy_date
    ).count()

    # Programados Hoy
    programados_hoy = pos_base.filter(
        Posicionamiento.FECHA_PROGRAMADA == hoy_date,
        Posicionamiento.ESTADO != "ANULADO"
    ).count()
    
    # 2. Despachos por semana actual (Lunes a Domingo)
    inicio_semana = hoy - timedelta(days=hoy.weekday())
    fin_semana = inicio_semana + timedelta(days=6)
    
    registros_recientes = lc_base.with_entities(
        effective_date_lima.label("fecha"),
        func.count(LogiCaptureRegistro.id).label("cantidad")
    ).filter(
        LogiCaptureRegistro.status == "PROCESADO",
        effective_date_lima >= inicio_semana.date(),
        effective_date_lima <= fin_semana.date()
    ).group_by(
        effective_date_lima
    ).order_by(
        effective_date_lima
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
        func.count(LogiCaptureRegistro.id).label("cantidad")
    ).filter(
        LogiCaptureRegistro.cultivo != None,
        LogiCaptureRegistro.cultivo != ""
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
    
    lima_tz = LIMA_TZ
    
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
        Posicionamiento.ESTADO != "ANULADO",
        Posicionamiento.FECHA_PROGRAMADA >= hoy_date,
        ~Posicionamiento.BOOKING.in_(bookings_excluir) if bookings_excluir else True
    ).order_by(
        Posicionamiento.FECHA_PROGRAMADA.asc().nullslast()
    ).limit(5).all()
    
    proximos_posicionamientos = []
    meses_es = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    
    for p in proximos:
        if p.FECHA_PROGRAMADA:
            fecha_str = f"{p.FECHA_PROGRAMADA.day} {meses_es[p.FECHA_PROGRAMADA.month - 1]} {p.FECHA_PROGRAMADA.year}"
        else:
            fecha_str = "Por definir"
            
        proximos_posicionamientos.append({
            "booking": p.BOOKING,
            "orden_beta": p.ORDEN_BETA or "S/OB",
            "planta_llenado": p.PLANTA_LLENADO or "S/A",
            "fecha_programada": fecha_str,
            "nave": p.NAVE or "TBD"
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
    plantas = db.query(Posicionamiento.PLANTA_LLENADO).distinct().all()
    cultivos = db.query(LogiCaptureRegistro.cultivo).distinct().all()
    
    return {
        "plantas": sorted([p[0] for p in plantas if p[0]]),
        "cultivos": sorted([c[0] for c in cultivos if c[0]])
    }

@router.get("/embarques-semana")
def get_embarques_semana(
    q: Optional[str] = None,
    booking: Optional[str] = None,
    orden_beta: Optional[str] = None,
    planta: Optional[str] = None,
    cultivo: Optional[str] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    hoy = datetime.now(LIMA_TZ).date()
    
    # Calcular semana actual (WK ISO)
    semana_actual = hoy.isocalendar()[1]
    
    # Fechas por defecto (Lunes a Domingo de la semana actual)
    if not fecha_inicio:
        fecha_inicio = hoy - timedelta(days=hoy.weekday())
    if not fecha_fin:
        fecha_fin = fecha_inicio + timedelta(days=6)
        
    query = db.query(Posicionamiento, ControlEmbarque).outerjoin(
        ControlEmbarque, Posicionamiento.BOOKING == ControlEmbarque.booking
    )
    
    # Aplicar filtros directos
    if q:
        query = query.filter(
            or_(
                Posicionamiento.BOOKING.ilike(f"%{q}%"),
                Posicionamiento.ORDEN_BETA.ilike(f"%{q}%")
            )
        )
    if booking:
        query = query.filter(Posicionamiento.BOOKING.ilike(f"%{booking}%"))
    if orden_beta:
        query = query.filter(Posicionamiento.ORDEN_BETA.ilike(f"%{orden_beta}%"))
    if planta:
        query = query.filter(Posicionamiento.PLANTA_LLENADO == planta)
    if cultivo:
        query = query.filter(Posicionamiento.CULTIVO == cultivo)
    
    # Lógica de fechas
    if not q and not booking and not orden_beta:
        query = query.filter(
            Posicionamiento.FECHA_LLENADO_REPORTE >= fecha_inicio,
            Posicionamiento.FECHA_LLENADO_REPORTE <= fecha_fin
        )
    elif fecha_inicio and fecha_fin:
         query = query.filter(
            Posicionamiento.FECHA_LLENADO_REPORTE >= fecha_inicio,
            Posicionamiento.FECHA_LLENADO_REPORTE <= fecha_fin
        )

    # Ordenar por fecha y hora de reporte para mejor visualización en la tabla
    query = query.order_by(Posicionamiento.FECHA_LLENADO_REPORTE.desc().nullslast(), Posicionamiento.HORA_LLENADO_REPORTE.desc().nullslast())

    resultados = query.all()
    
    # Extraer los bookings para chequear si ya fueron procesados en LogiCapture
    bookings_en_pantalla = [pos.BOOKING for pos, _ in resultados if pos.BOOKING]
    
    # Buscar qué bookings de esta vista ya están procesados
    procesados = []
    if bookings_en_pantalla:
        procesados_query = db.query(LogiCaptureRegistro.booking).filter(
            LogiCaptureRegistro.booking.in_(bookings_en_pantalla),
            LogiCaptureRegistro.status == "PROCESADO"
        ).distinct().all()
        procesados = [p[0] for p in procesados_query]

    embarques = []
    
    for pos, ce in resultados:
        falta_dam = not ce or not ce.dam
        falta_contenedor = not ce or not ce.contenedor
        es_embarcado = pos.BOOKING in procesados
        
        if es_embarcado:
            estado = "EMBARCADO"
        elif falta_dam and falta_contenedor:
            estado = "FALTAN DATOS"
        elif falta_dam:
            estado = "FALTA DAM"
        elif falta_contenedor:
            estado = "FALTA CONTENEDOR"
        else:
            estado = "COMPLETO"
            
        embarques.append({
            "booking": pos.BOOKING,
            "orden_beta": pos.ORDEN_BETA,
            "fecha_posicionamiento": pos.FECHA_LLENADO_REPORTE,
            "hora_posicionamiento": pos.HORA_LLENADO_REPORTE.strftime("%H:%M") if pos.HORA_LLENADO_REPORTE else None,
            "operador": pos.OPERADOR_LOGISTICO,
            "planta": pos.PLANTA_LLENADO,
            "cultivo": pos.CULTIVO,
            "dam": ce.dam if ce else None,
            "contenedor": ce.contenedor if ce else None,
            "falta_dam": falta_dam,
            "falta_contenedor": falta_contenedor,
            "estado": estado
        })
        
    return {
        "semana_actual": semana_actual,
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "total_registros": len(embarques),
        "embarques": embarques
    }
