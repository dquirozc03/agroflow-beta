import requests

# Ajusta el puerto si es necesario
API_URL = "http://127.0.0.1:8000/api/v1/maestros/clientes-ie/"

try:
    print("Obteniendo la lista de clientes...")
    res = requests.get(API_URL)
    clientes = res.json()
    if len(clientes) > 0:
        c = clientes[0]
        c_id = c['id']
        print(f"Probando UPDATE HTTP en el cliente {c_id} ({c['nombre_legal']})...")
        
        # Simulamos lo que envía el Frontend
        payload = c.copy()
        payload["po"] = "HTTP_TEST_PO_1,HTTP_TEST_PO_2"
        
        res_put = requests.put(f"{API_URL}{c_id}", json=payload)
        print("Respuesta HTTP PUT:", res_put.status_code, res_put.text)
        
        # Verificar
        res_check = requests.get(API_URL)
        c_check = next(x for x in res_check.json() if x['id'] == c_id)
        print(f"PO guardado en la API: {c_check.get('po')}")
        
    else:
        print("No hay clientes para probar.")
except Exception as e:
    print("Error:", e)
