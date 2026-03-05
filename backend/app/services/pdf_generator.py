import io
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from app.models.ref_posicionamiento import RefPosicionamiento
from app.models.ie_models import CatClienteIE, CatPlanta
from sqlalchemy.orm import Session
import re

# Colores Beta
BETA_ORANGE = colors.Color(244/255, 145/255, 33/255) # #F49121
BETA_GRAY = colors.Color(234/255, 234/255, 234/255) # #EAEAEA

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
    planta = db.query(CatPlanta).filter(CatPlanta.nombre == "ICA").first()
    direccion_planta = planta.direccion if planta else "CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU"

    # 2. Cálculos
    total_unidades = 0
    try:
        total_unidades = int(re.sub(r'[^0-9]', '', str(posic.total_unidades or "0")))
    except: pass

    # Peso por caja (Granada es usualmente 3.8 o 4.0)
    presentacion = str(posic.presentacion or "").upper()
    peso_caja = 3.8 # Default
    match_peso = re.search(r'([0-9.]+)', presentacion)
    if match_peso:
        peso_caja = float(match_peso.group(1))

    peso_neto = total_unidades * peso_caja
    peso_bruto = peso_neto + (total_unidades * 0.4) # +0.4kg tara

    # 3. Construir PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=1.5*cm, 
        leftMargin=1.5*cm, 
        topMargin=1.5*cm, 
        bottomMargin=1.5*cm
    )
    styles = getSampleStyleSheet()
    
    # Estilos de Párrafo
    style_label = ParagraphStyle('Label', parent=styles['Normal'], fontSize=7.5, fontName='Helvetica-Bold')
    style_value = ParagraphStyle('Value', parent=styles['Normal'], fontSize=8.5, fontName='Helvetica')
    style_title = ParagraphStyle('Title', parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold', alignment=1)
    style_val_bold = ParagraphStyle('ValBold', parent=styles['Normal'], fontSize=8.5, fontName='Helvetica-Bold')

    elements = []

    # -- LOGO --
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "assets", "logo_beta.png")
    if os.path.exists(logo_path):
        img = Image(logo_path, width=4*cm, height=1.5*cm)
        img.hAlign = 'LEFT'
        elements.append(img)
        elements.append(Spacer(1, 0.3*cm))

    # Definición de la tabla principal
    def L(txt): return Paragraph(f"<b>{txt}</b>", style_label)
    def V(txt): return Paragraph(str(txt or ""), style_value)
    def VB(txt): return Paragraph(f"<b>{str(txt or '')}</b>", style_val_bold)

    # Filas de la Tabla 1
    data1 = [
        # Encabezado Naranja
        [Paragraph("INSTRUCCIÓNES DE EMBARQUE", style_title), ""],
        # ID / OGL
        [VB(f" {posic.orden_beta_final or ''}"), Paragraph(f"<div align='right'><b>OGL25</b></div>", style_val_bold)],
        [L("EMBARCADOR"), V("COMPLEJO AGROINDUSTRIAL BETA S.A.")],
        [L("DIRECCIÓN"), V("CAL. LEOPOLDO CARRILLO NRO. 160 ICA - CHINCHA - CHINCHA ALTA – PERU")],
        # Operador
        [L("OPERADOR LOGISTICO"), VB(str(posic.operador or "").upper())],
        [L("DIRECCION DE LA PLANTA"), Paragraph(f"<b>PLANTA ICA</b><br/>{direccion_planta}", style_value)],
        # Fecha
        [L("FECHA Y HORA DEL LLENADO"), Paragraph(f"<div align='right'><b>{posic.fecha_real_llenado or ''}</b></div>", style_val_bold)],
        # Consignatario
        [L("CONSIGNATARIO<br/>DIRECCIÓN"), Paragraph(f"<b>{cliente_ie.consignatario_bl or ''}</b><br/>{('EORI: ' + cliente_ie.eori_consignatario) if cliente_ie and cliente_ie.eori_consignatario else ''}", style_value)],
        # Notificado
        [L("NOTIFICADO<br/>DIRECCIÓN"), V(cliente_ie.notificante_bl if cliente_ie else "")],
        # Descripción
        [L("DESCRIPCION EN EL B/L"), V(f"{total_unidades} BOXES WITH FRESH POMEGRANATES {posic.variedad or ''} ON 18 PALLETS<br/>{total_unidades} CAJAS CON FRESCA GRANADAS {posic.variedad or ''} EN 18 PALETAS")],
        # Logística
        [L("AGENCIA NAVIERA"), V(posic.naviera)],
        [L("MOTONAVE"), V(posic.nave)],
        [L("BOOKING No."), VB(posic.booking)],
        [L("FREIGHT"), V(posic.flete or "PREPAID")],
        [L("EMISION B/L"), VB(cliente_ie.emision_bl if cliente_ie else "SWB")],
        [L("PUERTO EMBARQUE"), V(posic.pol)],
        [L("ETA"), V(posic.eta_final)],
        [L("PUERTO DESTINO"), V(posic.destino_booking)],
        [L("CANTIDAD DE CONTENEDORES"), V("01")],
        [L("PRODUCTO"), V("GRANADAS")],
        [L("VARIEDAD"), V(posic.variedad)],
        [L("TEMPERATURA"), V(posic.temperatura)],
        [L("VENTILACION"), V(posic.ventilacion)],
        [L("HUMEDAD"), V("OFF")],
        [L("ATMOSFERA CONTROLADA"), V("NO APLICA")],
        # Filtros / Cold
        [L("FILTROS"), VB("NO APLICA")],
        [L("COLD TREAMENT"), VB(posic.ct_option or "NO")],
        [L("CANTIDAD"), V(f"{total_unidades} CAJAS APROX.")],
        [L("VALOR FOB APROXIMADO"), V(f"USD 34,560.00")], # Placeholder
        ["", ""],
    ]

    # Estilo Tabla 1
    table1 = Table(data1, colWidths=[5.5*cm, 12.5*cm])
    style1 = TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        # Encabezado naranja
        ('BACKGROUND', (0,0), (1,0), BETA_ORANGE),
        ('SPAN', (0,0), (1,0)),
        # Etiquetas grises
        ('BACKGROUND', (0,2), (0,-2), BETA_GRAY),
        # Row OGL y Fecha también naranja parcial? No, el prompt dice naranja para separadores.
        ('BACKGROUND', (0,4), (1,4), BETA_ORANGE),
        ('BACKGROUND', (0,6), (1,6), BETA_ORANGE),
        ('BACKGROUND', (0,25), (1,26), BETA_ORANGE),
        # Ajustes de padding
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ])
    table1.setStyle(style1)
    elements.append(table1)

    # -- SECCIÓN FITO --
    data2 = [
        [Paragraph("DATOS PARA CERTIFICADO FITOSANITARIO", style_title), ""],
        [L("CONSIGNATARIO<br/>DIRECCIÓN"), V(cliente_ie.cliente_fito if cliente_ie else "")],
        [L("PAIS DE DESTINO"), VB(posic.pais_booking)],
        [L("PUNTO DE LLEGADA"), VB(posic.destino_booking)],
        [L("PRESENTACION"), VB(presentacion or "CAJA 3.8 KG")],
        [L("ETIQUETAS"), VB(posic.etiqueta_caja or "GENERICA")],
        [L("PESO NETO ESTIMADO"), VB(f"{peso_neto:,.3f} KG")],
        [L("PESO BRUTO ESTIMADO"), VB(f"{peso_bruto:,.3f} KG")],
        [L("OBSERVACIONES"), V(cliente_ie.observaciones if cliente_ie else "")],
    ]

    table2 = Table(data2, colWidths=[5.5*cm, 12.5*cm])
    style2 = TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (1,0), BETA_ORANGE),
        ('SPAN', (0,0), (1,0)),
        ('BACKGROUND', (0,1), (0,-1), BETA_GRAY),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ])
    table2.setStyle(style2)
    elements.append(table2)

    doc.build(elements)
    buffer.seek(0)
    return buffer
