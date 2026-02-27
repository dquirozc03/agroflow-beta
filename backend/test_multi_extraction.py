import re
from lxml import etree

def extraer_contenedores(texto):
    if not texto: return []
    contenedores_vistos = []
    BLACKLIST = ["EBKG", "BOOK", "BKG", "BK: ", "BK "]
    
    matches = re.finditer(r"([A-Z]{4})[^A-Z0-9]*([0-9]{6,7})", texto.upper())
    for m in matches:
        letras = m.group(1)
        numeros = m.group(2)
        contexto_previo = texto.upper()[max(0, m.start()-5):m.start()]
        
        if letras in BLACKLIST or "BK" in contexto_previo or "OT" in contexto_previo:
            continue
        
        res = None
        if len(numeros) == 7:
            res = f"{letras} {numeros[:6]}-{numeros[6]}"
        elif len(numeros) == 6:
            match_extra = re.search(r"(\d{6})[^A-Z0-9]*([0-9]{1})", texto[m.start(2):])
            if match_extra:
                res = f"{letras} {match_extra.group(1)}-{match_extra.group(2)}"
        
        if res and res not in contenedores_vistos:
            contenedores_vistos.append(res)
    return contenedores_vistos

def test_services_summary():
    # Simulando 2 lineas de servicio
    servicios = []
    lines = [
        {"desc": "ELECTRICIDAD REEFERS LINEAS", "vu": 92.71, "vt": 92.71},
        {"desc": "ELECTRICIDAD REEFERS LINEAS", "vu": 92.71, "vt": 92.71}
    ]
    
    for line in lines:
        serv_name = line["desc"].strip().upper().split('\n')[0].split(' - ')[0].strip()
        v_unit = line["vu"]
        v_item = line["vt"]
        serv_detalle = f"{serv_name} (VU: {v_unit:,.2f} / VT: {v_item:,.2f})"
        servicios.append(serv_detalle)
    
    summary = " + ".join(servicios)
    print(f"Resumen de servicios: {summary}")

# Test Contenedores
test_obs = "BU4450; - BU4451; - MNBU3647102, MNBU4278225 - credito"
print(f"Contenedores extraídos: {extraer_contenedores(test_obs)}")

# Test Booking + Contenedor
test_obs_2 = "BK: EBKG15456449, CNT: MSGU9135570"
print(f"Contenedores extraídos (mix): {extraer_contenedores(test_obs_2)}")

test_services_summary()
