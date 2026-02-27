from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.ref_posicionamiento import RefPosicionamiento
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/agroflow", tags=["AgroFlow"])

class BookingData(BaseModel):
    booking: str
    naviera: Optional[str]
    nave: Optional[str]
    pol: Optional[str]
    pod: Optional[str]
    temperatura: Optional[str]
    ventilacion: Optional[str]
    planta_llenado: Optional[str]
    hora_posicionamiento: Optional[str]
    ac_option: bool
    ct_option: bool
    operador_logistico: Optional[str]
    cultivo: Optional[str]
    es_reprogramado: bool

@router.get("/booking/{booking_id}", response_model=BookingData)
def get_booking_data(booking_id: str, db: Session = Depends(get_db)):
    # Normalizar búsqueda
    booking_id = booking_id.strip().upper()
    
    row = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Booking no encontrado en posicionamiento")
    
    return BookingData(
        booking=row.booking,
        naviera=row.naviera,
        nave=row.nave,
        pol=row.pol,
        pod=row.pod,
        temperatura=row.temperatura,
        ventilacion=row.ventilacion,
        planta_llenado=row.planta_llenado,
        hora_posicionamiento=row.hora_posicionamiento,
        ac_option=bool(row.ac_option),
        ct_option=bool(row.ct_option),
        operador_logistico=row.operador_logistico,
        cultivo=row.cultivo,
        es_reprogramado=bool(row.es_reprogramado)
    )

import re
from fastapi import Request
from lxml import etree
from datetime import datetime
from app.models.factura import FacturaLogistica, FacturaDetalleLogistica

@router.post("/webhook/factura")
async def receive_invoice_webhook(request: Request, db: Session = Depends(get_db)):
    """ Endpoint para procesar facturas XML UBL 2.1 """
    body = await request.body()
    
    if not body:
        raise HTTPException(status_code=400, detail="Empty body")
    
    try:
        # Usar recover=True permite a lxml procesar XMLs con pequeños errores de sintaxis
        parser = etree.XMLParser(recover=True, huge_tree=True)
        root = etree.fromstring(body, parser=parser)
    except etree.XMLSyntaxError as e:
        raise HTTPException(status_code=400, detail=f"Invalid XML format: {str(e)}")

    import traceback

    try:
        # 1. Ignorar ApplicationResponse (CDR)
        if "ApplicationResponse" in root.tag:
            return {"status": "ignored", "detail": "ApplicationResponse not processed"}

        # Namespaces estándar SUNAT
        ns = {
            "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
            "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
        }

        # Helper para extraer texto seguro
        def get_text(node, xpath_query):
            el = node.xpath(xpath_query, namespaces=ns)
            if not el:
                return None
            if isinstance(el[0], str):  # Es un atributo (@)
                return el[0].strip()
            return el[0].text.strip() if el[0].text else None

        # 2. Filtro de Seguridad (Receptor BETA) -> Ahora guarda advertencia
        receptor_ruc = get_text(root, ".//cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID")
        receptor_name = get_text(root, ".//cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName")

        advertencia = None
        if not receptor_ruc or not receptor_name:
            advertencia = "Faltan datos del receptor en el XML."
        elif receptor_ruc != "20297939131" or "BETA" not in receptor_name.upper():
            advertencia = f"Receptor no es BETA. RUC: {receptor_ruc}, Nombre: {receptor_name}"

        # 3. Identificación del Proveedor (Emisor)
        proveedor_ruc = get_text(root, ".//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID")
        proveedor_name = get_text(root, ".//cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName")
        
        if not proveedor_ruc or not proveedor_name:
            raise HTTPException(status_code=400, detail="Missing supplier data")

        # 4. Datos del Comprobante
        serie_correlativo = get_text(root, ".//cbc:ID")
        fecha_emision_str = get_text(root, ".//cbc:IssueDate")
        moneda = get_text(root, ".//cbc:DocumentCurrencyCode")
        
        if not serie_correlativo or not fecha_emision_str:
            raise HTTPException(status_code=400, detail="Missing document basic data")

        # Parsear Fecha de Emisión
        try:
            fecha_emision = datetime.strptime(fecha_emision_str, "%Y-%m-%d").date()
        except ValueError:
            fecha_emision = None

        # Fecha de Pago (Vencimiento)
        fecha_pago_str = get_text(root, ".//cac:PaymentTerms/cbc:PaymentDueDate")
        fecha_pago = None
        if fecha_pago_str:
            try:
                fecha_pago = datetime.strptime(fecha_pago_str, "%Y-%m-%d").date()
            except ValueError:
                pass

        # Forma de Pago
        # Puede estar en PaymentMeansID o ID de PaymentTerms
        forma_pago = get_text(root, ".//cac:PaymentMeans/cbc:PaymentMeansCode") or \
                    get_text(root, ".//cac:PaymentTerms/cbc:PaymentMeansID") or \
                    get_text(root, ".//cac:PaymentTerms/cbc:ID") or "No Especificado"

        # Subtotal Factura (Valor de Venta Neto / Sin IGV)
        subtotal_str = get_text(root, ".//cac:LegalMonetaryTotal/cbc:LineExtensionAmount")
        try:
            subtotal = float(subtotal_str) if subtotal_str else 0.0
        except ValueError:
            subtotal = 0.0

        # 5. Extracción de Contenedor / AWB (RegEx)
        contenedor = None
        
        def normalizar_contenedor(texto):
            if not texto: return None
            # Regex más robusta: 4 letras seguidas de 7 dígitos (con posibles separadores intermedios)
            # Ejemplo: BEAU9705909, BEAU-9705909, BEAU 970590-9, BEAU - 970590-9
            match = re.search(r"([A-Z]{4})[^A-Z0-9]*([0-9]{6,7})", texto.upper())
            if match:
                letras = match.group(1)
                numeros = match.group(2)
                # Si tenemos 7 números, el último es el dígito verificador
                if len(numeros) == 7:
                    return f"{letras} {numeros[:6]}-{numeros[6]}"
                # Si solo hay 6, intentamos buscar un dígito extra después de un posible separador
                elif len(numeros) == 6:
                    match_extra = re.search(r"(\d{6})[^A-Z0-9]*([0-9]{1})", texto[match.start(2):])
                    if match_extra:
                        return f"{letras} {match_extra.group(1)}-{match_extra.group(2)}"
            return None

        # Lista de XPaths donde suele venir el contenedor
        xpaths_busqueda = [
            ".//cbc:Note",                                      # Observaciones
            ".//cac:Item/cbc:Description",                      # Descripción de ítems
            ".//cac:AdditionalDocumentReference/cbc:ID",         # Referencias adicionales
            ".//cac:Shipment/cac:TransportHandlingUnit/cac:TransportEquipment/cbc:ID" # Estándar UBL
        ]

        for path in xpaths_busqueda:
            nodes = root.xpath(path, namespaces=ns)
            for node in nodes:
                contenedor = normalizar_contenedor(node.text)
                if contenedor: break
            if contenedor: break

        # Evitar Duplicados: Consultar si ya existe el comprobante del mismo proveedor
        existing = db.query(FacturaLogistica).filter(
            FacturaLogistica.proveedor_ruc == proveedor_ruc,
            FacturaLogistica.serie_correlativo == serie_correlativo
        ).first()

        if existing:
            return {"status": "duplicated", "detail": f"Invoice {serie_correlativo} from {proveedor_ruc} already exists"}

        # Crear el nuevo registro principal
        nueva_factura = FacturaLogistica(
            proveedor_ruc=proveedor_ruc,
            proveedor_razon_social=proveedor_name,
            serie_correlativo=serie_correlativo,
            fecha_emision=fecha_emision,
            fecha_pago=fecha_pago,
            moneda=moneda,
            subtotal=subtotal,
            forma_pago=forma_pago,
            contenedor=contenedor,
            advertencia=advertencia
        )
        db.add(nueva_factura)
        db.flush() # Para obtener el ID

        # 6. Detalle de Servicios (Ítems) e Inteligencia de Resumen
        invoice_lines = root.xpath(".//cac:InvoiceLine", namespaces=ns)
        
        servicios_encontrados = []
        um_principal = None
        
        # Palabras clave a ignorar (ruido administrativo)
        RUIDO = ["BOOKING", "CONTENEDOR", "CONTE", "AWB", "PLACA", "CHOFER", "NAVE", "VIAJE", "REFERENCIA"]

        for line in invoice_lines:
            descripcion_raw = get_text(line, ".//cac:Item/cbc:Description") or ""
            unidad_medida = get_text(line, ".//cbc:InvoicedQuantity/@unitCode") or "ZZ"
            
            # Limpiar y filtrar descripción
            desc_clean = descripcion_raw.strip().upper()
            
            # Si no es puro ruido, lo consideramos un servicio
            es_servicio = True
            if not desc_clean:
                es_servicio = False
            else:
                # Si la descripción empieza con algo ruidoso, la filtramos del resumen principal
                for R in RUIDO:
                    if desc_clean.startswith(R):
                        es_servicio = False
                        break
            
            if es_servicio:
                # Tomamos solo la primera parte si es muy larga o tiene saltos
                serv_name = desc_clean.split('\n')[0].split(' - ')[0].strip()
                if serv_name and serv_name not in servicios_encontrados:
                    servicios_encontrados.append(serv_name)
                
                # La primera UM de un servicio real será la principal
                if not um_principal:
                    um_principal = unidad_medida

            vu_str = get_text(line, ".//cac:Price/cbc:PriceAmount")
            vi_str = get_text(line, ".//cbc:LineExtensionAmount")
            
            try:
                valor_unitario = float(vu_str) if vu_str else 0.0
            except ValueError:
                valor_unitario = 0.0
                
            try:
                valor_item = float(vi_str) if vi_str else 0.0
            except ValueError:
                valor_item = 0.0

            detalle = FacturaDetalleLogistica(
                factura_id=nueva_factura.id,
                descripcion=descripcion_raw[:500],
                unidad_medida=unidad_medida[:10],
                valor_unitario=valor_unitario,
                valor_item=valor_item
            )
            db.add(detalle)

        # Actualizar resumen en la cabecera
        resumen_desc = " / ".join(servicios_encontrados)[:500]
        if not resumen_desc:
            resumen_desc = "SERVICIOS LOGISTICOS"
            
        nueva_factura.descripcion = resumen_desc
        nueva_factura.unidad_medida = um_principal or "ZZ"

        db.commit()
        return {"status": "success", "factura_id": nueva_factura.id, "mensaje": "Factura recibida con éxito"}

    except Exception as e:
        error_info = traceback.format_exc()
        print("WEBHOOK ERROR:\n" + error_info)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logistica/facturas")
def get_logistica_facturas(db: Session = Depends(get_db)):
    """ Endpoint para consultar las facturas en el frontend """
    facturas = db.query(FacturaLogistica).order_by(FacturaLogistica.creado_en.desc()).all()
    return facturas

