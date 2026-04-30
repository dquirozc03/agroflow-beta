from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, Flowable
import io
import os
import re
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from typing import Optional, Any
from app.utils.formatters import normalize_client_name, normalize_country_name
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.maestros import ClienteIE, Planta

class FloatingImage(Flowable):
    def __init__(self, path, width, height, dx=0, dy=0):
        Flowable.__init__(self)
        self.path = path
        self.width = width
        self.height = height
        self.dx = dx
        self.dy = dy
    def wrap(self, availWidth, availHeight):
        return 0, 0
    def draw(self):
        self.canv.drawImage(self.path, self.dx, self.dy, self.width, self.height, mask='auto')

class InstructionPDFService:
    # --- Constantes de Diseño (Westfalia V2 Style) ---
    COLOR_BETA_GREEN = colors.HexColor("#7CC546")
    COLOR_BETA_ORANGE = colors.HexColor("#F5A623")
    COLOR_BG_GRAY = colors.HexColor("#F3F4F6")

    # Paletas por Cultivo
    PALETTES = {
        "PALTA": {
            "primary": colors.HexColor("#2E7D32"),   # Verde Aguacate
            "secondary": colors.HexColor("#8BC34A"), # Verde Hoja
            "bg": colors.HexColor("#F2F6E9"),        # Crema Natural
            "text_accent": colors.HexColor("#263238") # Gris Oscuro
        },
        "GRANADA": {
            "primary": colors.HexColor("#A81D26"),   # Rojo Granada Vibrante
            "secondary": colors.HexColor("#7B1E28"), # Rojo Granada Principal
            "bg": colors.HexColor("#F5F1ED"),        # Crema Claro Fondo
            "text_accent": colors.HexColor("#2F5D3A") # Verde Hoja Acento
        },
        "DEFAULT": {
            "primary": colors.HexColor("#7CC546"),
            "secondary": colors.HexColor("#F5A623"),
            "bg": colors.HexColor("#F3F4F6"),
            "text_accent": colors.HexColor("#7CC546")
        }
    }
    
    FONT_NORMAL = 'Helvetica'
    FONT_BOLD = 'Helvetica-Bold'
    SIZE_HEADER = 9
    SIZE_BODY = 7
    SIZE_FITO = 8

    def _normalize_orden(self, raw_orden: str) -> str:
        if not raw_orden: return ""
        match = re.search(r'\d+', raw_orden)
        return match.group(0) if match else raw_orden

    def _match_cliente_maestro(self, db: Session, cliente_nombre: str, pais: str, pod: str, cultivo: str = "") -> Optional[ClienteIE]:
        from sqlalchemy import func
        
        pais_val = normalize_country_name(pais)
        pod_val = pod.strip() if pod else ""
        cliente_clean_val = cliente_nombre.strip()
        cultivo_val = cultivo.strip() if cultivo else ""

        # 1. Match Exacto (Nombre + Pais + POD + Cultivo)
        query = db.query(ClienteIE).filter(
            func.trim(ClienteIE.nombre_legal).ilike(cliente_clean_val),
            func.trim(ClienteIE.pais).ilike(pais_val)
        )
        if pod_val: query = query.filter(func.trim(ClienteIE.destino).ilike(pod_val))
        if cultivo_val: query = query.filter(func.trim(ClienteIE.cultivo).ilike(cultivo_val))
        cliente = query.first()

        # 2. Match Semiexacto (Nombre + Pais + Cultivo)
        if not cliente:
            query2 = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(cliente_clean_val),
                func.trim(ClienteIE.pais).ilike(pais_val)
            )
            if cultivo_val: query2 = query2.filter(func.trim(ClienteIE.cultivo).ilike(cultivo_val))
            cliente = query2.first()

        # 3. Fallback (Nombre + Pais)
        if not cliente:
            cliente = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(cliente_clean_val),
                func.trim(ClienteIE.pais).ilike(pais_val)
            ).first()

        # 4. Fallback (Solo Nombre Legal)
        if not cliente:
            cliente = db.query(ClienteIE).filter(
                func.trim(ClienteIE.nombre_legal).ilike(cliente_clean_val)
            ).first()

        # 5. Smart Match (Fuzzy / Normalizado)
        if not cliente:
            clean_name = normalize_client_name(cliente_nombre)
            cliente = db.query(ClienteIE).filter(
                (func.trim(ClienteIE.nombre_legal).ilike(f"%{clean_name}%")) | 
                (func.upper(clean_name).like(func.concat('%', func.trim(ClienteIE.nombre_legal), '%'))),
                func.trim(ClienteIE.pais).ilike(pais_val),
                ClienteIE.estado == "ACTIVO"
            ).first()

            if not cliente:
                cliente = db.query(ClienteIE).filter(
                    (func.trim(ClienteIE.nombre_legal).ilike(f"%{clean_name}%")) | 
                    (func.upper(clean_name).like(func.concat('%', func.trim(ClienteIE.nombre_legal), '%'))),
                    ClienteIE.estado == "ACTIVO"
                ).first()
        
        return cliente

    def _clean_text(self, text: str) -> str:
        if not text: return ""
        return str(text).replace(";", "").strip()

    def _format_multiline(self, text: str) -> str:
        if not text: return ""
        return text.replace('\n', '<br/>')

    def generate_instruction_pdf(self, booking: str, db: Session, observaciones: str = "", override_data: Optional[dict] = None, emision_bl: str = "SWB"):
        if override_data:
            # Override Data Transformation
            override_data['direccion_notify'] = self._format_multiline(override_data.get('direccion_notify', ''))
            override_data['consignatario_fito'] = self._format_multiline(override_data.get('consignatario_fito', ''))
            override_data['direccion_fito'] = self._format_multiline(override_data.get('direccion_fito', ''))
            override_data['observaciones'] = self._format_multiline(override_data.get('observaciones', '...'))
            override_data['direccion_consignatario'] = self._format_multiline(override_data.get('direccion_consignatario', ''))
            override_data['notify_bl'] = self._format_multiline(override_data.get('notify_bl', ''))
            
            pos_booking = override_data.get("booking")
            pos_orden = override_data.get("orden_beta")
            pos_cultivo = override_data.get("cultivo")
            pos_nave = override_data.get("motonave")
            pos_naviera = override_data.get("naviera")
            pos_operador = override_data.get("operador_logistico")
            pos_pol = override_data.get("puerto_embarque")
            
            total_cajas = override_data.get("cajas", 0)
            total_pallets = override_data.get("pallets", 0)
            peso_neto_full = override_data.get("peso_neto", "0.000 KG")
            peso_bruto_full = override_data.get("peso_bruto", "0.000 KG")
            
            embarcador_nombre = override_data.get("embarcador", "COMPLEJO AGROINDUSTRIAL BETA S.A.")
            embarcador_direccion = override_data.get("direccion_embarcador", "CAL. LEOPOLDO CARRILLO NRO. 160 ICA - CHINCHA - CHINCHA ALTA \u2013 PERU")
            
            cliente_nombre = override_data.get("cliente_nombre")
            puerto_destino = override_data.get("puerto_destino")
            eta_str = override_data.get("eta")
            variedad = override_data.get("variedad")
            flete_val = override_data.get("freight", "PREPAID")
            
            desc_en = override_data.get("desc_en") or f"{total_cajas} BOXES WITH FRESH {pos_cultivo} {variedad} ON {total_pallets} PALLETS"
            desc_es = override_data.get("desc_es") or f"{total_cajas} CAJAS CON FRESCA {pos_cultivo} {variedad} EN {total_pallets} PALETAS"
            
            planta_nombre = override_data.get("planta_llenado", "PLANTA BETA").upper()
            planta_direccion = override_data.get("direccion_planta", "")
            planta_region = override_data.get("region_planta", "")
            planta_ubigeo = override_data.get("ubigeo_planta", "110111")
            fecha_llenado = override_data.get("fecha_llenado", "")
            
            observaciones_final = override_data.get("observaciones", "SIN OBSERVACIONES ADICIONALES.")
            fob_val = override_data.get("fob", "USD 0.00")
            po_val = override_data.get("po", "")
            eori_consignee = override_data.get("eori_consignatario", "----")
            eori_notify = override_data.get("eori_notify", "----")
            
            temperatura = override_data.get('temperatura', '6.0\u00b0C')
            ventilacion = override_data.get('ventilacion', '15CBM')
            humedad = override_data.get('humedad', 'OFF')
            atm = override_data.get('atm', 'NO APLICA')
            oxigeno = override_data.get('oxigeno', 'NO APLICA')
            co2 = override_data.get('co2', 'NO APLICA')
            filtros = override_data.get('filtros', 'NO')
            cold_treatment = override_data.get('cold_treatment', 'NO')
            
        else:
            pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
            if not pos: raise Exception(f"Booking {booking} no encontrado")

            normalized_orden = self._normalize_orden(pos.ORDEN_BETA)
            pedidos = []
            if normalized_orden and len(normalized_orden) > 1 and normalized_orden.upper() != "PENDIENTE":
                query_pedidos = db.query(PedidoComercial).filter(
                    PedidoComercial.orden_beta.ilike(f"%{normalized_orden}%")
                )
                if pos.cultivo and pos.cultivo.strip().upper() not in ["", "PENDIENTE", "N/A", "-"]:
                    query_pedidos = query_pedidos.filter(PedidoComercial.cultivo.ilike(pos.cultivo))
                pedidos = query_pedidos.all()

            total_cajas = sum(p.total_cajas or 0 for p in pedidos)
            total_pallets = sum(p.total_pallets or 0 for p in pedidos)
            cliente_nombre = self._clean_text(pedidos[0].cliente) if pedidos else "POR DEFINIR"
            peso_kg = pedidos[0].peso_por_caja or Decimal("0") if pedidos else Decimal("0")
            
            peso_neto = float(total_cajas) * float(peso_kg)
            p_bruto = peso_neto + (float(total_pallets) * 30.0) + (float(total_cajas) * 0.25)
            peso_neto_full = f"{peso_neto:,.3f} KG"
            peso_bruto_full = f"{p_bruto:,.3f} KG"

            pais_val = pedidos[0].pais if pedidos else ""
            pod_val = pedidos[0].pod if pedidos else ""
            
            cliente_buscar = cliente_nombre
            if cliente_nombre and "OGL" in cliente_nombre.upper() and pos.CULTIVO and "PALTA" in pos.CULTIVO.upper():
                p_k = float(pedidos[0].peso_por_caja) if pedidos and getattr(pedidos[0], 'peso_por_caja', None) else 0
                if p_k >= 10: cliente_buscar = "OGL 10KG"
                elif p_k > 0: cliente_buscar = "OGL 4KG"

            cliente_maestro = self._match_cliente_maestro(db, cliente_buscar, pais_val, pod_val, pos.CULTIVO)
            fito = cliente_maestro.fitosanitario if cliente_maestro else None

            planta_maestro = db.query(Planta).filter(Planta.planta.ilike(pos.PLANTA_LLENADO)).first() if pos and pos.PLANTA_LLENADO else None
            planta_nombre = (planta_maestro.planta if planta_maestro else (pos.PLANTA_LLENADO or "ICA CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU")).upper()
            planta_direccion = planta_maestro.direccion if planta_maestro else ""
            planta_region = f"{planta_maestro.distrito} - {planta_maestro.provincia} - {planta_maestro.departamento} - PERU".upper() if (planta_maestro and planta_maestro.distrito) else ""
            planta_ubigeo = planta_maestro.ubigeo if planta_maestro else "110111"
            
            pos_booking = pos.BOOKING or ""
            pos_orden = pos.ORDEN_BETA or ""
            pos_cultivo = pos.CULTIVO or ""
            pos_nave = pos.NAVE or ""
            pos_naviera = pos.NAVIERA or ""
            pos_operador = pos.OPERADOR_LOGISTICO or "DP WORLD LOGISTICS S.R.L."
            pos_pol = pos.POL or "CALLAO"
            
            f_prog = pos.FECHA_LLENADO_REPORTE or pos.FECHA_PROGRAMADA
            h_prog = pos.HORA_LLENADO_REPORTE or pos.HORA_PROGRAMADA
            f_str = f_prog.strftime('%d/%m/%Y') if f_prog else ""
            h_str = h_prog.strftime('%H:%M') if h_prog else ""
            fecha_llenado = f"{f_str} - {h_str}" if (f_str and h_str) else (f_str or h_str or "")

            eta_str = pos.ETA.strftime('%d/%m/%Y') if pos.ETA else ""
            puerto_destino = pos.DESTINO_BOOKING or (pedidos[0].pod if pedidos and getattr(pedidos[0], 'pod', None) else (cliente_maestro.destino if cliente_maestro else ""))
            
            variedad = pedidos[0].variedad if pedidos and hasattr(pedidos[0], 'variedad') else "WONDERFUL"
            desc_en = f"{total_cajas} BOXES WITH FRESH {pos_cultivo} {variedad} ON {total_pallets} PALLETS"
            desc_es = f"{total_cajas} CAJAS CON FRESCA {pos_cultivo} {variedad} EN {total_pallets} PALETAS"
            
            observaciones_final = observaciones or "SIN OBSERVACIONES ADICIONALES."
            fob_val = "USD 34,560.00"
            flete_val = "PREPAID" if pedidos and "CIF" in (pedidos[0].incoterm or "").upper() else "COLLECT"
            eori_consignee = cliente_maestro.eori_consignatario if cliente_maestro and getattr(cliente_maestro, 'eori_consignatario', None) else "----"
            eori_notify = cliente_maestro.eori_notify if cliente_maestro and getattr(cliente_maestro, 'eori_notify', None) else "----"
            
            embarcador_nombre = "COMPLEJO AGROINDUSTRIAL BETA S.A."
            embarcador_direccion = "CAL. LEOPOLDO CARRILLO NRO. 160 ICA - CHINCHA - CHINCHA ALTA \u2013 PERU"

            po_val = ""
            if pedidos:
                for p in pedidos:
                    if p.po and p.po.strip():
                        po_val = p.po.strip()
                        break
                        
            cultivo_upper = (pos_cultivo or "").upper()
            is_palta = "PALTA" in cultivo_upper or "AVOCADO" in cultivo_upper
            is_granada = "GRANADA" in cultivo_upper
            
            def_temp = "6.0\u00b0C" if (is_palta or is_granada) else ""
            def_vent = "CERRADA" if is_palta else ("15CBM" if is_granada else "")
            def_hum = "OFF" if (is_palta or is_granada) else ""
            def_ac = "SI" if is_palta else "NO APLICA"
            
            temperatura = pos.TEMPERATURA or def_temp
            ventilacion = pos.VENTILACION or def_vent
            humedad = pos.HUMEDAD or def_hum
            atm = pos.AC or def_ac
            
            tecnologia = (pos.TIPO_TECNOLOGIA or "").upper()
            oxigeno = "NO APLICA" 
            co2 = "NO APLICA" 
            if is_palta:
                if "LIVENTUS" in tecnologia:
                    oxigeno, co2 = "12%", "8%"
                else:
                    oxigeno, co2 = "4%", "6%"
                
            filtros = pos.FILTROS or ("NO" if is_granada else ("SI" if is_palta else "NO"))
            cold_treatment = pos.CT or "NO"

            if is_palta and "TESCO" in (cliente_nombre or "").upper():
                filtros = "NO (SIN FILTROS)"

        cultivo_key = (pos_cultivo or "").upper()
        if "PALTA" in cultivo_key or "AVOCADO" in cultivo_key: palette = self.PALETTES["PALTA"]
        elif "GRANADA" in cultivo_key or "POMEGRANATE" in cultivo_key: palette = self.PALETTES["GRANADA"]
        else: palette = self.PALETTES["DEFAULT"]

        primary_color, secondary_color, bg_color = palette["primary"], palette["secondary"], palette["bg"]

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
        elements = []
        styles = getSampleStyleSheet()

        normal_style = ParagraphStyle('N', fontSize=self.SIZE_BODY, leading=self.SIZE_BODY + 1)
        bold_style = ParagraphStyle('B', fontSize=self.SIZE_BODY, leading=self.SIZE_BODY + 1, fontName=self.FONT_BOLD)
        white_bold_style = ParagraphStyle('WB', fontSize=self.SIZE_BODY, leading=self.SIZE_BODY + 1, fontName=self.FONT_BOLD, textColor=colors.white)
        white_normal_style = ParagraphStyle('WN', fontSize=self.SIZE_BODY, leading=self.SIZE_BODY + 1, fontName=self.FONT_NORMAL, textColor=colors.white)

        from xml.sax.saxutils import escape as xml_escape
        def _safe(text):
            if text is None: return ""
            res = xml_escape(str(text))
            return res.replace('\n', '<br/>').replace('&lt;br/&gt;', '<br/>').replace('&lt;br&gt;', '<br/>').replace('&lt;br /&gt;', '<br/>')

        def b_p(text, white=False): return Paragraph(f"<b>{_safe(text)}</b>", white_bold_style if white else bold_style)
        def b_pc(text, white=False): return Paragraph(f"<b>{_safe(text)}</b>", ParagraphStyle('BC', fontSize=self.SIZE_BODY, leading=8, fontName=self.FONT_BOLD, alignment=1, textColor=colors.white if white else colors.black))
        def n_p(text, white=False): return Paragraph(_safe(text), white_normal_style if white else normal_style)
        def format_desc(t1, t2, white=False): return Paragraph(f"{t1}<br/>{_safe(t2)}", white_normal_style if white else normal_style)

        # Header
        current_dir = os.path.dirname(os.path.abspath(__file__))
        assets_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "assets"))
        logo_path = os.path.join(assets_dir, "logo_beta.png")
        header_row = []
        if os.path.exists(logo_path): header_row.append(Image(logo_path, width=120, height=45))
        
        c_txt = override_data.get("consignatario_bl") if override_data else ((cliente_maestro.consignatario_bl or cliente_maestro.nombre_legal) if cliente_maestro else cliente_nombre)
        p_txt = puerto_destino
        pa_txt = override_data.get("pais_destino") if override_data else (cliente_maestro.pais if cliente_maestro else '')
        subtitle_txt = " - ".join([p for p in [c_txt, p_txt, pa_txt] if p])
        titulo_html = f"INSTRUCCIONES DE EMBARQUE<br/>{subtitle_txt}<br/>{pos_cultivo or ''}"
        header_row.append(Paragraph(f"<b>{titulo_html}</b>", ParagraphStyle('Centered', fontSize=self.SIZE_HEADER, leading=13, alignment=1, fontName=self.FONT_BOLD)))

        if "GRANADA" in cultivo_key:
            g_path = os.path.join(assets_dir, "image_granada.png")
            if os.path.exists(g_path): header_row.append(FloatingImage(g_path, 90, 90, dx=-20, dy=-25))
        elif "PALTA" in cultivo_key or "AVOCADO" in cultivo_key:
            pa_path = os.path.join(assets_dir, "image_palta.png")
            if os.path.exists(pa_path): header_row.append(FloatingImage(pa_path, 100, 100, dx=-25, dy=-35))
        
        if len(header_row) < 3: header_row.append(Paragraph(f"<font size=7>FECHA: {datetime.now().strftime('%d/%m/%Y')}</font>", styles["Normal"]))
        header_table = Table([header_row])
        header_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('LINEBELOW', (0,0), (-1,-1), 1, primary_color)]))
        elements.append(header_table)
        elements.append(Spacer(1, 12))

        # Master Table
        is_gr = "GRANADA" in cultivo_key
        t1_data = [
            [b_p(pos_orden or 'S/N'), b_p("")],
            [b_p("EMBARCADOR"), n_p(embarcador_nombre)],
            [b_p("DIRECCI\u00d3N"), n_p(embarcador_direccion)],
            [b_p("OPERADOR LOGISTICO", white=is_gr), b_p(pos_operador, white=is_gr)],
            [b_p("DIRECCION DE LA PLANTA"), format_desc(f"<b>{_safe(planta_nombre)}</b>", f"{planta_direccion}<br/>{planta_region}" if planta_region else planta_direccion)],
            [b_p("UBIGEO PLANTA"), n_p(planta_ubigeo)],
            [b_p("FECHA Y HORA DEL LLENADO", white=is_gr), b_pc(fecha_llenado, white=is_gr)],
            [b_p("CONSIGNATARIO<br/>DIRECCI\u00d3N"), format_desc(f"<b>{_safe(override_data.get('consignatario_bl') if override_data else self._clean_text((cliente_maestro.consignatario_bl or cliente_maestro.nombre_legal) if cliente_maestro else cliente_nombre))}</b>", override_data.get('direccion_consignatario', '') if override_data else self._format_multiline(self._clean_text(cliente_maestro.direccion_consignatario) if cliente_maestro else ""))],
            [b_p("NOTIFICADO<br/>DIRECCI\u00d3N"), format_desc(f"<b>{_safe(override_data.get('notify_bl') if override_data else self._clean_text(cliente_maestro.notify_bl if cliente_maestro else 'SAME AS CONSIGNEE'))}</b>", override_data.get('direccion_notify', '') if override_data else self._format_multiline(self._clean_text(cliente_maestro.direccion_notify) if cliente_maestro else ""))]
        ]
        if (eori_consignee and eori_consignee != "----") or (eori_notify and eori_notify != "----"):
            t1_data.append([b_p("DATOS REFERENCIALES"), format_desc(f"EORI CONSIGNE: {eori_consignee}", f"EORI NOTIFY: {eori_notify}")])
        t1_data.extend([[b_p("DESCRIPCION EN EL B/L"), format_desc(desc_en, desc_es)], [b_p("AGENCIA NAVIERA"), n_p(pos_naviera or "")], [b_p("MOTONAVE"), n_p(pos_nave or "")], [b_p("BOOKING No."), b_p(pos_booking or "")], [b_p("FREIGHT"), n_p(flete_val)]])
        if po_val and po_val.strip() and po_val.strip() != "0": t1_data.append([b_p("PO"), b_p(po_val.strip())])
        t1_data.extend([[b_p("EMISION B/L"), n_p(emision_bl)], [b_p("PUERTO EMBARQUE"), n_p(pos_pol)], [b_p("ETA"), n_p(eta_str)], [b_p("PUERTO DESTINO"), n_p(puerto_destino)], [b_p("CANTIDAD DE CONTENEDORES"), n_p("01")], [b_p("PRODUCTO"), n_p(pos_cultivo or "GRANADAS")], [b_p("VARIEDAD"), n_p(variedad)], [b_p("TEMPERATURA"), n_p(temperatura)], [b_p("VENTILACION"), n_p(ventilacion)], [b_p("HUMEDAD"), n_p(humedad)], [b_p("ATMOSFERA CONTROLADA"), n_p(atm)], [b_p("OXIGENO"), n_p(oxigeno)], [b_p("CO2"), n_p(co2)]])
        if not ("PALTA" in cultivo_key or "AVOCADO" in cultivo_key): t1_data.append([b_p("FILTROS"), b_p(filtros)])
        t1_data.extend([[b_p("COLD TREAMENT"), b_p(cold_treatment)], [b_p("CANTIDAD"), n_p(f"{total_cajas} CAJAS APROX.")], [b_p("VALOR FOB APROXIMADO"), n_p(fob_val)]])

        t2_data = [
            [Paragraph("<b>DATOS PARA CERTIFICADO FITOSANITARIO</b>", ParagraphStyle('Centered', fontSize=self.SIZE_FITO, leading=9, alignment=1, fontName=self.FONT_BOLD, textColor=colors.white if is_gr else colors.black)), ""],
            [b_p("CONSIGNATARIO<br/>DIRECCI\u00d3N"), format_desc(f"<b>{_safe(override_data.get('consignatario_fito') if override_data else (fito.consignatario_fito if fito else ''))}</b>", (override_data.get('direccion_fito', '') if override_data else self._format_multiline(fito.direccion_fito if fito else "")))],
            [b_p("PAIS DE DESTINO"), b_p(override_data.get('pais_destino') if override_data else (pedidos[0].pais if pedidos else (cliente_maestro.pais if cliente_maestro else "")))],
            [b_p("PUNTO DE LLEGADA"), b_p(puerto_destino)]
        ]
        pres_val = override_data.get('presentacion') if override_data else getattr(pedidos[0], 'presentacion', None) if pedidos else None
        if not pres_val or str(pres_val).strip() == "0": pres_val = f"CAJA {float(peso_kg):g} KG" if (peso_kg and float(peso_kg) > 0) else ("CAJA 4.0 KG" if "PALTA" in cultivo_key else "CAJA 3.8 KG")
        t2_data.extend([[b_p("PRESENTACION"), b_p(pres_val)], [b_p("ETIQUETAS"), b_p(override_data.get('etiquetas') if override_data else (pos.ETIQUETA_CAJA or "GENERICA"))], [b_p("PESO NETO ESTIMADO"), b_p(peso_neto_full)], [b_p("PESO BRUTO ESTIMADO"), b_p(peso_bruto_full)], [b_p("OBSERVACIONES"), n_p(observaciones_final)]])

        t1_styles = [('GRID', (0,0), (-1,-1), 0.5, colors.black), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('BACKGROUND', (0,0), (0,-1), bg_color), ('BACKGROUND', (0,3), (-1,3), secondary_color), ('BACKGROUND', (0,6), (-1,6), secondary_color), ('ALIGN', (1,6), (1,6), 'CENTER')]
        if is_gr: t1_styles.extend([('TEXTCOLOR', (0,3), (-1,3), colors.white), ('TEXTCOLOR', (0,6), (-1,6), colors.white)])
        
        t1 = Table(t1_data, colWidths=[6.5*cm, 12.5*cm])
        t1.setStyle(TableStyle(t1_styles))
        elements.append(t1)
        elements.append(Spacer(1, 12))

        t2_styles = [('GRID', (0,0), (-1,-1), 0.5, colors.black), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('BACKGROUND', (0,0), (0,-1), bg_color), ('BACKGROUND', (0,0), (-1,0), secondary_color), ('SPAN', (0,0), (1,0)), ('ALIGN', (0,0), (1,0), 'CENTER')]
        if is_gr: t2_styles.append(('TEXTCOLOR', (0,0), (-1,0), colors.white))
        t2 = Table(t2_data, colWidths=[6.5*cm, 12.5*cm])
        t2.setStyle(TableStyle(t2_styles))
        elements.append(t2)

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return {"pdf_bytes": pdf_bytes, "orden_beta": pos_orden, "cliente_nombre": c_txt, "cultivo": pos_cultivo or "N/A"}

instruction_pdf_service = InstructionPDFService()
