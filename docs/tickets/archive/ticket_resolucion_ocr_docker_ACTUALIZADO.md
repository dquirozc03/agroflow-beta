# 📋 TICKET DE ARQUITECTURA: Solución Definitiva OCR (ACTUALIZADO V2)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** CRÍTICA (Bloqueo en Despliegue de Render Docker)

---

## 🛑 Incidente Detectado (Build Error en Render)
Al intentar construir la imagen Docker en Render, se reportó el error:  
`E: Package 'libgl1-mesa-glx' has no installation candidate`

**Diagnóstico Arquitectónico:** Render está usando la distribución Debian "Trixie" en sus imágenes base. En esta versión, el paquete de sistema `libgl1-mesa-glx` ha sido reemplazado por `libgl1`.

---

## 🛠️ Plan de Ejecución (Hoja de Ruta de Corrección)

### 1. Ajuste Estructural en `backend/Dockerfile`
Es imperativo modificar la línea de instalación de dependencias del sistema operativo para que la construcción sea exitosa.

*Línea a corregir (Cambio Crítico):*
```dockerfile
# Reemplazar libgl1-mesa-glx por libgl1
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-spa \
    poppler-utils \
    libgl1 \           # <--- Cambio estructural (ACTUALIZADO)
    libglib2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
```

### 2. Recordatorio de Configuración en Render
Dada la migración de infraestructura, asegúrate de que el Nuevo Web Service Docker tenga:
- **Root Directory:** `backend`
- **Dockerfile Path:** `Dockerfile`
- **Environment Variables:** Copiadas fielmente del servicio Python anterior (incluyendo el CORS_ORIGINS ya corregido).

---

## ✅ Criterios de Aceptación
1. [ ] El build del Dockerfile termina exitosamente (SUCCESS) en Render.
2. [ ] El servicio OCR es capaz de extraer texto de imágenes en español.
3. [ ] Se eliminaron las referencias a paquetes obsoletos (`libgl1-mesa-glx`) en el Dockerfile.

---
> **Mensaje de Arquitectura:** Favor de priorizar este "git push" con el cambio estructural solicitado para desbloquear la migración hoy mismo.
