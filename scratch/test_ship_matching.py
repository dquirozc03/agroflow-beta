import difflib
import re

def normalize_name(name):
    if not name: return ""
    # Quitar todo lo que no sea letras o números y pasarlo a mayúsculas
    return re.sub(r'[^A-Z0-9]', '', name.upper())

def is_same_ship(name1, name2, threshold=0.75):
    if not name1 or not name2: return False
    
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)
    
    # 1. Si son idénticos después de normalizar
    if n1 == n2: return True
    
    # 2. Match por prefijo (Nombre del Barco)
    # Si comparten los primeros 10 caracteres, es muy probable que sea el mismo barco
    min_len = min(len(n1), len(n2))
    if min_len >= 10:
        if n1[:10] == n2[:10]:
            return True

    # 3. Similitud de secuencia (difflib)
    similarity = difflib.SequenceMatcher(None, n1, n2).ratio()
    return similarity >= threshold

# CASOS DE PRUEBA
test_cases = [
    ("ALBEMARLE ISLAND - SR25032EB", "ALBEMARLE ISLAND SR25039"),
    ("EVER LEGACY VEGY0070W", "EVER LEGACY W070"),
    ("MAERSK BATUR / 615N", "MAERSK BATUR"),
    ("MAERSK BATUR", "MAERSK BENGUELA"), # ESTO NO DEBE COINCIDIR
]

print("=== RESULTADOS DE PRUEBA DE SMART MATCH ===")
for ship1, ship2 in test_cases:
    match = is_same_ship(ship1, ship2)
    status = "[OK] MATCH" if match else "[FAILED] NO MATCH"
    sim = difflib.SequenceMatcher(None, normalize_name(ship1), normalize_name(ship2)).ratio()
    print(f"'{ship1}'  VS  '{ship2}'")
    print(f"Resultado: {status} (Similitud: {sim:.2f})")
    print("-" * 50)
