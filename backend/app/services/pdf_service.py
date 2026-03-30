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

        # Header con Logo Local
        try:
             # Validación Estricta de Imágenes en Memoria
             from PIL import Image as PILImage
             current_dir = os.path.dirname(os.path.abspath(__file__))
             assets_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "assets"))
             
             def get_safe_image(path, w, h):
                 try:
                     if not os.path.exists(path): return None
                     with open(path, "rb") as f: data = f.read()
                     # Validamos si es una imagen real para no crashear en doc.build()
                     PILImage.open(io.BytesIO(data)).verify()
                     return Image(io.BytesIO(data), width=w, height=h)
                 except Exception:
                     return None

             logo_obj = get_safe_image(os.path.join(assets_dir, "logo_beta.png"), 120, 45)
             
             # Verificar si es granada y adjuntar imagen local
             header_row = []
             if logo_obj: header_row.append(logo_obj)
             # Construir Título Personalizado (CLIENTE - DESTINO - PAIS - CULTIVO)
             cliente_txt = cliente_maestro.nombre_legal if cliente_maestro else cliente_nombre
             destino_txt = cliente_maestro.destino if cliente_maestro else getattr(pos, 'PUERTO_DESTINO', '')
             pais_txt = cliente_maestro.pais if cliente_maestro else ''
             
             subtitle_parts = [p for p in [cliente_txt, destino_txt, pais_txt] if p]
             subtitle_txt = " - ".join(subtitle_parts)
             
             titulo_html = f"INSTRUCCIONES DE EMBARQUE<br/>{subtitle_txt}<br/>{pos.CULTIVO or ''}"
             header_row.append(Paragraph(f"<b>{titulo_html}</b>", ParagraphStyle('Centered', fontSize=9, leading=10, alignment=1, fontName='Helvetica-Bold')))

             if "GRANADA" in (pos.CULTIVO or "").upper():
                 granada_obj = get_safe_image(os.path.join(assets_dir, "image_granada.png"), 40, 40)
                 if granada_obj: header_row.append(granada_obj)
             
             # Si no hay logo para anclar el título, poner fecha.
             if len(header_row) < 3:
                 header_row.append(Paragraph(f"<font size=7>FECHA: {datetime.now().strftime('%d/%m/%Y')}</font>", styles["Normal"]))
                 
             header_table = Table([header_row])
             header_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor("#7CC546"))]))
             elements.append(header_table)
        except Exception as e:
             elements.append(Paragraph(f"<b>INSTRUCCIONES DE EMBARQUE - BOOKING: {pos.BOOKING} | ORDEN: {pos.ORDEN_BETA}</b>", styles["Title"]))

        elements.append(Spacer(1, 12))

        # --- MASTER TABLE (Diseño Corporativo Consolidado) ---
        normal_font = ParagraphStyle('N', fontSize=7, leading=8)
        bold_font = ParagraphStyle('B', fontSize=7, leading=8, fontName='Helvetica-Bold')

        bg_orange = colors.HexColor("#F5A623") # Naranja Corporativo suave
        bg_gray = colors.HexColor("#F3F4F6")

        def b_p(text): return Paragraph(f"<b>{text}</b>", bold_font)
        def n_p(text): return Paragraph(str(text), normal_font)
        def format_desc(t1, t2): return Paragraph(f"{t1}<br/>{t2}", normal_font)

        fito = cliente_maestro.fitosanitario if hasattr(cliente_maestro, 'fitosanitario') and cliente_maestro.fitosanitario else None
        
        cult_en = "POMEGRANATES" if "GRANADA" in (pos.CULTIVO or "").upper() else pos.CULTIVO
        cult_es = "GRANADAS" if "GRANADA" in (pos.CULTIVO or "").upper() else pos.CULTIVO
        variedad = pedidos[0].variedad if pedidos and hasattr(pedidos[0], 'variedad') else "WONDERFUL"
        
        desc_en = f"{total_cajas} BOXES WITH FRESH {cult_en} {variedad} ON {total_pallets} PALLETS"
        desc_es = f"{total_cajas} CAJAS CON FRESCA {cult_es} {variedad} EN {total_pallets} PALETAS"

        fecha_llenado = f"{getattr(pos, 'FECHA_PROGRAMADA', '')} - {getattr(pos, 'HORA_PROGRAMADA', '')}".strip(" - ")

        t_data = [
            [b_p(pos.ORDEN_BETA or 'S/N'), b_p("")],
            [b_p("EMBARCADOR"), n_p("COMPLEJO AGROINDUSTRIAL BETA S.A.")],
            [b_p("DIRECCIÓN"), n_p("CAL. LEOPOLDO CARRILLO NRO. 160 ICA - CHINCHA - CHINCHA ALTA – PERU")],
            [b_p("OPERADOR LOGISTICO"), b_p(getattr(pos, 'OPERADOR_LOGISTICO', "DP WORLD LOGISTICS S.R.L."))],
            [b_p("DIRECCION DE LA PLANTA"), n_p(pos.PLANTA_LLENADO or "ICA CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU")],
            [b_p("UBIGEO PLANTA"), n_p("110111")],
            [b_p("FECHA Y HORA DEL LLENADO"), b_p(fecha_llenado)],
            
            [b_p("CONSIGNATARIO<br/>DIRECCIÓN"), format_desc(f"<b>{cliente_maestro.nombre_legal if cliente_maestro else cliente_nombre}</b>", cliente_maestro.direccion_consignatario if cliente_maestro else "")],
            [b_p("NOTIFICADO<br/>DIRECCIÓN"), format_desc(f"<b>{cliente_maestro.notify_bl if cliente_maestro else 'SAME AS CONSIGNEE'}</b>", cliente_maestro.direccion_notify if cliente_maestro else "")],
            
            [b_p("DATOS REFERENCIALES"), n_p("EORI CONSIGNE: PENDIENTE<br/>EORI NOTIFY: PENDIENTE")],
            
            [b_p("DESCRIPCION EN EL B/L"), format_desc(desc_en, desc_es)],
            [b_p("AGENCIA NAVIERA"), n_p(pos.NAVIERA or "")],
            [b_p("MOTONAVE"), n_p(pos.NAVE or "")],
            [b_p("BOOKING No."), b_p(pos.BOOKING or "")],
            [b_p("FREIGHT"), n_p("COLLECT")],
            [b_p("EMISION B/L"), n_p("SWB")],
            [b_p("PUERTO EMBARQUE"), n_p(getattr(pos, 'POL', "CALLAO") or "CALLAO")],
            [b_p("ETA"), n_p(getattr(pos, 'ETA', ''))],
            [b_p("PUERTO DESTINO"), n_p(cliente_maestro.destino if cliente_maestro else "")],
            [b_p("CANTIDAD DE CONTENEDORES"), n_p("01")],
            [b_p("PRODUCTO"), n_p(pos.CULTIVO or "GRANADAS")],
            [b_p("VARIEDAD"), n_p(variedad)],
            [b_p("TEMPERATURA"), n_p("6.0°C" if "GRANADA" in (pos.CULTIVO or "").upper() else "")],
            [b_p("VENTILACION"), n_p("15CBM" if "GRANADA" in (pos.CULTIVO or "").upper() else "")],
            [b_p("HUMEDAD"), n_p("OFF" if "GRANADA" in (pos.CULTIVO or "").upper() else "")],
            [b_p("ATMOSFERA CONTROLADA"), n_p("NO APLICA" if "GRANADA" in (pos.CULTIVO or "").upper() else "")],
            [b_p("OXIGENO"), n_p("NO APLICA" if "GRANADA" in (pos.CULTIVO or "").upper() else "")],
            [b_p("CO2"), n_p("NO APLICA" if "GRANADA" in (pos.CULTIVO or "").upper() else "")],
            [b_p("FILTROS"), b_p("NO")],
            [b_p("COLD TREAMENT"), b_p("NO")],
            [b_p("CANTIDAD"), n_p(f"{total_cajas} CAJAS APROX.")],
            [b_p("VALOR FOB APROXIMADO"), n_p("")],
            [b_p("OBSERVACIONES"), n_p(observaciones)],
            
            [Paragraph("<b>DATOS PARA CERTIFICADO FITOSANITARIO</b>", ParagraphStyle('Centered', fontSize=8, leading=9, alignment=1, fontName='Helvetica-Bold')), ""],
            
            [b_p("CONSIGNATARIO<br/>DIRECCIÓN"), format_desc(f"<b>{fito.consignatario_fito if fito else ''}</b>", fito.direccion_fito if fito else "")],
            [b_p("PAIS DE DESTINO"), b_p(cliente_maestro.pais if cliente_maestro else "")],
            [b_p("PUNTO DE LLEGADA"), b_p(cliente_maestro.destino if cliente_maestro else "")],
            [b_p("PRESENTACION"), b_p(getattr(pedidos[0], 'presentacion', "CAJA 3.8 KG") if pedidos else "CAJA 3.8 KG")],
            [b_p("ETIQUETAS"), b_p("GENERICA")],
            [b_p("PESO NETO ESTIMADO"), b_p(f"{total_cajas * float(peso_kg if peso_kg else 3.8):,.3f} KG")],
            [b_p("PESO BRUTO ESTIMADO"), b_p(f"{peso_bruto:,.3f} KG")]
        ]

        t = Table(t_data, colWidths=[6.5*cm, 12.5*cm])
        t_styles = [
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (0,-1), bg_gray), # 1ra col gris
            ('BACKGROUND', (0,3), (-1,3), bg_orange), # OP Log
            ('BACKGROUND', (0,6), (-1,6), bg_orange), # Fecha
            ('BACKGROUND', (0,28), (-1,29), bg_orange), # Filtros y Cold
            ('BACKGROUND', (0,33), (-1,33), bg_orange), # Fito Header
            ('SPAN', (0,33), (1,33)), # Merge fito header
            ('ALIGN', (0,33), (1,33), 'CENTER'),
        ]
        t.setStyle(TableStyle(t_styles))
        elements.append(t)

        # Build PDF
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return {
            "pdf_bytes": pdf_bytes,
            "orden_beta": pos.ORDEN_BETA
        }

instruction_pdf_service = InstructionPDFService()
