from reportlab.lib.colors import HexColor, whitesmoke, grey, lightgreen
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle
from sqlalchemy.orm import Session
from app.models.logicapture import LogiCaptureRegistro
from app.models.maestros import VehiculoTracto, VehiculoCarreta
from datetime import datetime
import os

# Configuración de Identidad Beta
BETA_CONFIG = {
    "empresa": "COMPLEJO AGROINDUSTRIAL BETA S.A.",
    "ruc": "20297939131",
    "telefono": "056-581150",
    "logo_path": "assets/logo.png" # Ruta relativa al CWD del backend
}

def get_mtc_config(tracto_ejes: int, carreta_ejes: int, cert_carreta: str = "", is_especial: bool = False):
    """Determina la configuración vehicular MTC basada en ejes y decisión del operador."""
    t_ejes = tracto_ejes or 0
    c_ejes = carreta_ejes or 0
    cert = (cert_carreta or "").upper()
    
    if t_ejes == 3:
        if c_ejes == 2:
            # Prioridad a la decisión manual del operador Se2 (Switch)
            if is_especial: return "T3/Se2", 47000
            # Fallback a detección por certificado si no se marcó el switch
            if "SE2" in cert: return "T3/Se2", 47000
            return "T3/S2", 43000
        if c_ejes == 3:
            return "T3/S3", 48000
            
    return f"T{t_ejes}S{c_ejes}", 48000

def generate_anexo_1_pdf(db: Session, registro_id: int, is_especial: bool = False):
    """
    Motor industrial para la generación del Anexo 1 (Pesos y Medidas).
    """
    # 1. Recuperar Data del Registro
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == registro_id).first()
    if not reg: return None

    # 2. Recuperar Data Técnica de Maestros
    tracto = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == reg.placa_tracto).first()
    carreta = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == reg.placa_carreta).first()

    # Determinar Configuración Vehicular con prioridad a la decisión del operador
    conf_label, peso_max = get_mtc_config(
        tracto.numero_ejes if tracto else 0, 
        carreta.numero_ejes if carreta else 0,
        carreta.certificado_vehicular_carreta if carreta else "",
        is_especial
    )

    # 3. Preparar archivo temporal sustentable
    file_name = f"anexo1_{registro_id}.pdf"
    file_path = os.path.join("/tmp", file_name) if os.name != 'nt' else os.path.join(os.getcwd(), file_name)
    
    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4
    emerald_beta = HexColor("#10b981")

    # --- ENCABEZADO ---
    # Buscar logo en rutas relativas comunes
    potential_logo = os.path.join(os.getcwd(), BETA_CONFIG["logo_path"])
    if os.path.exists(potential_logo):
        c.drawImage(potential_logo, 2*cm, height - 3*cm, width=4*cm, preserveAspectRatio=True)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, height - 2*cm, "ANEXO No 01: PESO Y MEDIDAS")
    
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 2*cm, height - 1.5*cm, f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")
    c.drawRightString(width - 2*cm, height - 1.9*cm, f"Hora: {datetime.now().strftime('%H:%M')}")

    # --- DATOS DE LA EMPRESA ---
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, height - 4*cm, "DATOS DEL REMITENTE / GENERADOR")
    c.setFont("Helvetica", 9)
    c.drawString(2.5*cm, height - 4.5*cm, f"Razón Social: {BETA_CONFIG['empresa']}")
    c.drawString(2.5*cm, height - 4.9*cm, f"RUC: {BETA_CONFIG['ruc']}")
    c.drawString(2.5*cm, height - 5.3*cm, f"Teléfono: {BETA_CONFIG['telefono']}")

    # --- TABLA TÉCNICA DE TRANSPORTE ---
    data_transporte = [
        ["RECURSO", "PLACA", "MARCA / MODELO", "EJES", "DIMENSIONES (L x A x H)", "CONFIG. MTC"],
        ["TRACTO", reg.placa_tracto or "N/D", tracto.marca if tracto else "N/D", str(tracto.numero_ejes) if tracto else "-", 
         f"{tracto.largo_tracto}x{tracto.ancho_tracto}x{tracto.alto_tracto}" if tracto else "-", conf_label],
        ["CARRETA", reg.placa_carreta or "N/D", "-", str(carreta.numero_ejes) if carreta else "-", 
         f"{carreta.largo_carreta}x{carreta.ancho_carreta}x{carreta.alto_carreta}" if carreta else "-", "-"]
    ]

    table = Table(data_transporte, colWidths=[3*cm, 2.5*cm, 4*cm, 2*cm, 4.5*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), emerald_beta),
        ('TEXTCOLOR', (0, 0), (-1, 0), whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    table.wrapOn(c, width, height)
    table.drawOn(c, 2*cm, height - 8.5*cm)

    # --- RESULTADOS DE PESAJE ---
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, height - 9.5*cm, "RESULTADOS DEL PESAJE (KILOGRAMOS)")
    
    tara_vehi = (tracto.peso_neto_tracto or 0) + (carreta.peso_neto_carreta or 0) if tracto and carreta else 0
    bruto = reg.peso_bruto or 0
    tara_cont = reg.peso_tara_contenedor or 0
    neto_carga = reg.peso_neto_carga or 0

    pesaje_data = [
        ["DESCRIPCIÓN", "VALOR (KG)", "MTC LÍMITE"],
        ["TARA DEL VEHÍCULO (TRACTO + CARRETA)", f"{tara_vehi:,.2f}", "-"],
        ["TARA DEL CONTENEDOR", f"{tara_cont:,.2f}", "-"],
        ["PESO NETO DE CARGA", f"{neto_carga:,.2f}", "-"],
        ["PESO BRUTO TOTAL", f"{bruto:,.2f}", f"{peso_max:,.2f}"]
    ]

    p_table = Table(pesaje_data, colWidths=[8*cm, 4*cm, 6*cm])
    p_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, grey),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 4), (-1, 4), lightgreen if bruto <= peso_max else HexColor("#fee2e2")),
    ]))
    
    p_table.wrapOn(c, width, height)
    p_table.drawOn(c, 2*cm, height - 13*cm)

    if bruto > peso_max:
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(HexColor("#b91c1c"))
        c.drawString(2*cm, height - 13.5*cm, f"ALERTA: EXCESO DE PESO DETECTADO (+{(bruto - peso_max):,.2f} KG)")

    # --- FIRMAS ---
    c.setFillColor(HexColor("#000000"))
    c.line(3*cm, 4*cm, 8*cm, 4*cm)
    c.drawCentredString(5.5*cm, 3.5*cm, "CONTROL PESAJE BETA")
    
    c.line(12*cm, 4*cm, 17*cm, 4*cm)
    c.drawCentredString(14.5*cm, 3.5*cm, f"CONDUCTOR: {reg.placa_tracto}")

    c.save()
    return file_path
