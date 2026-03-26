import requests
import json

url = "http://localhost:8000/api/v1/sync/posicionamiento/raw"
headers = {
    "X-Sync-Token": "e2R5SKkbFn1nYRGW3b0Clxp_NVHI5eeCaEaE0bHrRv8",
    "Content-Type": "application/json"
}

payload = [
    ["Planta de Llenado", "Cultivo", "Booking", "Nave", "ETD (Booking)", "ETA (Booking)", "POL", "Orden Beta", "Precinto de Senasa", "Operador Logistico", "Naviera", "Termoregistros", "AC", "C/T", "Ventilación", "Temperatura", "Humedad", "Filtros", "Fecha Programada de embarque", "Hora programada", "Cajas Vacías"],
    ["Sullana (Test)", "Granada", "BK-INGE-DANIEL-V2", "CARLOS STYLE SHIP", "2026-04-01", "2026-05-01", "PAITA", "B-99999", "S-001", "RANSA", "MAERSK", "T-XYZ", "NO", "SI", "15%", "0.5", "85%", "NO", "2026-03-30", "08:00 AM", "150"]
]

try:
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
