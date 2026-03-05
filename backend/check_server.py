
import requests

URL = "https://agroflow-beta.onrender.com/api/v1/sync/posicionamiento/raw"
TOKEN = "dev_secret_token_2024"

# Enviamos una cabecera de prueba para ver qué versión responde
payload = [["BOOKING", "STATUS - FCL"]]

print(f"--- Comprobando servidor en {URL} ---")
try:
    response = requests.post(URL, json=payload, headers={"X-Sync-Token": TOKEN})
    data = response.json()
    print(f"Status Code: {response.status_code}")
    print(f"Respuesta Completa: {data}")
    
    version = data.get("version", "DESCONOCIDA (Probablemente código viejo)")
    print(f"\n VERSION ACTIVA: {version}")
    
    if version == "v1.3-deep-debug":
        print("\n✅ ¡EL SERVIDOR ESTÁ ACTUALIZADO! El problema ahora es el Excel.")
    else:
        print("\n❌ EL SERVIDOR NO ESTÁ ACTUALIZADO. Render está ignorando la rama 'dev'.")
        
except Exception as e:
    print(f"Error: {e}")
