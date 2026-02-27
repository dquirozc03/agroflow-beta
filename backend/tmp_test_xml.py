import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1/agroflow/webhook/factura"

def test_invoice(name, invoice_id):
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:ID>{invoice_id}</cbc:ID>
    <cbc:IssueDate>2023-11-20</cbc:IssueDate>
    <cbc:DocumentCurrencyCode>USD</cbc:DocumentCurrencyCode>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification><cbc:ID>20101010101</cbc:ID></cac:PartyIdentification>
            <cac:PartyLegalEntity><cbc:RegistrationName>LOGISTICA MARITIMA S.A.C.</cbc:RegistrationName></cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyIdentification><cbc:ID>20297939131</cbc:ID></cac:PartyIdentification>
            <cac:PartyLegalEntity><cbc:RegistrationName>AGRICOLA BETA S.A.</cbc:RegistrationName></cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:PaymentTerms><cbc:ID>Credito</cbc:ID></cac:PaymentTerms>
    <cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="USD">1000.00</cbc:LineExtensionAmount></cac:LegalMonetaryTotal>

    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="NIU">1</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="USD">800.00</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Description>FLETE INTERNACIONAL - BOOKING: BK999 - NAVE: MSC DANIT</cbc:Description>
        </cac:Item>
        <cac:Price><cbc:PriceAmount currencyID="USD">800.00</cbc:PriceAmount></cac:Price>
    </cac:InvoiceLine>
    <cac:InvoiceLine>
        <cbc:ID>2</cbc:ID>
        <cbc:InvoicedQuantity unitCode="ZZ">1</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="USD">200.00</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Description>THC CALLAO - CARGO POR MANEJO</cbc:Description>
        </cac:Item>
        <cac:Price><cbc:PriceAmount currencyID="USD">200.00</cbc:PriceAmount></cac:Price>
    </cac:InvoiceLine>
</Invoice>
"""
    print(f"--- TEST: {name} ---")
    response = requests.post(BASE_URL, data=xml_content.encode('utf-8'))
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

test_invoice("Nueva Factura con Filtros", "F001-FINAL-999")
