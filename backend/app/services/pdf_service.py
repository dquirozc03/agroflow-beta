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
from typing import Optional
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

    def generate_instruction_pdf(self, booking: str, db: Session, observaciones: str = "", override_data: Optional[dict] = None):
        # 1. Obtencion de datos (Modificado para soportar OVERRIDE de Admin 💎)
        if override_data:
            # Si hay override, usamos los datos inyectados manualmente
            pos_booking = override_data.get("booking")
            pos_orden = override_data.get("orden_beta")
            pos_cultivo = override_data.get("cultivo")
            pos_nave = override_data.get("motonave")
            pos_naviera = override_data.get("naviera")
            pos_operador = override_data.get("operador_logistico")
            pos_pol = override_data.get("puerto_embarque")
            
            # Datos de pesos y cantidades
            total_cajas = override_data.get("cajas", 0)
            total_pallets = override_data.get("pallets", 0)
            peso_neto_full = override_data.get("peso_neto", "0.000 KG")
            peso_bruto_full = override_data.get("peso_bruto", "0.000 KG")
            
            cliente_nombre = override_data.get("cliente_nombre")
            puerto_destino = override_data.get("puerto_destino")
            eta_str = override_data.get("eta")
            variedad = override_data.get("variedad")
            
            # Descripción BL
            desc_en = f"{total_cajas} BOXES WITH FRESH {pos_cultivo} {variedad} ON {total_pallets} PALLETS"
            desc_es = f"{total_cajas} CAJAS CON FRESCA {pos_cultivo} {variedad} EN {total_pallets} PALETAS"
            
            # Planta y Fecha Llenado Manual
            planta_nombre = override_data.get("planta_llenado", "PLANTA BETA")
            planta_direccion = override_data.get("direccion_planta", "")
            fecha_llenado = override_data.get("fecha_llenado", "")
            
            # Observaciones
            observaciones_final = override_data.get("observaciones", "SIN OBSERVACIONES ADICIONALES.")
            fob_val = override_data.get("fob", "USD 0.00")
            
        else:
            # Lógica automática original (Booking -> DB)
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
            p_bruto = peso_neto + (float(total_pallets) * 30.0) + (float(total_cajas) * 0.25)
            peso_neto_full = f"{peso_neto:,.3f} KG"
            peso_bruto_full = f"{p_bruto:,.3f} KG"

            # Búsqueda de Maestro
            pais_val = pedidos[0].pais if pedidos else ""
            pod_val = pedidos[0].pod if pedidos else ""
            cliente_maestro = self._match_cliente_maestro(db, cliente_nombre, pais_val, pod_val)

            planta_maestro = db.query(Planta).filter(Planta.planta.ilike(pos.PLANTA_LLENADO)).first() if pos and pos.PLANTA_LLENADO else None
            planta_nombre = planta_maestro.planta if planta_maestro else (pos.PLANTA_LLENADO or "ICA CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU")
            planta_direccion = planta_maestro.direccion if planta_maestro else ""
            
            # Datos de Posicionamiento
            pos_booking = pos.BOOKING
            pos_orden = pos.ORDEN_BETA
            pos_cultivo = pos.CULTIVO
            pos_nave = pos.NAVE
            pos_naviera = pos.NAVIERA
            pos_operador = getattr(pos, 'OPERADOR_LOGISTICO', "DP WORLD LOGISTICS S.R.L.")
            pos_pol = getattr(pos, 'POL', "CALLAO") or "CALLAO"
            
            f_prog = getattr(pos, 'FECHA_PROGRAMADA', None)
            h_prog = getattr(pos, 'HORA_PROGRAMADA', None)
            f_str = f_prog.strftime('%d/%m/%Y') if f_prog else ""
            h_str = h_prog.strftime('%H:%M') if h_prog else ""
            fecha_llenado = f"{f_str} - {h_str}" if (f_str and h_str) else f"{f_str} {h_str}".strip()

            eta_dt = getattr(pos, 'ETA', None)
            eta_str = eta_dt.strftime('%d/%m/%Y') if eta_dt else ""
            puerto_destino = pedidos[0].pod if pedidos and getattr(pedidos[0], 'pod', None) else (cliente_maestro.destino if cliente_maestro else "")
            
            variedad = pedidos[0].variedad if pedidos and hasattr(pedidos[0], 'variedad') else "WONDERFUL"
            desc_en = f"{total_cajas} BOXES WITH FRESH {pos_cultivo} {variedad} ON {total_pallets} PALLETS"
            desc_es = f"{total_cajas} CAJAS CON FRESCA {pos_cultivo} {variedad} EN {total_pallets} PALETAS"
            
            observaciones_final = observaciones or "SIN OBSERVACIONES ADICIONALES."
            fob_val = "USD 34,560.00"

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
             
             # Selección de Títulos (Override o Calculado)
             if override_data:
                 cliente_txt = override_data.get("consignatario_bl")
                 puerto_txt = override_data.get("puerto_destino")
                 pais_txt = override_data.get("pais_destino")
             else:
                 cliente_txt = (cliente_maestro.consignatario_bl or cliente_maestro.nombre_legal) if cliente_maestro else cliente_nombre
                 puerto_txt = puerto_destino
                 pais_txt = cliente_maestro.pais if cliente_maestro else ''
             
             subtitle_parts = [p for p in [cliente_txt, puerto_txt, pais_txt] if p]
             subtitle_txt = " - ".join(subtitle_parts)
             
             titulo_html = f"INSTRUCCIONES DE EMBARQUE<br/>{subtitle_txt}<br/>{pos_cultivo or ''}"
             header_row.append(Paragraph(f"<b>{titulo_html}</b>", ParagraphStyle('Centered', fontSize=self.SIZE_HEADER, leading=10, alignment=1, fontName=self.FONT_BOLD)))

             if "GRANADA" in (pos_cultivo or "").upper():
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
             elements.append(Paragraph(f"<b>INSTRUCCIONES DE EMBARQUE - BOOKING: {pos_booking} | ORDEN: {pos_orden}</b>", styles["Title"]))

        elements.append(Spacer(1, 12))

        # --- MASTER TABLE ---
        t1_data = [
            [b_p(pos_orden or 'S/N'), b_p("")],
            [b_p("EMBARCADOR"), n_p("COMPLEJO AGROINDUSTRIAL BETA S.A.")],
            [b_p("DIRECCIÓN"), n_p("CAL. LEOPOLDO CARRILLO NRO. 160 ICA - CHINCHA - CHINCHA ALTA – PERU")],
            [b_p("OPERADOR LOGISTICO"), b_p(pos_operador)],
            [b_p("DIRECCION DE LA PLANTA"), format_desc(f"<b>{planta_nombre}</b>", planta_direccion)],
            [b_p("UBIGEO PLANTA"), n_p("110111")],
            [b_p("FECHA Y HORA DEL LLENADO"), b_pc(fecha_llenado)],
            [b_p("CONSIGNATARIO<br/>DIRECCIÓN"), format_desc(f"<b>{override_data.get('consignatario_bl') if override_data else ( (cliente_maestro.consignatario_bl or cliente_maestro.nombre_legal) if cliente_maestro else cliente_nombre )}</b>", override_data.get('direccion_consignatario', '') if override_data else (cliente_maestro.direccion_consignatario if cliente_maestro else ""))],
            [b_p("NOTIFICADO<br/>DIRECCIÓN"), format_desc(f"<b>{override_data.get('notify_bl') if override_data else (cliente_maestro.notify_bl if cliente_maestro else 'SAME AS CONSIGNEE')}</b>", override_data.get('direccion_notify', '') if override_data else (cliente_maestro.direccion_notify if cliente_maestro else ""))],
            [b_p("DATOS REFERENCIALES"), format_desc(
                f"EORI CONSIGNE: {override_data.get('eori_consignatario', '----') if override_data else (cliente_maestro.eori_consignatario if cliente_maestro and getattr(cliente_maestro, 'eori_consignatario', None) else '----')}",
                f"EORI NOTIFY: {override_data.get('eori_notify', '----') if override_data else (cliente_maestro.eori_notify if cliente_maestro and getattr(cliente_maestro, 'eori_notify', None) else '----')}"
            )],
            [b_p("DESCRIPCION EN EL B/L"), format_desc(desc_en, desc_es)],
            [b_p("AGENCIA NAVIERA"), n_p(pos_naviera or "")],
            [b_p("MOTONAVE"), n_p(pos_nave or "")],
            [b_p("BOOKING No."), b_p(pos_booking or "")],
            [b_p("FREIGHT"), n_p(override_data.get('fob', 'PREPAID') if override_data else ("PREPAID" if pedidos and "CIF" in (pedidos[0].incoterm or "").upper() else "COLLECT"))],
            [b_p("EMISION B/L"), n_p("SWB")],
            [b_p("PUERTO EMBARQUE"), n_p(pos_pol)],
            [b_p("ETA"), n_p(eta_str)],
            [b_p("PUERTO DESTINO"), n_p(puerto_destino)],
            [b_p("CANTIDAD DE CONTENEDORES"), n_p("01")],
            [b_p("PRODUCTO"), n_p(pos_cultivo or "GRANADAS")],
            [b_p("VARIEDAD"), n_p(variedad)],
            [b_p("TEMPERATURA"), n_p(override_data.get('temperatura', '6.0°C') if override_data else ("6.0°C" if "GRANADA" in (pos_cultivo or "").upper() else ""))],
            [b_p("VENTILACION"), n_p(override_data.get('ventilacion', '15CBM') if override_data else ("15CBM" if "GRANADA" in (pos_cultivo or "").upper() else ""))],
            [b_p("HUMEDAD"), n_p(override_data.get('humedad', 'OFF') if override_data else ("OFF" if "GRANADA" in (pos_cultivo or "").upper() else ""))],
            [b_p("ATMOSFERA CONTROLADA"), n_p(override_data.get('atm', 'NO APLICA') if override_data else ("NO APLICA" if "GRANADA" in (pos_cultivo or "").upper() else ""))],
            [b_p("OXIGENO"), n_p(override_data.get('oxigeno', 'NO APLICA') if override_data else ("NO APLICA" if "GRANADA" in (pos_cultivo or "").upper() else ""))],
            [b_p("CO2"), n_p(override_data.get('co2', 'NO APLICA') if override_data else ("NO APLICA" if "GRANADA" in (pos_cultivo or "").upper() else ""))],
            [b_p("FILTROS"), b_p(override_data.get('filtros', 'NO') if override_data else "NO")],
            [b_p("COLD TREAMENT"), b_p(override_data.get('cold_treatment', 'NO') if override_data else "NO")],
            [b_p("CANTIDAD"), n_p(f"{total_cajas} CAJAS APROX.")],
            [b_p("VALOR FOB APROXIMADO"), n_p(fob_val)],
        ]

        t2_data = [
            [Paragraph("<b>DATOS PARA CERTIFICADO FITOSANITARIO</b>", ParagraphStyle('Centered', fontSize=self.SIZE_FITO, leading=9, alignment=1, fontName=self.FONT_BOLD)), ""],
            [b_p("CONSIGNATARIO<br/>DIRECCIÓN"), format_desc(f"<b>{(override_data.get('consignatario_fito') if override_data else (fito.consignatario_fito if fito else ''))}</b>", (override_data.get('direccion_fito', '') if override_data else (fito.direccion_fito if fito else "")))],
            [b_p("PAIS DE DESTINO"), b_p(override_data.get('pais_destino') if override_data else (pedidos[0].pais if pedidos else (cliente_maestro.pais if cliente_maestro else "")))],
            [b_p("PUNTO DE LLEGADA"), b_p(puerto_destino)],
            [b_p("PRESENTACION"), b_p(override_data.get('presentacion') if override_data else (getattr(pedidos[0], 'presentacion', "CAJA 3.8 KG") if pedidos else "CAJA 3.8 KG"))],
            [b_p("ETIQUETAS"), b_p(override_data.get('etiquetas', 'GENERICA') if override_data else "GENERICA")],
            [b_p("PESO NETO ESTIMADO"), b_p(peso_neto_full)],
            [b_p("PESO BRUTO ESTIMADO"), b_p(peso_bruto_full)],
            [b_p("OBSERVACIONES"), n_p(observaciones_final)]
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
