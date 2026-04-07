from reportlab.lib.colors import HexColor, whitesmoke, grey, lightgreen, yellow, black, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from sqlalchemy.orm import Session
from app.models.logicapture import LogiCaptureRegistro
from app.models.maestros import VehiculoTracto, VehiculoCarreta
from datetime import datetime
import os

# Configuración Oficial Beta
BETA_CONFIG = {
    "empresa": "Complejo Agroindustrial Beta S.A.",
    "ruc": "20297939131",
    "telefono": "056-581150",
    "direccion": "Fundo Santa Margarita S/N",
    "distrito": "Santiago",
    "provincia": "Ica",
    "departamento": "Ica",
    "logo_path": "assets/logo.png"
}

def get_mtc_config(tracto_ejes: int, carreta_ejes: int, cert_carreta: str = "", is_especial: bool = False):
    """Lógica oficial de pesos máximos."""
    t_ejes = tracto_ejes or 0
    c_ejes = carreta_ejes or 0
    cert = (cert_carreta or "").upper()
    
    if t_ejes == 3:
        if c_ejes == 2:
            if is_especial or "SE2" in cert: return "T3/Se2", 47000
            return "T3/S2", 43000
        if c_ejes == 3:
            return "T3/S3", 48000
    return f"T{t_ejes}S{c_ejes}", 48000

def find_asset(asset_name):
    """Buscador ultrasónico de assets para dev y prod (Render)."""
    paths = [
        os.path.join(os.getcwd(), "assets", asset_name),
        os.path.join(os.getcwd(), "backend", "assets", asset_name),
        # Corregido: ir dos niveles atrás desde services/ para llegar a backend/assets 🎯
        os.path.join(os.path.dirname(__file__), "..", "..", "assets", asset_name)
    ]
    for p in paths:
        if os.path.exists(p): return p
    return None

def generate_anexo_1_pdf(db: Session, registro_id: int, is_especial: bool = False):
    """
    Constancia de Verificación de Pesos y Medidas (MTC oficial).
    Diseño basado en el formato legal de Agroindustrial Beta.
    """
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == registro_id).first()
    if not reg: return None

    tracto = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == reg.placa_tracto).first()
    carreta = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == reg.placa_carreta).first()

    conf_label, peso_max = get_mtc_config(
        tracto.numero_ejes if tracto else 0, 
        carreta.numero_ejes if carreta else 0,
        carreta.certificado_vehicular_carreta if carreta else "",
        is_especial
    )

    file_name = f"anexo1_{registro_id}.pdf"
    file_path = os.path.join("/tmp", file_name) if os.name != 'nt' else os.path.join(os.getcwd(), file_name)
    
    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4
    
    # --- CABECERA OFICIAL ---
    logo_file = find_asset("logo_beta.png") # Sincronizado con el archivo real de la empresa 🏛️
    if logo_file:
        try:
            c.drawImage(logo_file, 1.5*cm, height - 2.5*cm, width=3.5*cm, preserveAspectRatio=True)
        except:
            pass # Si el logo falla por formato, el PDF continua 🛡️
    
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(width/2 + 1*cm, height - 2*cm, "CONSTANCIA DE VERIFICACION DE PESOS Y MEDIDAS")
    
    c.setFont("Helvetica-Bold", 7)
    header_text_lines = [
        "ALMACENES, TERMINALES DE ALMACENAMIENTO, TERMINALES PORTUARIOS O AEROPORTUARIOS, GENERADORES,",
        "DADORES O REMITENTES DE LA MERCANCIA",
        "DECRETO SUPREMO Nº 058-2003-MTC REGLAMENTO NACIONAL DE VEHICULOS Y SUS NORMAS MODIFICATORIAS"
    ]
    curr_y = height - 2.5*cm
    for line in header_text_lines:
        c.drawCentredString(width/2 + 1*cm, curr_y, line)
        curr_y -= 0.35*cm

    # Fecha y Hora
    c.setFont("Helvetica", 8)
    c.drawString(1.5*cm, height - 4*cm, f"Fecha :   {datetime.now().strftime('%d / %m / %Y')}")

    # --- I) DATOS DEL GENERADOR (TABLA 1) ---
    c.setFont("Helvetica-Bold", 8)
    c.drawString(1.5*cm, height - 4.6*cm, "I) DATOS DEL GENERADOR DE CARGA")
    
    # Celda amarilla de control interno
    c.setFillColor(yellow)
    c.rect(14.5*cm, height - 4.6*cm, 4*cm, 0.4*cm, fill=1)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(16.5*cm, height - 4.4*cm, reg.orden_beta or "4102060426")

    data_remitente = [
        ["NOMBRE DE\nLA EMPRESA", BETA_CONFIG['empresa'], "Nº RUC", BETA_CONFIG['ruc'], "TELEF.", BETA_CONFIG['telefono']],
        ["DIRECCION", BETA_CONFIG['direccion'], "", "", "", ""],
        ["DISTRITO", BETA_CONFIG['distrito'], "PROVINCIA", BETA_CONFIG['provincia'], "DEPARTAMENTO", BETA_CONFIG['departamento']]
    ]
    t1 = Table(data_remitente, colWidths=[2.3*cm, 6.2*cm, 1.5*cm, 3*cm, 1.5*cm, 3*cm], rowHeights=[0.8*cm, 0.5*cm, 0.5*cm])
    t1.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, black),
        ('FONTSIZE', (0,0), (-1,-1), 6.5),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('BACKGROUND', (0,0), (0,-1), HexColor("#cccccc")),
        ('BACKGROUND', (2,0), (2,0), HexColor("#cccccc")),
        ('BACKGROUND', (2,2), (2,2), HexColor("#cccccc")),
        ('BACKGROUND', (4,0), (4,0), HexColor("#cccccc")),
        ('BACKGROUND', (4,2), (4,2), HexColor("#cccccc")),
        ('SPAN', (1,1), (5,1)),
    ]))
    t1.wrapOn(c, width, height)
    t1.drawOn(c, 1.5*cm, height - 6.5*cm)

    # --- II) TIPO DE MERCANCIA ---
    c.setFont("Helvetica-Bold", 8)
    c.drawString(1.5*cm, height - 7.3*cm, "II) TIPO DE MERCANCIA TRANSPORTADA:   GRANADA FRESCA")
    c.setFont("Helvetica", 7)
    c.drawString(1.5*cm, height - 7.7*cm, "según Guia de Remisión que se Adjunta:")
    
    data_checks = [
        ["BALANZA", "", "SOFTWARE", "", "CUBICACION", "", "OTROS", "X"]
    ]
    t_chk = Table(data_checks, colWidths=[2*cm, 1.5*cm, 2.5*cm, 3*cm, 2.5*cm, 3*cm, 1.5*cm, 1.5*cm])
    t_chk.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, black),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BACKGROUND', (0,0), (0,0), HexColor("#cccccc")),
        ('BACKGROUND', (2,0), (2,0), HexColor("#cccccc")),
        ('BACKGROUND', (4,0), (4,0), HexColor("#cccccc")),
        ('BACKGROUND', (6,0), (6,0), HexColor("#cccccc")),
    ]))
    t_chk.wrapOn(c, width, height)
    t_chk.drawOn(c, 1.5*cm, height - 8.5*cm)

    # --- IV) DATOS DEL VEHICULO (TABLA OPTIMIZADA) ---
    c.setFont("Helvetica-Bold", 8)
    c.drawString(1.5*cm, height - 9.1*cm, "IV) DATOS DEL VEHICULO")
    
    label_dims = "DIMENSION TOTAL DEL\nVEHICULO (mt)"
    head_v = [
        ["PLACAS\n(Tractor / Carreta)", label_dims, "", "", "CONFIG.\nVEHICULAR", "PESO BRUTO MAX\nPERMITIDO (KG.)", "PESO BRUTO TOTAL\nTRANSPORTADO (KG.)", "PBMax. Para no control\n95% (DS 006-2008)", "OBSERVACIONES\nEXTRAANCH (3)"],
        ["", "LARGO", "ANCHO", "ALTO", "", "", "", "", ""]
    ]
    
    bruto_f = float(reg.peso_bruto or 0)
    peso_max_f = float(peso_max)
    pb_95 = float(peso_max_f * 0.95)

    data_v = [
        [f"{reg.placa_tracto} / {reg.placa_carreta}", 
         f"{tracto.largo_tracto if tracto else '-'}", f"{tracto.ancho_tracto if tracto else '-'}", f"{tracto.alto_tracto if tracto else '-'}", 
         conf_label, f"{peso_max_f:,.0f}", f"{bruto_f:,.0f}", f"{pb_95:,.0f}", "-"]
    ]
    
    full_v = head_v + data_v
    # Calibración milimétrica para A4 (Margen de seguridad total) 📐
    t_vh = Table(full_v, colWidths=[2.2*cm, 1.0*cm, 1.0*cm, 1.0*cm, 2.0*cm, 2.4*cm, 2.5*cm, 2.7*cm, 2.7*cm])
    t_vh.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, black),
        ('FONTSIZE', (0,0), (-1,-1), 5),
        ('FONTNAME', (0,0), (-1,1), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,1), HexColor("#cccccc")),
        ('SPAN', (0,0), (0,1)), ('SPAN', (4,0), (4,1)), ('SPAN', (5,0), (5,1)), 
        ('SPAN', (6,0), (6,1)), ('SPAN', (7,0), (7,1)), ('SPAN', (8,0), (8,1)),
        ('SPAN', (1,0), (3,0)),
        ('BACKGROUND', (6,2), (6,2), yellow), # RESALTE AMARILLO OFICIAL 🟡
    ]))
    t_vh.wrapOn(c, width, height)
    t_vh.drawOn(c, 1.5*cm, height - 11.5*cm)

    # --- III) CONTROL POR EJES ---
    c.setFont("Helvetica-Bold", 8)
    c.drawString(1.5*cm, height - 12.3*cm, "II) CONTROL DE PESOS POR EJE O CONJUNTO DE EJES:")
    c.setFont("Helvetica", 6)
    c.drawString(1.5*cm, height - 12.6*cm, "Para aquellos vehículos que exceden el 95% de la suma de los pesos por ejes")
    
    data_ejes = [
        ["PESOS", "1er Cjto", "2do Cjto", "3er Cjto", "4to Cjto", "5to Cjto", "6to Cjto"],
        ["", "-", "-", "-", "-", "-", "-"]
    ]
    t_ej = Table(data_ejes, colWidths=[2*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm])
    t_ej.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, black),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BACKGROUND', (0,0), (-1,0), HexColor("#cccccc")),
    ]))
    t_ej.wrapOn(c, width, height)
    t_ej.drawOn(c, 1.5*cm, height - 14*cm)

    # --- TEXTO LEGAL Y OBSERVACIONES ---
    c.setFont("Helvetica-Bold", 6)
    c.drawString(1.5*cm, height - 14.5*cm, "DECRETO SUPREMO Nº 058-2003-MTC, modificado por D.S. Nº 006-2008-MTC, ANEXO IV: PESOS Y MEDIDAS")
    c.setFont("Helvetica", 6)
    c.drawString(1.5*cm, height - 14.8*cm, "Artículo 37º.- Pesos máximos permitidos: (...) están exonerados del control de peso por eje o conjunto de ejes, los vehículos o combinaciones vehiculares que transiten con un")
    c.drawString(1.5*cm, height - 15.1*cm, "peso bruto vehicular que no exceda del 95% de la sumatoria de pesos por eje o conj")
    
    c.drawString(1.5*cm, height - 15.6*cm, "OBSERVACIONES: ..................................................................................................................................................................................................................................")
    c.drawString(1.5*cm, height - 16*cm, "........................................................................................................................................................................................................................................................................")

    # --- FIRMAS ---
    c.line(3*cm, 3.5*cm, 8.5*cm, 3.5*cm)
    c.drawCentredString(5.7*cm, 3.2*cm, "COMERCIAL")
    c.drawCentredString(5.7*cm, 2.8*cm, reg.usuario_creo or "---")
    
    c.line(11*cm, 3.5*cm, 16.5*cm, 3.5*cm)
    c.drawCentredString(13.7*cm, 3.2*cm, "CONDUCTOR")
    c.drawCentredString(13.7*cm, 2.8*cm, reg.nombre_chofer or "---")

    # --- NOTAS FINALES (TEXTO PEQUEÑO) ---
    c.setFont("Helvetica-Bold", 5)
    c.drawString(1.5*cm, 2.2*cm, "NOTA:")
    c.setFont("Helvetica", 5)
    notas = [
        "1.- LO CONSIGNADO EN EL PRESENTE FORMATO TIENE CARÁCTER DE DECLARACION JURADA, POR LO QUE ESTARA SUJETO A LO ESTABLECIDO EN EL ART. 32 NUMERAL 32.3 DE LA LEY",
        "Nº 27444; SIN PERJUICIO DE LA SANCION ADMINISTRATIVA CORRESPONDIENTE, TENIENDO QUE CUMPLIR QUIEN GENERA CARGA EL LLENADO DE LA PRESENTE CONSTANCIA",
        "2.- Solo para terminales Portuarios, Almacenes Aduaneros y de carga de Hidrocarburos. LA GUIA DE SALIDA, CONSTANCIA DE PESO O TICKET DE PESO DE SALIDA, reemplazará la presente",
        "constancia, la cual deberá contener lo indicado en el punto I.",
        "3.- Del punto IV- 'Dimensión total del vehículo y la carga', será llenado cuando excedan las dimensiones permitidas.",
        "4.- Para el transporte de contenedores vacíos, la presentacion de la EIR (Equipment Interchange Reception) reemplaza al presente formato, Asimismo, los contenedores no están sujetos",
        "al control de pesos por ejes.",
        "5.- Para el control en la balanza de las Estaciones de Pesaje 'Peso Bruto Total Transportado', se consideran las tolerancias del 3% vigente en el pesaje dinámico.",
        "6.- De no consignar los datos en el punto V. cuando corresponda, el generador de la carga declara que los pesos por eje están dentro de lo permitido en el RNV"
    ]
    curr_y = 1.9*cm
    for nota in notas:
        c.drawString(1.5*cm, curr_y, nota)
        curr_y -= 0.18*cm

    c.save()
    return file_path
