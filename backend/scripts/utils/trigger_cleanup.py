import requests

url = "https://agroflow-beta.onrender.com/api/v1/agroflow/cleanup-database-INTERNAL"
headers = {
    "X-Sync-Token": "beta_sync_2026",
    "Content-Type": "application/json"
}

try:
    print(f"Llamando a {url}...")
    response = requests.post(url, headers=headers)
    if response.status_code == 200:
        print("Éxito:", response.json())
    else:
        print(f"Error {response.status_code}: {response.text}")
except Exception as e:
    print(f"Error de conexión: {e}")
