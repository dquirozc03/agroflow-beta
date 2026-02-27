from lxml import etree
import re

xml_content = """<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:tci="http://tempuri.org/" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
<ext:UBLExtensions>
<ext:UBLExtension>
<ext:ExtensionContent>
<tci:AdditionalInformationDocument>
<tci:Notes>
<tci:Note>
<![CDATA[ BEAU-9705909 - - ]]>
</tci:Note>
</tci:Notes>
</tci:AdditionalInformationDocument>
</ext:ExtensionContent>
</ext:UBLExtension>
</ext:UBLExtensions>
<cbc:Note languageLocaleID="1000">CUARENTA Y DOS Y 48/100 DÓLARES AMERICANOS</cbc:Note>
</Invoice>"""

def normalizar_contenedor(texto):
    if not texto: return None
    print(f"Probando texto: '{texto.strip()}'")
    # Regex Universal: 4 letras seguidas de 7 dígitos (con cualquier basura entre medio)
    match = re.search(r"([A-Z]{4})[^A-Z0-9]*([0-9]{6,7})", texto.upper())
    if match:
        letras = match.group(1)
        numeros = match.group(2)
        if len(numeros) == 7:
            res = f"{letras} {numeros[:6]}-{numeros[6]}"
            print(f"  Encontrado: {res}")
            return res
        elif len(numeros) == 6:
            match_extra = re.search(r"(\d{6})[^A-Z0-9]*([0-9]{1})", texto[match.start(2):])
            if match_extra:
                res = f"{letras} {match_extra.group(1)}-{match_extra.group(2)}"
                print(f"  Encontrado (6+1): {res}")
                return res
    return None

parser = etree.XMLParser(recover=True, huge_tree=True)
root = etree.fromstring(xml_content.encode('utf-8'), parser=parser)

print("--- Intento 1: XPaths con local-name ---")
xpaths = [
    "//*[local-name()='Note']",
    "//*[local-name()='Description']"
]

for path in xpaths:
    nodes = root.xpath(path)
    print(f"Path {path} encontró {len(nodes)} nodos")
    for node in nodes:
        print(f"  Contenido nodo: '{node.text}'")
        res = normalizar_contenedor(node.text)
        if res: break

print("\n--- Intento 2: Búsqueda exhaustiva //text() ---")
all_text_nodes = root.xpath("//text()")
print(f"Encontrados {len(all_text_nodes)} nodos de texto")
for text_val in all_text_nodes:
    res = normalizar_contenedor(str(text_val))
    if res: break
