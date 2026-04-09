import urllib.request
import json
import ssl

url = "https://agroflow-system.onrender.com/api/v1/logicapture/registros/30"
data = json.dumps({
    "precintosBeta": ["FX45576633", "FX45576633"]
}).encode('utf-8')

req = urllib.request.Request(url, data=data, method='PUT')
req.add_header('Content-Type', 'application/json')
req.add_header('Origin', 'https://agroflow-beta.vercel.app')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print("Status:", response.status)
        print("Headers:", response.headers)
        print("Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError Status:", e.code)
    print("Headers:", e.headers)
    print("Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Exception:", e)
