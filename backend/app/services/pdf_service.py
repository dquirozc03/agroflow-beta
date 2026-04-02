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
from app.utils.formatters import normalize_client_name
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.maestros import ClienteIE, Planta

class InstructionPDFService:
    # --- Constantes de Diseño (Westfalia V2 Style) ---
    COLOR_BETA_GREEN = colors.HexColor("#7CC546")
    COLOR_BETA_ORANGE = colors.HexColor("#F5A623")
    COLOR_BG_GRAY = colors.HexColor("#F3F4F6")
    
    FONT_NORMAL = 'Helvetica'
    FONT_BOLD = 'Helvetica-Bold'
    SIZE_HEADER = 9
    SIZE_BODY = 7
    SIZE_FITO = 8

    def _normalize_orden(self, raw_orden: str) -> str:
        if not raw_orden: return ""
        match = re.search(r'\d+', raw_orden)
        return match.group(0) if match else raw_orden

    def _match_cliente_maestro(self, db: Session, cliente_nombre: str, pais: str, pod: str) -> Optional[ClienteIE]:
        """
        Lógica de Match Inteligente (Westfalia Match 💎 v2.2)
        Encapsulada para reutilización y limpieza.
        """
        from sqlalchemy import func
        
        pais_val = pais.strip() if pais else ""
        pod_val = pod.strip() if pod else ""
        cliente_clean_val = cliente_nombre.strip()

        # 1. Match Exacto (Nombre + Pais + POD)
        cliente = db.query(ClienteIE).filter(
            func.trim(ClienteIE.nombre_legal).ilike(cliente_clean_val),
            func.trim(ClienteIE.pais).ilike(pais_val),
            func.trim(ClienteIE.destino).ilike(pod_val)
        ).first()

        # 2. Match Semiexacto (Nombre + Pais)
        if not cliente:
            cliente = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(cliente_clean_val),
                func.trim(ClienteIE.pais).ilike(pais_val)
            ).first()

        # 3. Match solo por Nombre Legal
        if not cliente:
            cliente = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(cliente_clean_val)
            ).first()

        # 4. Smart Match (Fuzzy / Normalizado)
        if not cliente:
            clean_name = normalize_client_name(cliente_nombre)
            
            # 4.1. Contenido + Pais
            cliente = db.query(ClienteIE).filter(
                (func.trim(ClienteIE.nombre_legal).ilike(f"%{clean_name}%")) | 
                (func.upper(clean_name).like(func.concat('%', func.trim(ClienteIE.nombre_legal), '%'))),
                func.trim(ClienteIE.pais).ilike(pais_val),
                ClienteIE.estado == "ACTIVO"
            ).first()

            # 4.2. Fallback: Solo Contenido (Sin Pais)
            if not cliente:
                cliente = db.query(ClienteIE).filter(
                    (func.trim(ClienteIE.nombre_legal).ilike(f"%{clean_name}%")) | 
                    (func.upper(clean_name).like(func.concat('%', func.trim(ClienteIE.nombre_legal), '%'))),
                    ClienteIE.estado == "ACTIVO"
                ).first()
        
        return cliente

    def generate_instruction_pdf(self, booking: str, db: Session, observaciones: str = ""):
        # 1. Obtencion de datos
        pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
        if not pos: raise Exception(f"Booking {booking} no encontrado")

        normalized_orden = self._normalize_orden(pos.ORDEN_BETA)
        pedidos = []
        if normalized_orden and len(normalized_orden) > 1 and normalized_orden.upper() != "PENDIENTE":
            query_pedidos = db.query(PedidoComercial).filter(
                PedidoComercial.orden_beta.ilike(f"%{normalized_orden}%")
            )
            if pos.CULTIVO and pos.CULTIVO.strip().upper() not in ["", "PENDIENTE", "N/A", "-"]:
                query_pedidos = query_pedidos.filter(PedidoComercial.cultivo.ilike(pos.CULTIVO))
            pedidos = query_pedidos.all()

        total_cajas = sum(p.total_cajas or 0 for p in pedidos)
        total_pallets = sum(p.total_pallets or 0 for p in pedidos)
        cliente_nombre = pedidos[0].cliente if pedidos else "POR DEFINIR"
        peso_kg = pedidos[0].peso_por_caja or Decimal("0") if pedidos else Decimal("0")
        
        # Formula de Peso Bruto Real (Neto + Taras): Pallet (30kg) + Caja (0.25kg)
        peso_neto = float(total_cajas) * float(peso_kg)
        peso_bruto = peso_neto + (float(total_pallets) * 30.0) + (float(total_cajas) * 0.25)

        # 2. Búsqueda de Maestro (Refactorizada)
        pais_val = pedidos[0].pais if pedidos else ""
        pod_val = pedidos[0].pod if pedidos else ""
        cliente_maestro = self._match_cliente_maestro(db, cliente_nombre, pais_val, pod_val)

        planta_maestro = db.query(Planta).filter(Planta.planta.ilike(pos.PLANTA_LLENADO)).first() if pos and pos.PLANTA_LLENADO else None

        # 3. Construcción PDF (ReportLab)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
        elements = []
        styles = getSampleStyleSheet()

        # Estilos compartidos
        normal_style = ParagraphStyle('N', fontSize=self.SIZE_BODY, leading=self.SIZE_BODY + 1)
        bold_style = ParagraphStyle('B', fontSize=self.SIZE_BODY, leading=self.SIZE_BODY + 1, fontName=self.FONT_BOLD)

        def b_p(text): return Paragraph(f"<b>{text}</b>", bold_style)
        def b_pc(text): return Paragraph(f"<b>{text}</b>", ParagraphStyle('BC', fontSize=self.SIZE_BODY, leading=8, fontName=self.FONT_BOLD, alignment=1))
        def n_p(text): return Paragraph(str(text), normal_style)
        def format_desc(t1, t2): return Paragraph(f"{t1}<br/>{t2}", normal_style)

        # Header con Logo Local
        try:
             from PIL import Image as PILImage
             current_dir = os.path.dirname(os.path.abspath(__file__))
             assets_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "assets"))
             
             def get_safe_image(path, w, h):
                 try:
                     if not os.path.exists(path): return None
                     with open(path, "rb") as f: data = f.read()
                     PILImage.open(io.BytesIO(data)).verify()
                     return Image(io.BytesIO(data), width=w, height=h)
                 except Exception: return None

             logo_obj = get_safe_image(os.path.join(assets_dir, "logo_beta.png"), 120, 45)
             
             header_row = []
             if logo_obj: header_row.append(logo_obj)
             
             cliente_txt = (cliente_maestro.consignatario_bl or cliente_maestro.nombre_legal) if cliente_maestro else cliente_nombre
             puerto_destino = pedidos[0].pod if pedidos and getattr(pedidos[0], 'pod', None) else (cliente_maestro.destino if cliente_maestro else "")
             pais_txt = cliente_maestro.pais if cliente_maestro else ''
             
             subtitle_parts = [p for p in [cliente_txt, puerto_destino, pais_txt] if p]
             subtitle_txt = " - ".join(subtitle_parts)
             
             titulo_html = f"INSTRUCCIONES DE EMBARQUE<br/>{subtitle_txt}<br/>{pos.CULTIVO or ''}"
             header_row.append(Paragraph(f"<b>{titulo_html}</b>", ParagraphStyle('Centered', fontSize=self.SIZE_HEADER, leading=10, alignment=1, fontName=self.FONT_BOLD)))

             if "GRANADA" in (pos.CULTIVO or "").upper():
                 granada_obj = get_safe_image(os.path.join(assets_dir, "image_granada.png"), 60, 60)
                 if granada_obj: header_row.append(granada_obj)
             
             if len(header_row) < 3:
                 header_row.append(Paragraph(f"<font size=7>FECHA: {datetime.now().strftime('%d/%m/%Y')}</font>", styles["Normal"]))
                 
             header_table = Table([header_row])
             header_table.setStyle(TableStyle([
                 ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                 ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                 ('LINEBELOW', (0,0), (-1,-1), 1, self.COLOR_BETA_GREEN)
             ]))
             elements.append(header_table)
        except Exception:
             elements.append(Paragraph(f"<b>INSTRUCCIONES DE EMBARQUE - BOOKING: {pos.BOOKING} | ORDEN: {pos.ORDEN_BETA}</b>", styles["Title"]))

        elements.append(Spacer(1, 12))

        # --- MASTER TABLE ---
        fito = cliente_maestro.fitosanitario if hasattr(cliente_maestro, 'fitosanitario') and cliente_maestro.fitosanitario else None
        
        cult_en = "POMEGRANATES" if "GRANADA" in (pos.CULTIVO or "").upper() else pos.CULTIVO
        cult_es = "GRANADAS" if "GRANADA" in (pos.CULTIVO or "").upper() else pos.CULTIVO
        variedad = pedidos[0].variedad if pedidos and hasattr(pedidos[0], 'variedad') else "WONDERFUL"
        
        desc_en = f"{total_cajas} BOXES WITH FRESH {cult_en} {variedad} ON {total_pallets} PALLETS"
        desc_es = f"{total_cajas} CAJAS CON FRESCA {cult_es} {variedad} EN {total_pallets} PALETAS"

        fecha_llenado = ""
        f_prog = getattr(pos, 'FECHA_PROGRAMADA', None)
        h_prog = getattr(pos, 'HORA_PROGRAMADA', None)
        f_str = f_prog.strftime('%d/%m/%Y') if f_prog else ""
        h_str = h_prog.strftime('%H:%M') if h_prog else ""
        fecha_llenado = f"{f_str} - {h_str}" if (f_str and h_str) else f"{f_str} {h_str}".strip()

        eta_dt = getattr(pos, 'ETA', None)
        eta_str = eta_dt.strftime('%d/%m/%Y') if eta_dt else ""
        puerto_destino = pedidos[0].pod if pedidos and getattr(pedidos[0], 'pod', None) else (cliente_maestro.destino if cliente_maestro else "")

        t1_data = [
            [b_p(pos.ORDEN_BETA or 'S/N'), b_p("")],
            [b_p("EMBARCADOR"), n_p("COMPLEJO AGROINDUSTRIAL BETA S.A.")],
            [b_p("DIRECCIÓN"), n_p("CAL. LEOPOLDO CARRILLO NRO. 160 ICA - CHINCHA - CHINCHA ALTA – PERU")],
            [b_p("OPERADOR LOGISTICO"), b_p(getattr(pos, 'OPERADOR_LOGISTICO', "DP WORLD LOGISTICS S.R.L."))],
            [b_p("DIRECCION DE LA PLANTA"), format_desc(f"<b>{planta_maestro.planta}</b>", planta_maestro.direccion) if planta_maestro else n_p(pos.PLANTA_LLENADO or "ICA CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU")],
            [b_p("UBIGEO PLANTA"), n_p(planta_maestro.ubigeo if planta_maestro else "110111")],
            [b_p("FECHA Y HORA DEL LLENADO"), b_pc(fecha_llenado)],
            [b_p("CONSIGNATARIO<br/>DIRECCIÓN"), format_desc(f"<b>{(cliente_maestro.consignatario_bl or cliente_maestro.nombre_legal) if cliente_maestro else cliente_nombre}</b>", cliente_maestro.direccion_consignatario if cliente_maestro else "")],
            [b_p("NOTIFICADO<br/>DIRECCIÓN"), format_desc(f"<b>{cliente_maestro.notify_bl if cliente_maestro else 'SAME AS CONSIGNEE'}</b>", cliente_maestro.direccion_notify if cliente_maestro else "")],
            [b_p("DATOS REFERENCIALES"), format_desc(
                f"EORI CONSIGNE: {cliente_maestro.eori_consignatario if cliente_maestro and getattr(cliente_maestro, 'eori_consignatario', None) else '----'}",
                f"EORI NOTIFY: {cliente_maestro.eori_notify if cliente_maestro and getattr(cliente_maestro, 'eori_notify', None) else '----'}"
            )],
            [b_p("DESCRIPCION EN EL B/L"), format_desc(desc_en, desc_es)],
            [b_p("AGENCIA NAVIERA"), n_p(pos.NAVIERA or "")],
            [b_p("MOTONAVE"), n_p(pos.NAVE or "")],
            [b_p("BOOKING No."), b_p(pos.BOOKING or "")],
            [b_p("FREIGHT"), n_p("PREPAID" if pedidos and "CIF" in (pedidos[0].incoterm or "").upper() else "COLLECT")],
            [b_p("EMISION B/L"), n_p("SWB")],
            [b_p("PUERTO EMBARQUE"), n_p(getattr(pos, 'POL', "CALLAO") or "CALLAO")],
            [b_p("ETA"), n_p(eta_str)],
            [b_p("PUERTO DESTINO"), n_p(puerto_destino)],
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
            [b_p("VALOR FOB APROXIMADO"), n_p("USD 34,560.00")],
        ]

        t2_data = [
            [Paragraph("<b>DATOS PARA CERTIFICADO FITOSANITARIO</b>", ParagraphStyle('Centered', fontSize=self.SIZE_FITO, leading=9, alignment=1, fontName=self.FONT_BOLD)), ""],
            [b_p("CONSIGNATARIO<br/>DIRECCIÓN"), format_desc(f"<b>{fito.consignatario_fito if fito else ''}</b>", fito.direccion_fito if fito else "")],
            [b_p("PAIS DE DESTINO"), b_p(pedidos[0].pais if pedidos else (cliente_maestro.pais if cliente_maestro else ""))],
            [b_p("PUNTO DE LLEGADA"), b_p(puerto_destino)],
            [b_p("PRESENTACION"), b_p(getattr(pedidos[0], 'presentacion', "CAJA 3.8 KG") if pedidos else "CAJA 3.8 KG")],
            [b_p("ETIQUETAS"), b_p("GENERICA")],
            [b_p("PESO NETO ESTIMADO"), b_p(f"{total_cajas * float(peso_kg if peso_kg else 3.8):,.3f} KG")],
            [b_p("PESO BRUTO ESTIMADO"), b_p(f"{peso_bruto:,.3f} KG")],
            [b_p("OBSERVACIONES"), n_p(observaciones or "SIN OBSERVACIONES ADICIONALES.")]
        ]

        # Estilo Tablas
        t1 = Table(t1_data, colWidths=[6.5*cm, 12.5*cm])
        t1.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (0,-1), self.COLOR_BG_GRAY),
            ('BACKGROUND', (0,3), (-1,3), self.COLOR_BETA_ORANGE),
            ('BACKGROUND', (0,6), (-1,6), self.COLOR_BETA_ORANGE),
            ('ALIGN', (1,6), (1,6), 'CENTER'),
            ('BACKGROUND', (0,28), (-1,29), self.COLOR_BETA_ORANGE),
        ]))
        elements.append(t1)
        elements.append(Spacer(1, 12))

        t2 = Table(t2_data, colWidths=[6.5*cm, 12.5*cm])
        t2.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (0,-1), self.COLOR_BG_GRAY),
            ('BACKGROUND', (0,0), (-1,0), self.COLOR_BETA_ORANGE),
            ('SPAN', (0,0), (1,0)),
            ('ALIGN', (0,0), (1,0), 'CENTER'),
        ]))
        elements.append(t2)

        # Build PDF
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return {"pdf_bytes": pdf_bytes, "orden_beta": pos.ORDEN_BETA}

instruction_pdf_service = InstructionPDFService()
