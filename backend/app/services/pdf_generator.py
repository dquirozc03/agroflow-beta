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
BETA_BLACK = colors.black

def format_multiline_bold_first(txt: str) -> str:
    """Bolea la primera línea y deja el resto normal, convirtiendo \n a <br/>"""
    if not txt: return ""
    lines = str(txt).strip().split("\n")
    if not lines: return ""
    
    first = f"<b>{lines[0]}</b>"
    if len(lines) > 1:
        rest = "<br/>".join(lines[1:])
        return f"{first}<br/>{rest}"
    return first

def format_to_numeric_date(date_str: str) -> str:
    """Convierte fechas tipo '26-MAY' o '26/05' a '26/05/2025'"""
    if not date_str: return ""
    date_str = date_str.upper().strip()
    
    # Mapeo de meses en español/inglés
    meses = {
        'ENE': '01', 'JAN': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08', 'AUG': '08', 'SEP': '09',
        'OCT': '10', 'NOV': '11', 'DIC': '12', 'DEC': '12'
    }
    
    # Caso 1: DD-MES (ej: 26-MAY)
    match = re.search(r'(\d{1,2})[-\s/]([A-Z]{3})', date_str)
    if match:
        day = match.group(1).zfill(2)
        month_name = match.group(2)
        month = meses.get(month_name, "05")
        return f"{day}/{month}/2025"
    
    # Caso 2: DD/MM (ej: 26/05)
    match = re.search(r'(\d{1,2})[/](\d{1,2})', date_str)
    if match:
        day = match.group(1).zfill(2)
        month = match.group(2).zfill(2)
        return f"{day}/{month}/2025"
    
    return date_str

def generate_ie_pdf(booking: str, db: Session, observaciones: str = None) -> io.BytesIO:
    # 1. Obtener Datos
    posic = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
    if not posic:
        raise ValueError(f"Booking {booking} no encontrado en Posicionamiento")

    # Buscar cliente en CatClienteIE (Cruce inteligente incluyendo nombres parecidos)
    search_cliente = str(posic.cliente or "").upper().strip()
    todos_cultivo = db.query(CatClienteIE).filter(
        CatClienteIE.cultivo == posic.cultivo
    ).all()

    clientes_posibles = []
    
    # Limpiamos para la comparación pura (solo alfas y espacios sencillos)
    search_cliente_clean = re.sub(r'[^A-Z0-9]', ' ', search_cliente)
    search_cliente_clean = " ".join(search_cliente_clean.split())
    
    for c in todos_cultivo:
        c_name = str(c.nombre_comercial or "").upper().strip()
        if not c_name: continue
        
        c_name_clean = re.sub(r'[^A-Z0-9]', ' ', c_name)
        c_name_clean = " ".join(c_name_clean.split())
        
        if c_name_clean and (c_name_clean in search_cliente_clean or search_cliente_clean in c_name_clean):
            clientes_posibles.append(c)
            
    # Ordenar por longitud de nombre comercial (descendente) para preferir la "mayor coincidencia" (ej: "INCO 92 B.V" antes que "INCO")
    clientes_posibles.sort(key=lambda x: len(str(x.nombre_comercial or "")), reverse=True)

    cliente_ie = None
    booking_destino = str(posic.destino_booking or "").upper().strip()
    booking_pais = str(posic.pais_booking or "").upper().strip()

    if clientes_posibles:
        # Prioridad 1: Match de ciudad específica dentro de paréntesis
        for c in clientes_posibles:
            curr_dest = (c.destino or "").upper()
            curr_pais = (c.pais or "").upper()
            if ("(" in curr_dest and booking_destino in curr_dest) or \
               ("(" in curr_pais and booking_destino in curr_pais):
                cliente_ie = c
                break
        
        # Prioridad 2: Match exacto de destino o país con el destino del booking
        if not cliente_ie:
            for c in clientes_posibles:
                if (c.destino or "").upper() == booking_destino or \
                   (c.pais or "").upper() == booking_destino:
                    cliente_ie = c
                    break
        
        # Prioridad 3: Match exacto de destino o país con el país del booking
        if not cliente_ie:
            for c in clientes_posibles:
                if (c.destino or "").upper() == booking_pais or \
                   (c.pais or "").upper() == booking_pais:
                    cliente_ie = c
                    break
        
        # Fallback Final
        if not cliente_ie:
            cliente_ie = clientes_posibles[0]

    # Buscar dirección de planta (Dinámico por Posicionamiento)
    nombre_planta_db = str(posic.planta_empacadora or "").upper().strip()
    if "LITARDO" in nombre_planta_db:
        nombre_planta_pdf = "PLANTA LITARDO"
        direccion_planta_pdf = "CAR.PANAMERICANA SUR KM. 205 (ALTURA ENTRADA STA ROSA) CHINCHA BAJA CHINCHA ICA PERÚ."
        ubigeo_planta_pdf = "110204"
    else:
        # Por defecto buscamos ICA o lo que diga el nombre
        target = "ICA" if "ICA" in nombre_planta_db or not nombre_planta_db else nombre_planta_db
        planta_db_obj = db.query(CatPlanta).filter(CatPlanta.nombre.ilike(f"%{target}%")).first()
        
        nombre_planta_pdf = planta_db_obj.nombre if planta_db_obj else target
        direccion_planta_pdf = planta_db_obj.direccion if planta_db_obj else "CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU"
        ubigeo_planta_pdf = planta_db_obj.ubigeo if (planta_db_obj and planta_db_obj.ubigeo) else "110112"

    # 2. Cálculos
    total_unidades = 0
    try:
        total_unidades = int(re.sub(r'[^0-9]', '', str(posic.total_unidades or "0")))
    except: pass

    # Extraer peso de la caja EXCLUSIVAMENTE desde cj_kg
    peso_caja = 3.8 
    if posic.cj_kg:
        # Buscar el primer número (decimal o entero) en cj_kg
        match_peso = re.search(r'([0-9.]+)', str(posic.cj_kg))
        if match_peso:
            try:
                peso_caja = float(match_peso.group(1))
            except:
                pass
    
    # Formato solicitado: CAJA X.X KG
    presentacion = f"CAJA {peso_caja} KG"

    peso_neto = total_unidades * peso_caja
    peso_bruto = peso_neto + (total_unidades * 0.4)

    # Pre-procesar fechas a numérico
    # Prioridad: Fecha Real de Llenado -> Fecha Solicitada Operador
    fecha_llenado_raw = posic.fecha_real_llenado or posic.fecha_solicitada_operador
    fecha_llenado_num = format_to_numeric_date(fecha_llenado_raw)
    
    hora_text = str(posic.hora_solicitada_operador or "").strip()
    fecha_hora_full = f"{fecha_llenado_num} - {hora_text}" if fecha_llenado_num and hora_text else (fecha_llenado_num or hora_text)
    
    # ETA: Prioridad Final -> Booking
    eta_raw = posic.eta_final or posic.eta_booking
    eta_num = format_to_numeric_date(eta_raw)

    # 3. Construir PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=1.2*cm, 
        leftMargin=1.2*cm, 
        topMargin=0.4*cm, 
        bottomMargin=0.4*cm
    )
    styles = getSampleStyleSheet()
    
    # Estilos de Párrafo (Comprimidos al máximo para permitir logo grande)
    style_label = ParagraphStyle('Label', parent=styles['Normal'], fontSize=7.5, fontName='Helvetica-Bold', leading=8)
    style_value = ParagraphStyle('Value', parent=styles['Normal'], fontSize=9, fontName='Helvetica', leading=10)
    style_title = ParagraphStyle('Title', parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold', alignment=1, leading=14)
    style_val_bold = ParagraphStyle('ValBold', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold', leading=10, alignment=1)
    style_header_main = ParagraphStyle('HeaderMain', parent=styles['Normal'], fontSize=12, fontName='Helvetica-Bold', alignment=1, leading=15)

    elements = []

    # -- HEADER TABLE (LOGO | TEXT | IMAGE) --
    header_elements = []
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        logo_path = os.path.join(current_dir, "..", "..", "backend", "assets", "logo_beta.png")
        if not os.path.exists(logo_path):
            logo_path = os.path.join(current_dir, "..", "..", "assets", "logo_beta.png")
        
        granada_path = os.path.join(current_dir, "..", "..", "backend", "assets", "image_granada.png")
        if not os.path.exists(granada_path):
            granada_path = os.path.join(current_dir, "..", "..", "assets", "image_granada.png")

        logo_img = None
        if os.path.exists(logo_path):
            logo_img = Image(logo_path, width=4.0*cm, height=1.6*cm)
            logo_img.hAlign = 'LEFT'
        
        fruit_img = None
        if os.path.exists(granada_path):
            fruit_img = Image(granada_path, width=4.0*cm, height=1.6*cm)
            fruit_img.hAlign = 'RIGHT'

        # Texto Central
        cliente_txt = str(cliente_ie.nombre_comercial if cliente_ie else "").upper()
        dest_txt = str(posic.destino_booking or "").upper()
        pais_txt = str(posic.pais_booking or "").upper()
        header_text = Paragraph(
            f"INSTRUCCIONES DE EMBARQUE<br/>{cliente_txt} - {dest_txt} - {pais_txt}<br/>{str(posic.cultivo or '').upper()}", 
            style_header_main
        )

        header_table = Table([[logo_img or "", header_text, fruit_img or ""]], colWidths=[4.5*cm, 9.6*cm, 4.5*cm])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'CENTER'),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.3*cm))
    except Exception as e:
        print(f"Error en header PDF: {e}")
        elements.append(Spacer(1, 1*cm))

    def L(txt): return Paragraph(f"<b>{txt}</b>", style_label)
    def V(txt): 
        val = str(txt or "").replace("\n", "<br/>")
        return Paragraph(val, style_value)
    
    def VB(txt): 
        val = str(txt or "").replace("\n", "<br/>")
        return Paragraph(f"<b>{val}</b>", style_val_bold)

    def VBL(txt): 
        val = str(txt or "").replace("\n", "<br/>")
        return Paragraph(f"<b>{val}</b>", ParagraphStyle('VBLeft', parent=style_val_bold, alignment=0))

    # Filas de la Tabla 1
    data1 = [
        [VBL(str(posic.orden_beta_final or "").upper()), ""],
        [L("EMBARCADOR"), V("COMPLEJO AGROINDUSTRIAL BETA S.A.")],
        [L("DIRECCIÓN"), V("CAL. LEOPOLDO CARRILLO NRO. 160 ICA - CHINCHA - CHINCHA ALTA – PERU")],
        [L("OPERADOR LOGISTICO"), VBL(str(posic.operador or "").upper())],
        [L("DIRECCION DE LA PLANTA"), Paragraph(f"<b>{nombre_planta_pdf}</b><br/>{direccion_planta_pdf}", style_value)],
        [L("UBIGEO PLANTA"), V(ubigeo_planta_pdf)],
        [L("FECHA Y HORA DEL LLENADO"), Paragraph(f"<div align='center'><b>{fecha_hora_full}</b></div>", style_val_bold)],
        [L("CONSIGNATARIO<br/>DIRECCIÓN"), Paragraph(format_multiline_bold_first(cliente_ie.consignatario_bl) if cliente_ie else '(SIN INFO CLIENTE)', style_value)],
        [L("NOTIFICADO<br/>DIRECCIÓN"), Paragraph(format_multiline_bold_first(cliente_ie.notificante_bl) if cliente_ie else "", style_value)],
        [L("DATOS REFERENCIALES"), V(f"EORI CONSIGNE: {cliente_ie.eori_consignatario or '---'}\nEORI NOTIFY: {cliente_ie.eori_notify or '---'}")],
        [L("DESCRIPCION EN EL B/L"), V(f"{total_unidades} BOXES WITH FRESH POMEGRANATES {str(posic.variedad or '')} ON {str(posic.total_pallet or '')} PALLETS<br/>{total_unidades} CAJAS CON FRESCA GRANADAS {str(posic.variedad or '')} EN {str(posic.total_pallet or '')} PALETAS")],
        [L("AGENCIA NAVIERA"), V(posic.naviera)],
        [L("MOTONAVE"), V(posic.nave)],
        [L("BOOKING No."), VBL(posic.booking)],
        [L("FREIGHT"), V(posic.flete or "PREPAID")],
        [L("EMISION B/L"), VBL(cliente_ie.emision_bl if cliente_ie else "SWB")],
        [L("PUERTO EMBARQUE"), V(posic.pol)],
        [L("ETA"), V(eta_num)],
        [L("PUERTO DESTINO"), V(posic.destino_booking)],
        [L("CANTIDAD DE CONTENEDORES"), V("01")],
        [L("PRODUCTO"), V("GRANADAS")],
        [L("VARIEDAD"), V(posic.variedad)],
        [L("TEMPERATURA"), V(f"{posic.temperatura or ''}°C" if posic.temperatura else "")],
        [L("VENTILACION"), V(posic.ventilacion)],
        [L("HUMEDAD"), V(posic.humedad or "OFF")],
        [L("ATMOSFERA CONTROLADA"), V("NO APLICA")],
        [L("OXIGENO"), V("NO APLICA")],
        [L("CO2"), V("NO APLICA")],
        [L("FILTROS"), VBL(posic.filtros or "NO APLICA")],
        [L("COLD TREAMENT"), VBL(posic.ct_option or "NO")],
        [L("CANTIDAD"), V(f"{total_unidades} CAJAS APROX.")],
        [L("VALOR FOB APROXIMADO"), V(f"USD {getattr(posic, 'valor_fob', '34,560.00') or '34,560.00'}")],
        [L("OBSERVACIONES"), V(observaciones)],
    ]
    
    table1 = Table(data1, colWidths=[5.5*cm, 13.1*cm])
    style1 = TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        # Quitamos fondo orange de la primera fila ya que no hay t??tulo ah??.
        ('BACKGROUND', (0,1), (0,-2), BETA_GRAY),
        ('BACKGROUND', (0,3), (1,3), BETA_ORANGE),
        ('BACKGROUND', (0,4), (1,5), BETA_GRAY), # Gray for Address and Ubigeo labels
        ('BACKGROUND', (0,6), (1,6), BETA_ORANGE), # Orange for Fecha y Hora (Shifts to 6)
        ('BACKGROUND', (0,28), (1,29), BETA_ORANGE), # Filtros y Cold Treatment (Shifts +2 from 26,27)
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4.5), # Aumento de espacio interno
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5), # Aumento de espacio interno
        # Aumentar cuadros de Consignatario (row 7) y Notificado (row 8)
        ('TOPPADDING', (0,7), (1,8), 8),
        ('BOTTOMPADDING', (0,7), (1,8), 8),
    ])
    table1.setStyle(style1)
    elements.append(table1)
    elements.append(Spacer(1, 1.2*cm)) # Espacio en blanco real sin líneas entre tablas
    
    # -- SECCIÓN FITO --
    data2 = [
        [Paragraph("DATOS PARA CERTIFICADO FITOSANITARIO", style_title), ""],
        [L("CONSIGNATARIO<br/>DIRECCIÓN"), Paragraph(format_multiline_bold_first(cliente_ie.cliente_fito) if cliente_ie else "", style_value)],
        [L("PAIS DE DESTINO"), VBL(posic.pais_booking)],
        [L("PUNTO DE LLEGADA"), VBL(posic.destino_booking)],
        [L("PRESENTACION"), VBL(presentacion or "CAJA 3.8 KG")],
        [L("ETIQUETAS"), VBL(posic.etiqueta_caja or "GENERICA")],
        [L("PESO NETO ESTIMADO"), VBL(f"{peso_neto:,.3f} KG")],
        [L("PESO BRUTO ESTIMADO"), VBL(f"{peso_bruto:,.3f} KG")],
        [L("OBSERVACIONES"), V(cliente_ie.observaciones if cliente_ie else "")],
    ]

    table2 = Table(data2, colWidths=[5.5*cm, 13.1*cm])
    style2 = TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (1,0), BETA_ORANGE),
        ('SPAN', (0,0), (1,0)),
        ('BACKGROUND', (0,1), (0,-1), BETA_GRAY),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
    ])
    table2.setStyle(style2)
    elements.append(table2)

    doc.build(elements)
    buffer.seek(0)
    return buffer
