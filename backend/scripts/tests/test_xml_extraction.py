import re

def normalizar_contenedor(texto):
    if not texto: return None
    # Prefijos que indican que es un BOOKING y NO un contenedor
    BLACKLIST = ["EBKG", "BOOK", "BKG", "BK: ", "BK "]
    
    print(f"DEBUG: Analizando texto: '{texto}'")
    
    # Buscar TODOS los posibles candidatos en el texto
    matches = re.finditer(r"([A-Z]{4})[^A-Z0-9]*([0-9]{6,7})", texto.upper())
    
    found_any = False
    for m in matches:
        found_any = True
        letras = m.group(1)
        numeros = m.group(2)
        match_full = m.group(0)
        
        # Si el prefijo está en la blacklist, lo ignoramos y seguimos buscando
        contexto_previo = texto.upper()[max(0, m.start()-5):m.start()]
        print(f"  ? Candidato encontrado: '{match_full}' (Prefix: {letras}, Contexto Prev: '{contexto_previo}')")
        
        if letras in BLACKLIST or "BK" in contexto_previo or "OT" in contexto_previo:
            print(f"    -> RECHAZADO: Es Booking o similar.")
            continue
        
        # Si llegamos aquí, es probable que sea un contenedor real
        if len(numeros) == 7:
            res = f"{letras} {numeros[:6]}-{numeros[6]}"
            print(f"    -> ACEPTADO: {res}")
            return res
        elif len(numeros) == 6:
            match_extra = re.search(r"(\d{6})[^A-Z0-9]*([0-9]{1})", texto[m.start(2):])
            if match_extra:
                res = f"{letras} {match_extra.group(1)}-{match_extra.group(2)}"
                print(f"    -> ACEPTADO (6+1): {res}")
                return res
            print(f"    -> RECHAZADO: Falta dígito verificador.")
            
    if not found_any:
        print("  ! No se encontraron patrones similares a contenedores.")
    return None

# Caso de prueba del usuario
test_string = "OT: 511800, BK: EBKG15456449, NAVE: MSC RAYSHMI NX602R, CNT: MSGU9135570, REF: BK: EBKG15456449 // UVAS FRESCAS SOBREESTADIA"
result = normalizar_contenedor(test_string)
print(f"\nRESULTADO FINAL: {result}")

test_string_2 = "BK: EBKG 1234567, CONTENEDOR: BEAU 987654 3"
result_2 = normalizar_contenedor(test_string_2)
print(f"\nRESULTADO FINAL 2: {result_2}")
