import re
import difflib

def is_same_ship(name1: str, name2: str, threshold: float = 0.95) -> bool:
    if not name1 or not name2: return False
    if name1 == "SIN NAVE" or name2 == "SIN NAVE": return False
    
    n1 = re.sub(r'[^A-Z0-9]', '', name1.upper())
    n2 = re.sub(r'[^A-Z0-9]', '', name2.upper())
    
    if n1 == n2: return True
    
    ratio = difflib.SequenceMatcher(None, n1, n2).ratio()
    print(f"n1: {n1}, n2: {n2}, ratio: {ratio}")
    return ratio >= threshold

print("Result:", is_same_ship("MSC ALANYA NX618R", "MSC ALANYA NX622A"))
