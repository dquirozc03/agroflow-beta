import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from app.models.ref_posicionamiento import RefPosicionamiento
from app.models.ie_models import CatClienteIE, CatPlanta
from sqlalchemy.orm import Session
import re

def generate_ie_pdf(booking: str, db: Session) -> io.BytesIO:
    # 1. Obtener Datos
    posic = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
    if not posic:
        raise ValueError(f"Booking {booking} no encontrado en Posicionamiento")

    # Buscar cliente en CatClienteIE (Cruce inteligente por Destino/Ciudad)
    clientes_posibles = db.query(CatClienteIE).filter(
        CatClienteIE.nombre_comercial == posic.cliente,
        CatClienteIE.cultivo == posic.cultivo
    ).all()

    cliente_ie = None
    booking_destino = str(posic.destino_booking or "").upper().strip()
    booking_pais = str(posic.pais_booking or "").upper().strip()

    if clientes_posibles:
        # Prioridad 1: Match de ciudad específica dentro de paréntesis 
        # Ej: "INGLATERRA (LONDRES, LIVERPOOL)" -> si booking es LIVERPOOL
        for c in clientes_posibles:
            curr_dest = (c.destino or "").upper()
            if "(" in curr_dest and booking_destino in curr_dest:
                cliente_ie = c
                break
        
        # Prioridad 2: Match exacto de destino
        if not cliente_ie:
            for c in clientes_posibles:
                if (c.destino or "").upper() == booking_destino:
                    cliente_ie = c
                    break
        
        # Prioridad 3: Match por País (cuando no hay ciudades en el Excel)
        if not cliente_ie:
            for c in clientes_posibles:
                if (c.destino or "").upper() == booking_pais:
                    cliente_ie = c
                    break
        
        # Fallback Final: El primero encontrado
        if not cliente_ie:
            cliente_ie = clientes_posibles[0]

    # Buscar dirección de planta
    planta = db.query(CatPlanta).filter(CatPlanta.nombre == "ICA").first() # Por ahora hardcoded a ICA según instrucción
    direccion_planta = planta.direccion if planta else ""

    # 2. Cálculos
    total_unidades = 0
    try:
        total_unidades = int(re.sub(r'[^0-9]', '', str(posic.total_unidades or "0")))
    except: pass

    presentacion = str(posic.presentacion or "3.8 KG").upper()
    peso_caja = 3.8 # Default para Granada
    match_peso = re.search(r'([0-9.]+)', presentacion)
    if match_peso:
        peso_caja = float(match_peso.group(1))

    peso_neto = total_unidades * peso_caja
    peso_bruto = peso_neto + (total_unidades * 0.4) # 0.4kg tara/caja

    # 3. Construir PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1*cm, leftMargin=1*cm, topMargin=1*cm, bottomMargin=1*cm)
    styles = getSampleStyleSheet()
    
    # Estilos personalizados
    style_label = ParagraphStyle('Label', parent=styles['Normal'], fontSize=7, fontName='Helvetica-Bold')
    style_value = ParagraphStyle('Value', parent=styles['Normal'], fontSize=8, fontName='Helvetica')
    style_header = ParagraphStyle('Header', parent=styles['Normal'], fontSize=12, fontName='Helvetica-Bold', alignment=1)

    elements = []

    # -- Título --
    elements.append(Paragraph("INSTRUCCIONES DE EMBARQUE", style_header))
    elements.append(Spacer(1, 0.2*cm))

    # -- Tabla de Datos --
    data = [
        [Paragraph(f"<b>{posic.orden_beta_final or ''}</b>", style_value), "", ""],
        ["EMBARCADOR", "COMPLEJO AGROINDUSTRIAL BETA S.A.", ""],
        ["DIRECCIÓN", "CAL. LEOPOLDO CARRILLO NRO. 160 ICA CHINCHA CHINCHA ALTA - PERU", ""],
        ["OPERADOR LOGISTICO", str(posic.operador or "").upper(), ""],
        ["DIRECCION DE LA PLANTA", f"PLANTA ICA\n{direccion_planta}", ""],
        ["FECHA Y HORA DEL LLENADO", str(posic.fecha_real_llenado or ""), ""],
        ["CONSIGNATARIO\nDIRECCIÓN", str(cliente_ie.consignatario_bl or "") if cliente_ie else "", ""],
        ["NOTIFICADO\nDIRECCIÓN", str(cliente_ie.notificante_bl or "") if cliente_ie else "", ""],
        ["DESCRIPCION EN EL B/L", f"{total_unidades} BOXES WITH FRESH POMEGRANATES {posic.variedad or ''} ON 18 PALLETS\n{total_unidades} CAJAS CON FRESCA GRANADAS {posic.variedad or ''} EN 18 PALETAS", ""],
        ["AGENCIA NAVIERA", str(posic.naviera or "").upper(), ""],
        ["MOTONAVE", str(posic.nave or "").upper(), ""],
        ["BOOKING No.", str(posic.booking or ""), ""],
        ["FREIGHT", str(posic.flete or "").upper(), ""],
        ["EMISION B/L", "SWB", ""],
        ["PUERTO EMBARQUE", str(posic.pol or "").upper(), ""],
        ["ETA", str(posic.eta_final or ""), ""],
        ["PUERTO DESTINO", str(posic.destino_booking or "").upper(), ""],
        ["CANTIDAD DE CONTENEDORES", "01", ""],
        ["PRODUCTO", str(posic.cultivo or "").upper(), ""],
        ["VARIEDAD", str(posic.variedad or "").upper(), ""],
        ["TEMPERATURA", str(posic.temperatura or ""), ""],
        ["VENTILACION", str(posic.ventilacion or ""), ""],
        ["HUMEDAD", "OFF", ""],
        ["ATMOSFERA CONTROLADA", "NO APLICA", ""],
        ["FILTROS", "NO APLICA", ""],
        ["COLD TREAMENT", str(posic.ct_option or "NO").upper(), ""],
        ["CANTIDAD", f"{total_unidades} CAJAS APROX.", ""],
        ["VALOR FOB APROXIMADO", "USD 34,560.00", ""],
    ]

    # Formatear tabla
    t = Table(data, colWidths=[5*cm, 13*cm, 0.5*cm])
    t.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
        ('SPAN', (1,0), (2,0)), # Span para el ID superior
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # -- Sección Fito --
    elements.append(Paragraph("<b>DATOS PARA CERTIFICADO FITOSANITARIO</b>", style_label))
    data_fito = [
        ["CONSIGNATARIO\nDIRECCIÓN", str(cliente_ie.cliente_fito or "") if cliente_ie else ""],
        ["PAIS DE DESTINO", str(posic.pais_booking or "").upper()],
        ["PUNTO DE LLEGA", str(posic.destino_booking or "").upper()],
        ["PRESENTACION", str(posic.presentacion or "").upper()],
        ["ETIQUETAS", str(posic.etiqueta_caja or "").upper()],
        ["PESO NETO ESTIMADO", f"{peso_neto:,.3f} KG"],
        ["PESO BRUTO ESTIMADO", f"{peso_bruto:,.3f} KG"],
        ["OBSERVACIONES", ""],
    ]
    tf = Table(data_fito, colWidths=[5*cm, 13.5*cm])
    tf.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
    ]))
    elements.append(tf)

    doc.build(elements)
    buffer.seek(0)
    return buffer
