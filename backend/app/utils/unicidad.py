from __future__ import annotations
from typing import Iterable

def normalizar(valor: str | None) -> str | None:
    if valor is None:
        return None
    v = valor.strip()
    if not v:
        return None
    v = " ".join(v.split()).upper()
    return v

def dividir_por_slash(valor: str | None) -> list[str]:
    v = normalizar(valor)
    if not v:
        return []
    partes = [p.strip().upper() for p in v.split("/") if p.strip()]
    # deduplicar manteniendo orden
    vistos = set()
    salida = []
    for p in partes:
        if p not in vistos:
            vistos.add(p)
            salida.append(p)
    return salida

def unir_por_slash(valores: Iterable[str]) -> str | None:
    vals = [normalizar(v) for v in valores]
    vals = [v for v in vals if v]
    if not vals:
        return None
    return "/".join(vals)

import re

def format_container_number(valor: str | None) -> str | None:
    """
    Standardize container numbers to the AAAA 111111-1 format.
    Ensures that containers like MEDU9144085 are converted to MEDU 914408-5.
    """
    if valor is None:
        return None
    
    # Remove all non-alphanumeric characters and make upper case
    v = re.sub(r'[^A-Z0-9]', '', str(valor).upper())
    
    if len(v) == 11 and v[:4].isalpha() and v[4:].isdigit():
        return f"{v[:4]} {v[4:10]}-{v[10]}"
    
    # Si no es un contenedor estándar de 11 caracteres (4 letras + 7 números), 
    # devolvemos el valor normalizado o como lo tenemos.
    return normalizar(valor)
