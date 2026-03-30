from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.posicionamiento import Posicionamiento
from app.models.pedido import PedidoComercial
from app.models.maestros import ClienteIE
import re
from decimal import Decimal

class InstructionPDFService:
    def __init__(self):
        # Directorio base para las plantillas
        self.template_dir = os.path.join(os.path.dirname(__file__), "../templates/pdf")
        if not os.path.exists(self.template_dir):
            os.makedirs(self.template_dir, exist_ok=True)
            
        self.env = Environment(loader=FileSystemLoader(self.template_dir))

    def _normalize_orden(self, raw_orden: str) -> str:
        if not raw_orden: return ""
        match = re.search(r'\d+', raw_orden)
        return match.group(0) if match else raw_orden

    def generate_instruction_pdf(self, booking: str, db: Session, observaciones: str = ""):
        # 1. Obtener datos de Posicionamiento
        pos = db.query(Posicionamiento).filter(Posicionamiento.BOOKING == booking).first()
        if not pos:
            raise Exception(f"Booking {booking} no encontrado en Posicionamiento")

        # 2. Obtener Pedidos asociados a la Orden
        normalized_orden = self._normalize_orden(pos.ORDEN_BETA)
        pedidos = db.query(PedidoComercial).filter(
            PedidoComercial.orden_beta.ilike(f"%{normalized_orden}%"),
            PedidoComercial.cultivo.ilike(pos.CULTIVO)
        ).all()

        if not pedidos:
            # Si no hay pedidos comerciales, creamos un objeto dummy para la plantilla
            pedidos = []
            total_cajas = 0
            total_pallets = 0
            peso_bruto = 0
            cliente_nombre = "NO ENCONTRADO"
        else:
            total_cajas = sum(p.total_cajas or 0 for p in pedidos)
            total_pallets = sum(p.total_pallets or 0 for p in pedidos)
            cliente_nombre = pedidos[0].cliente
            
            # Cálculo de Peso Bruto: (Total Cajas * Peso Kg de la primera línea) * 1.05
            # Asumimos que el peso por caja es consistente en la orden
            peso_kg = pedidos[0].peso_por_caja or Decimal("0")
            peso_bruto = float(total_cajas) * float(peso_kg) * 1.05

        # 3. Obtener Maestro de Cliente IE
        cliente_maestro = db.query(ClienteIE).filter(
            ClienteIE.nombre_legal.ilike(cliente_nombre)
        ).first()

        # 4. Preparar contexto para la plantilla
        context = {
            "pos": pos,
            "cliente": cliente_maestro,
            "pedidos": pedidos,
            "total_cajas": total_cajas,
            "total_pallets": total_pallets,
            "peso_bruto": round(peso_bruto, 2),
            "observaciones": observaciones,
            "fecha_emision": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "is_granada": "GRANADA" in (pos.CULTIVO or "").upper()
        }

        # 5. Renderizar HTML
        template = self.env.get_template("ie_template.html")
        html_content = template.render(context)

        # 6. Generar PDF
        # Note: We return the bytes of the PDF
        return HTML(string=html_content).write_pdf()

instruction_pdf_service = InstructionPDFService()
