# 📋 TICKET DE ARQUITECTURA: Solución Definitiva OCR (Docker + Refactor)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** CRÍTICA (Bloqueo en Módulo de Captura OCR en Nube)

---

## 🛑 Descripción del Incidente
El servicio de OCR funciona en local (Windows) pero falla en el entorno de Render (Linux). 

**Causas detectadas:**
1.  **Ruta Absoluta:** `ocr.py` tiene hardcoded el path de Windows `C:\Program Files\...`.
2.  **Dependencias de Sistema:** El Native Runtime de Render carece de `tesseract-ocr` y `poppler-utils`.

---

## 🛠️ Plan de Ejecución (Hoja de Ruta)

### 1. Refactor de `backend/app/services/ocr.py`
Eliminar la dependencia de ruta estática. El código debe buscar el binario en el PATH del sistema de forma dinámica.

*Esquema sugerido:*
```python
import platform
import shutil

# ... dentro de __init__ de OCRService ...
if platform.system() == "Windows":
    # Fallback desarrollo local
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
else:
    # Entorno Linux / Docker
    tesseract_path = shutil.which("tesseract")
    if tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
```

### 2. Implementación de Infraestructura (Dockerfile)
Crear un `Dockerfile` en la carpeta `backend/` para garantizar la presencia de las librerías binarias.

*Requerimientos de la imagen:*
- Base: `python:3.11-slim` (o similar).
- Instalación de: `tesseract-ocr`, `tesseract-ocr-spa`, `poppler-utils`, `libgl1-mesa-glx` (para OpenCV).
- Instalación de `requirements.txt`.
- Exponer puerto de `uvicorn`.

### 3. Configuración en Render
Cambiar el **Runtime** de `Python` a `Docker` en el dashboard de Render. El Coder debe asegurar que el `Root Directory` de Render apunte correctamente al `Dockerfile`.

---

## ✅ Criterios de Aceptación
1. [ ] El contenedor construye correctamente sin errores de dependencias de sistema.
2. [ ] El servicio de OCR procesa imágenes y PDFs en el entorno de Render.
3. [ ] Se eliminó la ruta hardcodeada de Windows del código productivo en Linux.

---
> **Nota para el Coder:** Una vez implementado el Dockerfile y el refactor, realiza un despliegue de prueba y notifica a Arquitectura para la validación final.
