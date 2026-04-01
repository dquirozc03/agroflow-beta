import requests

url = "https://agroflow-okkt.onrender.com/api/v1/instrucciones/generate-pdf"
payload = {
    "booking": "EBKG16127693",
    "observaciones": ""
}
response = requests.post(url, json=payload)
print(response.status_code)
print(response.text)
