"""
Script de Operaciones: Exportador de OpenAPI
Genera el esquema openapi.json a partir de la instancia de FastAPI.
Uso: python scripts/ops/export_openapi.py
"""
import os
import sys
import json

# Aseguramos que el path incluya el directorio base de backend para importar 'app'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, BASE_DIR)

from app.main import app

def export_openapi():
    # Definir ruta de salida (docs/documentacion/api/openapi.json)
    # Se asume que corre desde backend/
    output_path = os.path.join(BASE_DIR, "..", "docs", "documentacion", "api", "openapi.json")
    output_path = os.path.abspath(output_path)
    
    # Crear directorios si no existen
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Obtener el esquema OpenAPI
    schema = app.openapi()
    
    # Guardar en archivo
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Esquema OpenAPI exportado correctamente en: {output_path}")

if __name__ == "__main__":
    export_openapi()
