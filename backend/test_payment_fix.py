from lxml import etree

xml_content = """<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
<cac:PaymentMeans>
    <cbc:ID>Detraccion</cbc:ID>
    <cbc:PaymentMeansCode>001</cbc:PaymentMeansCode>
</cac:PaymentMeans>
<cac:PaymentTerms>
    <cbc:ID>Detraccion</cbc:ID>
    <cbc:PaymentMeansID>037</cbc:PaymentMeansID>
</cac:PaymentTerms>
<cac:PaymentTerms>
    <cbc:ID>FormaPago</cbc:ID>
    <cbc:PaymentMeansID>Credito</cbc:PaymentMeansID>
</cac:PaymentTerms>
</Invoice>"""

def get_text(node, xpath):
    res = node.xpath(xpath)
    return res[0].text if res else None

def extract_payment_method(root):
    # Estrategia Nueva
    forma_pago = None
    payment_terms_nodes = root.xpath(".//*[local-name()='PaymentTerms']")
    for term in payment_terms_nodes:
        term_id = get_text(term, ".//*[local-name()='ID']")
        if term_id == "FormaPago":
            forma_pago = get_text(term, ".//*[local-name()='PaymentMeansID']")
            if forma_pago: break
    
    if not forma_pago:
        forma_pago = get_text(root, ".//cac:PaymentTerms/cbc:PaymentMeansID") or \
                     get_text(root, ".//cac:PaymentTerms/cbc:ID") or \
                     get_text(root, ".//cac:PaymentMeans/cbc:PaymentMeansCode") or "No Especificado"
    return forma_pago

root = etree.fromstring(xml_content.encode('utf-8'))
result = extract_payment_method(root)
print(f"Forma de Pago extraída: {result}")
