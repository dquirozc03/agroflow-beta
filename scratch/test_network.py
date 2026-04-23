import os
import socket
import sys

def check_port(host, port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        if result == 0:
            print(f"Puerto {port}: ABIERTO")
        else:
            print(f"Puerto {port}: CERRADO (Código: {result})")
        sock.close()
    except Exception as e:
        print(f"Error al verificar puerto {port}: {e}")

host = "aws-0-us-west-2.pooler.supabase.com"
print(f"Verificando host: {host}")
check_port(host, 6543)
check_port(host, 5432)

# También probamos el host directo por si acaso
direct_host = "db.pngjnfncravlteonjeyv.supabase.co"
print(f"\nVerificando host directo: {direct_host}")
check_port(direct_host, 5432)
