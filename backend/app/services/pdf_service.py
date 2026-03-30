from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
import io
import os
import re
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.maestros import ClienteIE

class InstructionPDFService:
    def _normalize_orden(self, raw_orden: str) -> str:
        if not raw_orden: return ""
        match = re.search(r'\d+', raw_orden)
        return match.group(0) if match else raw_orden

    def generate_instruction_pdf(self, booking: str, db: Session, observaciones: str = ""):
        # 1. Obtencion de datos
        pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
        if not pos: raise Exception(f"Booking {booking} no encontrado")

        normalized_orden = self._normalize_orden(pos.ORDEN_BETA)
        pedidos = db.query(PedidoComercial).filter(
            PedidoComercial.orden_beta.ilike(f"%{normalized_orden}%"),
            PedidoComercial.cultivo.ilike(pos.CULTIVO)
        ).all()

        total_cajas = sum(p.total_cajas or 0 for p in pedidos)
        total_pallets = sum(p.total_pallets or 0 for p in pedidos)
        cliente_nombre = pedidos[0].cliente if pedidos else "POR DEFINIR"
        peso_kg = pedidos[0].peso_por_caja or Decimal("0") if pedidos else Decimal("0")
        peso_bruto = float(total_cajas) * float(peso_kg) * 1.05

        cliente_maestro = db.query(ClienteIE).filter(ClienteIE.nombre_legal.ilike(cliente_nombre)).first()

        # 2. Construcción PDF (ReportLab - No requiere dependencias del sistema)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
        elements = []
        styles = getSampleStyleSheet()

        # Header con Logo (URL Beta o local)
        try:
             logo_url = "https://beta.com.pe/wp-content/uploads/2021/05/logo-complejo-agroindustrial-beta.png"
             header_table_data = [[Image(logo_url, width=120, height=45), Paragraph(f"<b>INSTRUCCIONES DE EMBARQUE</b><br/><font size=8>BOOKING: {pos.BOOKING} | ORDEN: {pos.ORDEN_BETA}</font>", styles["Title"]), Paragraph(f"<font size=7>FECHA: {datetime.now().strftime('%d/%m/%Y')}</font>", styles["Normal"])]]
             header_table = Table(header_table_data, colWidths=[4*cm, 11*cm, 3*cm])
             header_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor("#7CC546"))]))
             elements.append(header_table)
        except:
             elements.append(Paragraph(f"<b>INSTRUCCIONES DE EMBARQUE - {pos.BOOKING}</b>", styles["Title"]))

        elements.append(Spacer(1, 12))

        # Sección 1: Datos Cliente
        elements.append(Paragraph("<b>I. DATOS DEL CLIENTE Y DESTINO</b>", ParagraphStyle('Section', fontSize=9, textColor=colors.HexColor("#2D5A27"), backColor=colors.HexColor("#F8FAF7"), leftIndent=5, padding=5)))
        client_data = [
            ["CLIENTE / CONSIGNATARIO BL", "NOTIFY PARTY"],
            [cliente_maestro.nombre_legal if cliente_maestro else cliente_nombre, cliente_maestro.notify_bl if cliente_maestro else "SAME AS CONSIGNEE"],
            [cliente_maestro.direccion_consignatario if cliente_maestro else "", cliente_maestro.direccion_notify if cliente_maestro else ""]
        ]
        ct = Table(client_data, colWidths=[9.5*cm, 8.5*cm])
        ct.setStyle(TableStyle([('FONTSIZE', (0,0), (-1,-1), 8), ('GRID', (0,0), (-1,-1), 0.5, colors.grey), ('VALIGN',(0,0),(-1,-1),'TOP')]))
        elements.append(ct)

        elements.append(Spacer(1, 12))

        # Sección 2: Carga
        elements.append(Paragraph("<b>II. DATOS DE LA CARGA</b>", ParagraphStyle('Section', fontSize=9, textColor=colors.HexColor("#2D5A27"), backColor=colors.HexColor("#F8FAF7"), leftIndent=5, padding=5)))
        carga_data = [
            ["CULTIVO", "CAJAS", "PALLETS", "PESO BRUTO KG", "VARIEDAD"],
            [pos.CULTIVO, f"{total_cajas}", f"{total_pallets}", f"{round(peso_bruto,2)} KG", pedidos[0].variedad if pedidos else "S/N"]
        ]
        cat = Table(carga_data, colWidths=[3.6*cm]*5)
        cat.setStyle(TableStyle([('FONTSIZE', (0,0), (-1,-1), 8), ('GRID', (0,0), (-1,-1), 0.5, colors.grey), ('ALIGN', (0,0), (-1,-1), 'CENTER')]))
        elements.append(cat)

        elements.append(Spacer(1, 12))

        # Sección 3: Logística
        elements.append(Paragraph("<b>III. PORMENORES LOGÍSTICOS</b>", ParagraphStyle('Section', fontSize=9, textColor=colors.HexColor("#2D5A27"), backColor=colors.HexColor("#F8FAF7"), leftIndent=5, padding=5)))
        log_data = [
            ["NAVE / VIAJE", pos.NAVE or "PENDIENTE", "PUERTO DESTINO", cliente_maestro.destino if cliente_maestro else "N/A"],
            ["NAVIERA", pos.NAVIERA or "S/N", "PLANTA LLENADO", pos.PLANTA_LLENADO or "S/N"]
        ]
        lt = Table(log_data, colWidths=[4.5*cm, 4.5*cm, 4.5*cm, 4.5*cm])
        lt.setStyle(TableStyle([('FONTSIZE', (0,0), (-1,-1), 8), ('GRID', (0,0), (-1,-1), 0.5, colors.grey)]))
        elements.append(lt)

        elements.append(Spacer(1, 12))
        
        # Observaciones
        elements.append(Paragraph("<b>IV. OBSERVACIONES</b>", styles["Normal"]))
        elements.append(Paragraph(observaciones or "SIN OBSERVACIONES ADICIONALES.", styles["Normal"]))

        # Build PDF
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return {
            "pdf_bytes": pdf_bytes,
            "orden_beta": pos.ORDEN_BETA
        }

instruction_pdf_service = InstructionPDFService()
