import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Table, TableStyle, Paragraph, Spacer
from sqlalchemy.orm import Session
from app.models.logicapture import LogiCaptureRegistro
from app.models.maestros import VehiculoTracto, VehiculoCarreta
from datetime import datetime

# Configuración de Identidad Beta
BETA_CONFIG = {
    "empresa": "COMPLEJO AGROINDUSTRIAL BETA S.A.",
    "ruc": "20297939131",
    "telefono": "056-581150",
    "logo_path": "backend/assets/logo.png"
}

def generate_anexo_1_pdf(db: Session, registro_id: int):
    """
    Motor industrial para la generación del Anexo 1 (Pesos y Medidas).
    Cruza datos de la salida con los maestros técnicos de transporte.
    """
    # 1. Recuperar Data del Registro
    reg = db.query(LogiCaptureRegistro).filter(LogiCaptureRegistro.id == registro_id).first()
    if not reg:
        return None

    # 2. Recuperar Data Técnica de Maestros (Cruze por Placas)
    tracto = db.query(VehiculoTracto).filter(VehiculoTracto.placa_tracto == reg.placa_tracto).first()
    carreta = db.query(VehiculoCarreta).filter(VehiculoCarreta.placa_carreta == reg.placa_carreta).first()

    # 3. Preparar archivo temporal
    file_path = f"/tmp/anexo1_{registro_id}.pdf"
    if not os.path.exists("/tmp"):
        os.makedirs("/tmp")
    
    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4

    # --- ENCABEZADO PREMIUM ---
    if os.path.exists(BETA_CONFIG["logo_path"]):
        c.drawImage(BETA_CONFIG["logo_path"], 2*cm, height - 3*cm, width=4*cm, preserveAspectRatio=True)
    
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
        ["RECURSO", "PLACA", "MARCA / MODELO", "EJES", "DIMENSIONES (L x A x H)", "CERTIFICADO"],
        ["TRACTO", reg.placa_tracto or "N/D", tracto.marca if tracto else "N/D", str(tracto.numero_ejes) if tracto else "-", 
         f"{tracto.largo_tracto}x{tracto.ancho_tracto}x{tracto.alto_tracto}" if tracto else "-", tracto.cert_tracto if tracto else "-"],
        ["CARRETA", reg.placa_carreta or "N/D", "-", str(carreta.numero_ejes) if carreta else "-", 
         f"{carreta.largo_carreta}x{carreta.ancho_carreta}x{carreta.alto_carreta}" if carreta else "-", carreta.cert_carreta if carreta else "-"]
    ]

    table = Table(data_transporte, colWidths=[3*cm, 2.5*cm, 4*cm, 2*cm, 4.5*cm, 3*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.emerald),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    table.wrapOn(c, width, height)
    table.drawOn(c, 2*cm, height - 8.5*cm)

    # --- RESULTADOS DE PESAJE (ZONA CRÍTICA) ---
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, height - 9.5*cm, "RESULTADOS DEL PESAJE (KILOGRAMOS)")
    
    # Cálculos Automáticos
    tara_vehi = (tracto.peso_neto_tracto or 0) + (carreta.peso_neto_carreta or 0) if tracto and carreta else 0
    bruto = reg.peso_bruto or 0
    tara_cont = reg.peso_tara_contenedor or 0
    neto_carga = reg.peso_neto_carga or 0

    pesaje_data = [
        ["DESCRIPCIÓN", "VALOR (KG)", "OBSERVACIONES"],
        ["TARA DEL VEHÍCULO (TRACTO + CARRETA)", f"{tara_vehi:,.2f}", "De Maestros"],
        ["TARA DEL CONTENEDOR", f"{tara_cont:,.2f}", "Ingreso Manual"],
        ["PESO NETO DE CARGA", f"{neto_carga:,.2f}", "Ingreso Manual"],
        ["PESO BRUTO TOTAL", f"{bruto:,.2f}", "Suma Automática"]
    ]

    p_table = Table(pesaje_data, colWidths=[8*cm, 4*cm, 6*cm])
    p_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 4), (-1, 4), colors.lightgreen),
    ]))
    
    p_table.wrapOn(c, width, height)
    p_table.drawOn(c, 2*cm, height - 13*cm)

    # --- FIRMAS ---
    c.line(3*cm, 4*cm, 8*cm, 4*cm)
    c.drawCentredString(5.5*cm, 3.5*cm, "CONTROL PESAJE BETA")
    
    c.line(12*cm, 4*cm, 17*cm, 4*cm)
    c.drawCentredString(14.5*cm, 3.5*cm, f"CONDUCTOR: {reg.placa_tracto}")

    c.save()
    return file_path
