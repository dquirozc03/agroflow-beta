from rapidfuzz import fuzz

def is_same_ship(nave1: str, nave2: str) -> bool:
    if not nave1 or not nave2:
        return False
    n1 = nave1.strip().upper()
    n2 = nave2.strip().upper()
    if n1 == n2:
        return True
    
    # 2. Similitud difusa
    similarity = fuzz.ratio(n1, n2)
    return similarity > 95  # 95% threshold

print(fuzz.ratio("MSC ALANYA NX618R", "MSC ALANYA NX622A"))
print(is_same_ship("MSC ALANYA NX618R", "MSC ALANYA NX622A"))
