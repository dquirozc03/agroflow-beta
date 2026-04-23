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

def generate_anexo_1_pdf(db: Session, registro_id: int, is_especial: bool = False, guia_remision: str = ""):
    """
    Constancia de Verificación de Pesos y Medidas (MTC oficial).
    """
    from app.models.auth import Usuario
    
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == registro_id).first()
    if not reg: return None

    # Obtener Nombre Real del Usuario de Registro (Normalizado para match) 🕵️‍♂️🔍
    user_alias = (reg.usuario_registro or "").replace("@", "").strip()
    usuario_real = db.query(Usuario).filter(Usuario.usuario.ilike(user_alias)).first()
    nombre_operador = usuario_real.nombre if usuario_real else reg.usuario_registro

    # Limpieza de Placas para Match Robusto 🧼🏎️
    from app.routers.logicapture import clean_plate
    placa_tracto_clean = clean_plate(reg.placa_tracto or "")
    placa_carreta_clean = clean_plate(reg.placa_carreta or "")

    tracto = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == placa_tracto_clean).first()
    carreta = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == placa_carreta_clean).first()

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
    c.setFillColor(black) # Forzamos color negro desde el primer trazo 🖤✨
    
    # --- CABECERA OFICIAL ---
    logo_file = find_asset("logo_beta.png")
    if logo_file:
        try:
            c.drawImage(logo_file, 1.5*cm, height - 3*cm, width=3.5*cm, height=1.5*cm, preserveAspectRatio=True, mask='auto')
        except Exception as e:
            print(f"LOGO ERROR: {e}")
    
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(width/2 + 1*cm, height - 1.5*cm, "CONSTANCIA DE VERIFICACION DE PESOS Y MEDIDAS")
    
    c.setFont("Helvetica-Bold", 6.5)
    header_text_lines = [
        "ALMACENES, TERMINALES DE ALMACENAMIENTO, TERMINALES PORTUARIOS O AEROPORTUARIOS, GENERADORES,",
        "DADORES O REMITENTES DE LA MERCANCIA",
        "DECRETO SUPREMO Nº 058-2003-MTC REGLAMENTO NACIONAL DE VEHICULOS Y SUS NORMAS MODIFICATORIAS"
    ]
    curr_y = height - 2.1*cm
    for line in header_text_lines:
        c.drawCentredString(width/2 + 1*cm, curr_y, line)
        curr_y -= 0.32*cm

    # Fecha
    c.setFont("Helvetica-Bold", 8)
    c.drawString(1.5*cm, height - 3.8*cm, f"Fecha :   {datetime.now().strftime('%d/%m/%Y')}")

    # --- I) DATOS DEL GENERADOR DE CARGA ---
    c.setFont("Helvetica-Bold", 8)
    c.drawString(1.5*cm, height - 4.4*cm, "I) DATOS DEL GENERADOR DE CARGA")
    
    # Cuadro de Control (Posición final ajustada)
    c.setLineWidth(0.6)
    c.setFillColor(HexColor("#cccccc"))
    c.rect(13.8*cm, height - 4.6*cm, 2*cm, 0.5*cm, fill=1, stroke=1)
    c.setFillColor(yellow)
    c.rect(15.8*cm, height - 4.6*cm, 3*cm, 0.5*cm, fill=1, stroke=1)
    
    # Lookup Maestro de Planta para Datos de Ubicación y Trazabilidad
    from app.models.maestros import Planta
    nombre_planta_busqueda = (reg.planta or "").strip()
    planta_db = db.query(Planta).filter(Planta.planta.ilike(f"%{nombre_planta_busqueda}%")).first()

    # 1. Código de Trazabilidad Dinámico
    centro_planta = planta_db.centro if (planta_db and planta_db.centro) else "4102"
    fecha_trazabilidad = datetime.now().strftime('%d%m%y')
    codigo_completo = f"{centro_planta}{fecha_trazabilidad}"

    c.setFillColor(black) # Forzamos NEGRO para el texto sobre el amarillo
    c.setFont("Helvetica-Bold", 8.5)
    # Centrado exacto en el cuadro amarillo (Midpoint vertical y horizontal)
    c.drawCentredString(17.3*cm, height - 4.38*cm, codigo_completo)
    
    # Datos dinámicos con Fallback a BETA_CONFIG por seguridad 🛡️
    empresa_upper = BETA_CONFIG['empresa'].upper()
    direccion_upper = (planta_db.direccion if planta_db and planta_db.direccion else BETA_CONFIG['direccion']).upper()
    distrito_upper = (planta_db.distrito if planta_db and planta_db.distrito else BETA_CONFIG['distrito']).upper()
    provincia_upper = (planta_db.provincia if planta_db and planta_db.provincia else BETA_CONFIG['provincia']).upper()
    depto_upper = (planta_db.departamento if planta_db and planta_db.departamento else BETA_CONFIG['departamento']).upper()

    data_remitente = [
        ["NOMBRE DE\nLA EMPRESA", empresa_upper, "Nº RUC", BETA_CONFIG['ruc'], "TELEF.", BETA_CONFIG['telefono']],
        ["DIRECCION", direccion_upper, "", "", "", ""],
        ["DISTRITO", distrito_upper, "PROVINCIA", provincia_upper, "DEPARTAMENTO", depto_upper]
    ]
    t1 = Table(data_remitente, colWidths=[2.5*cm, 5.0*cm, 1.5*cm, 3*cm, 2.5*cm, 3*cm], rowHeights=[1.0*cm, 0.6*cm, 0.6*cm])
    t1.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, black),
        ('FONTSIZE', (0,0), (-1,-1), 6.5),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (2,0), 'CENTER'),
        ('ALIGN', (2,2), (2,2), 'CENTER'),
        ('ALIGN', (4,0), (4,0), 'CENTER'),
        ('ALIGN', (4,2), (4,2), 'CENTER'),
        ('ALIGN', (3,0), (3,0), 'CENTER'),
        ('ALIGN', (5,0), (5,0), 'CENTER'),
        ('ALIGN', (1,2), (1,2), 'CENTER'),
        ('ALIGN', (3,2), (3,2), 'CENTER'),
        ('ALIGN', (5,2), (5,2), 'CENTER'),
        ('BACKGROUND', (0,0), (0,-1), HexColor("#cccccc")),
        ('BACKGROUND', (2,0), (2,0), HexColor("#cccccc")),
        ('BACKGROUND', (2,2), (2,2), HexColor("#cccccc")),
        ('BACKGROUND', (4,0), (4,0), HexColor("#cccccc")),
        ('BACKGROUND', (4,2), (4,2), HexColor("#cccccc")),
        ('SPAN', (1,1), (5,1)),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    t1.wrapOn(c, width, height)
    t1.drawOn(c, 1.5*cm, height - 7.2*cm)

    # --- II) TIPO DE MERCANCIA TRANSPORTADA ---
    cultivo_text = (reg.cultivo or "PRODUCTO AGRICOLA").upper()
    c.setFont("Helvetica-Bold", 8)
    c.drawString(1.5*cm, height - 7.6*cm, f"II) TIPO DE MERCANCIA TRANSPORTADA:   {cultivo_text}")
    c.setFont("Helvetica", 7)
    guia_text = (guia_remision or "").upper()
    c.drawString(1.5*cm, height - 8.0*cm, f"SEGUN GUIA DE REMISION QUE SE ADJUNTA:  {guia_text}")
    
    data_checks = [
        ["BALANZA", "", "SOFTWARE", "", "CUBICACION", "", "OTROS", "X"]
    ]
    t_chk = Table(data_checks, colWidths=[2*cm, 1.5*cm, 2.5*cm, 3*cm, 2.5*cm, 3*cm, 1.5*cm, 1.5*cm], rowHeights=[0.6*cm])
    t_chk.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, black),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (0,0), HexColor("#cccccc")),
        ('BACKGROUND', (2,0), (2,0), HexColor("#cccccc")),
        ('BACKGROUND', (4,0), (4,0), HexColor("#cccccc")),
        ('BACKGROUND', (6,0), (6,0), HexColor("#cccccc")),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    t_chk.wrapOn(c, width, height)
    t_chk.drawOn(c, 1.5*cm, height - 9.0*cm)

    # --- IV) DATOS DEL VEHICULO ---
    c.setFont("Helvetica-Bold", 8)
    c.drawString(1.5*cm, height - 9.7*cm, "IV) DATOS DEL VEHICULO")

    
    # Títulos con saltos de línea optimizados
    h_dim = "DIMENSION TOTAL\nDEL VEHICULO (mt)\n(incluida la mercancia)"
    h_perm = "PESO BRUTO VEHICULAR\nMAX. PERMITIDO (KG.)\n(1)"
    h_total = "PESO BRUTO TOTAL\nTRANSPORTADO\n(KG)"
    h_ctr1 = "PBMax. Para no control\nde pesos por ejes (DS\n006-2008-MTC) (Kg) (2)"
    h_ctr2 = "PBMax. Para no control\nde pesos por ejes (DS\n006-2008-MTC) (Kg) con\nBonif. x Susp. Neu (3)"

    head_v = [
        ["PLACAS\n(camion, tracto,\nremolque, carreta)", h_dim, "", "", "CONFIGURACION\nVEHICULAR", h_perm, h_total, h_ctr1, h_ctr2],
        ["", "LARGO", "ANCHO", "ALTO", "", "", "", "", ""]
    ]
    
    bruto_f = float(reg.peso_bruto or 0)
    peso_max_f = float(peso_max)
    pb_95 = float(peso_max_f * 0.95)

    data_v = [
        [reg.placa_tracto or "-", f"{tracto.largo_tracto if tracto else '0.00'}", f"{tracto.ancho_tracto if tracto else '0.00'}", f"{tracto.alto_tracto if tracto else '0.00'}", conf_label, f"{peso_max_f:,.0f}", f"{bruto_f:,.0f}", f"{pb_95:,.0f}", "-"],
        [reg.placa_carreta or "-", f"{carreta.largo_carreta if carreta else '0.00'}", f"{carreta.ancho_carreta if carreta else '0.00'}", f"{carreta.alto_carreta if carreta else '0.00'}", "", "", "", "", ""]
    ]
    
    full_v = head_v + data_v
    col_w_v = [2.0*cm, 0.9*cm, 0.9*cm, 0.9*cm, 1.8*cm, 2.2*cm, 2.2*cm, 3.55*cm, 3.55*cm]
    row_h_v = [1.3*cm, 0.5*cm, 0.65*cm, 0.65*cm] 

    t_vh = Table(full_v, colWidths=col_w_v, rowHeights=row_h_v)
    t_vh.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, black),
        ('FONTSIZE', (0,0), (-1,1), 5.0),
        ('FONTSIZE', (0,2), (-1,-1), 8.0),
        ('FONTNAME', (0,0), (-1,1), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,1), HexColor("#cccccc")),
        ('SPAN', (0,0), (0,1)), ('SPAN', (1,0), (3,0)), ('SPAN', (4,0), (4,1)), 
        ('SPAN', (5,0), (5,1)), ('SPAN', (6,0), (6,1)), ('SPAN', (7,0), (7,1)), ('SPAN', (8,0), (8,1)),
        ('SPAN', (4,2), (4,3)), ('SPAN', (5,2), (5,3)), ('SPAN', (6,2), (6,3)), ('SPAN', (7,2), (7,3)), ('SPAN', (8,2), (8,3)),
        ('BACKGROUND', (6,2), (6,3), yellow),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    t_vh.wrapOn(c, width, height)
    t_vh.drawOn(c, 1.5*cm, height - 13.5*cm)

    # Notas al pie de la tabla IV
    c.setFont("Helvetica", 5.0)
    curr_nota_y = height - 14.2*cm
    c.drawString(1.5*cm, curr_nota_y, "(1) SE OBTIENE DEL ANEXO IV DEL RNV. DS 058-2003")
    curr_nota_y -= 0.38*cm
    c.drawString(1.5*cm, curr_nota_y, "(2) EL GENERADOR DEBERA CONTROLAR QUE EL PESO BRUTO TRANSPORTADO NO SEA MAYOR QUE EL 95%")
    curr_nota_y -= 0.33*cm
    c.drawString(1.8*cm, curr_nota_y, "DE LA SUMATORIA DE LOS PESOS POR EJES O CONJUNTOS DE EJES INDICADOS EN EL ANEXO IV DEL RNV")
    curr_nota_y -= 0.38*cm
    c.drawString(1.5*cm, curr_nota_y, "(3) PB MAX PARA NO CONTROL PxEJES A VEHICULOS CON BONIFICACIONES PERMITIDAS PARA SUSP. NEUMATICA Y NEUMAT EXTRA ANCHOS")
    curr_nota_y -= 0.38*cm

    # --- III) CONTROL POR EJES (FORMATO IMAGEN 2) ---
    c.setFont("Helvetica-Bold", 8)
    c.drawString(1.5*cm, height - 15.9*cm, "II) CONTROL DE PESOS POR EJE O CONJUNTO DE EJES:")
    c.setFont("Helvetica", 6)
    c.drawString(1.5*cm, height - 16.2*cm, "Para aquellos vehículos que exceden el 95% de la suma de los pesos por ejes")
    
    data_ejes = [
        ["", "DISTRIBUCION DE PESOS POR CONJUNTO DE EJES EN KG.", "", "", "", "", ""],
        ["PESOS", "1er Cjto", "2do Cjto", "3er Cjto", "4to Cjto", "5to Cjto", "6to Cjto"],
        ["", "-", "-", "-", "-", "-", "-"]
    ]
    # Alturas para la tabla de ejes con mayor holgura 📏
    t_ej = Table(data_ejes, colWidths=[2*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm], rowHeights=[0.55*cm, 0.55*cm, 0.65*cm])
    t_ej.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, black),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('FONTNAME', (0,0), (-1,1), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,1), HexColor("#cccccc")),
        ('SPAN', (1,0), (6,0)),
        ('SPAN', (0,0), (0,1)),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    t_ej.wrapOn(c, width, height)
    t_ej.drawOn(c, 1.5*cm, height - 18.6*cm) # Baja para llenar la hoja

    # --- TEXTO LEGAL Y OBSERVACIONES ---
    c.setFont("Helvetica-Bold", 6)
    c.drawString(1.5*cm, height - 19.3*cm, "DECRETO SUPREMO Nº 058-2003-MTC, modificado por D.S. Nº 006-2008-MTC, ANEXO IV: PESOS Y MEDIDAS")
    c.setFont("Helvetica", 6)
    c.drawString(1.5*cm, height - 19.6*cm, "Artículo 37º.- Pesos máximos permitidos: (...) están exonerados del control de peso por eje o conjunto de ejes, los vehículos o combinaciones vehiculares que transiten con un")
    c.drawString(1.5*cm, height - 19.9*cm, "peso bruto vehicular que no exceda del 95% de la sumatoria de pesos por eje o conj")
    
    c.drawString(1.5*cm, height - 20.6*cm, "OBSERVACIONES: ..................................................................................................................................................................................................................................")
    c.drawString(1.5*cm, height - 21.1*cm, "........................................................................................................................................................................................................................................................................")
    c.drawString(1.5*cm, height - 21.6*cm, "........................................................................................................................................................................................................................................................................")

    # --- FIRMAS (DETALLE PERSONALIZADO SEGÚN IMAGEN) ---
    def format_name(full_name: str):
        if not full_name or full_name == "---": return "---"
        p = full_name.strip().split()
        if len(p) >= 3:
            return f"{p[0]} {p[-2]} {p[-1][0]}.".upper()
        return full_name.upper()

    user_formatted = format_name(nombre_operador or "OPERADOR LOGICAPTURE")
    chofer_formatted = format_name(reg.nombre_chofer or "CONDUCTOR")

    sign_y = 5.5*cm # Un poco más arriba para dar espacio a los textos inferiores
    c.setLineWidth(0.5)
    c.setDash(1, 2) # Línea punteada como en la imagen 🏁
    
    # Firma COMERCIAL
    c.line(3*cm, sign_y, 8.5*cm, sign_y)
    c.setDash() # Quitar el punteado para los textos
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(5.7*cm, sign_y - 0.4*cm, user_formatted) # Nombre debajo de la línea
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(5.7*cm, sign_y - 0.8*cm, "COMERCIAL") # Cargo más abajo
    
    # Firma CONDUCTOR
    c.setDash(1, 2)
    c.line(11*cm, sign_y, 16.5*cm, sign_y)
    c.setDash()
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(13.7*cm, sign_y - 0.4*cm, chofer_formatted) # Nombre debajo de la línea
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(13.7*cm, sign_y - 0.8*cm, "CONDUCTOR") # Cargo más abajo

    # --- NOTAS FINALES (DIVIDIDAS E INTERLINEADO MAYOR) ---
    c.setFont("Helvetica-Bold", 5.5)
    c.drawString(1.5*cm, 2.8*cm, "NOTA:")
    c.setFont("Helvetica", 5.5)
    
    # Divididas para que no se escapen de la hoja 🗒️
    notas = [
        "1.- LO CONSIGNADO EN EL PRESENTE FORMATO TIENE CARÁCTER DE DECLARACION JURADA, POR LO QUE ESTARA SUJETO A LO ESTABLECIDO EN EL ART. 32 NUMERAL 32.3",
        "    DE LA LEY Nº 27444; SIN PERJUICIO DE LA SANCION ADMINISTRATIVA CORRESPONDIENTE, TENIENDO QUE CUMPLIR QUIEN GENERA CARGA EL LLENADO DE LA PRESENTE CONSTANCIA",
        "2.- Solo para terminales Portuarios, Almacenes Aduaneros y de carga de Hidrocarburos. LA GUIA DE SALIDA, CONSTANCIA DE PESO O TICKET DE PESO DE SALIDA,",
        "    reemplazará la presente constancia, la cual deberá contener lo indicado en el punto I.",
        "3.- Del punto IV- 'Dimensión total del vehículo y la carga', será llenado cuando excedan las dimensiones permitidas.",
        "4.- Para el transporte de contenedores vacíos, la presentacion de la EIR (Equipment Interchange Reception) reemplaza al presente formato,",
        "    asimismo, los contenedores no están sujetos al control de pesos por ejes.",
        "5.- Para el control en la balanza de las Estaciones de Pesaje 'Peso Bruto Total Transportado', se consideran las tolerancias del 3% vigente en el pesaje dinámico.",
        "6.- De no consignar los datos en el punto V. cuando corresponda, el generador de la carga declara que los pesos por eje están dentro de lo permitido en el RNV"
    ]
    curr_y = 2.5*cm
    for nota in notas:
        c.drawString(1.5*cm, curr_y, nota)
        curr_y -= 0.22*cm # Interlineado aumentado 🍃

    c.save()
    return file_path
