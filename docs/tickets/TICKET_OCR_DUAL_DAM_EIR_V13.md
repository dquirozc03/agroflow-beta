# 📋 TICKET DE DESARROLLO: OCR Dual (DAM y EIR) con Motor OCR Space (V13)

**Asignado a:** Desarrollador Backend / Frontend
**Estado:** PENDIENTE
**Prioridad:** ALTA / OPERATIVA

---

## 🎯 Objetivo General
Habilitar la extracción automática de datos para el módulo de "Contenedores y DAM" utilizando el motor **OCR Space (V13)** actual, asegurando que la lógica de conductores (Brevete/DNI) permanezca intacta y aislada.

---

## 🛠️ Tareas de Backend (FastAPI / `ocr.py`)

### 1. Independencia de Funciones en `ocr.py`
- **Desvincular**: Actualmente `parse_embarque_data` llama a `parse_licencia_data`. Deben separarse para no afectar la estabilidad de conductores.
- **Crear `_extract_shipment_fields(text)`**: Un nuevo método privado que use Regex específicas para logística:
    - **Contenedor**: Buscar patrón `[A-Z]{4}\s*\d{7}` (ej. `MSCU 1234567`). Limpiar espacios al retornar.
    - **DAM (DUA)**: Buscar patrón de 18 o 20 dígitos (ej. `118-202X-10-XXXXXX`).
- **Retorno**: Devolver un objeto con `dam` y `contenedor`.

### 2. Limpieza de Identidad en `maestros.py`
- **Endpoints**: Actualizar `ocr/licencia` y `ocr/embarque`.
- **Logs y Labels**: Cambiar los mensajes de "Gemini Vision 1.5" a "OCR Space V13 (Motor Agroflow)" para evitar confusiones en los reportes de depuración.

---

## 🛠️ Tareas de Frontend (Next.js)

### 1. Lógica de Llenado Aditivo
- **Componente**: `frontend/components/contenedores-modal.tsx`
- **Comportamiento**: Al recibir los datos del OCR, actualizar el estado del formulario de forma **aditiva**.
  - Si el OCR detecta una DAM, llenar solo el campo DAM.
  - Si el OCR detecta un Contenedor, llenar solo el campo Contenedor.
  - **IMPORTANTE**: No borrar lo que el usuario ya escribió en el otro campo (usar el spread operator `...formData` correctamente).

---

## ✅ Criterios de Aceptación
1. [ ] El OCR en el módulo de **Conductores** sigue funcionando exactamente igual (DNI/Nombres).
2. [ ] Al subir un PDF de DAM, el campo "N° de DAM" se llena automáticamente.
3. [ ] Al subir un EIR o foto de contenedor, el campo "N° de Contenedor" se llena automáticamente.
4. [ ] No se producen errores de colisión si se suben ambos tipos de documentos secuencialmente.

---
> **Nota de Seguridad:** Usar el motor `OCREngine: 2` de OCR Space para mayor precisión en documentos técnicos scanneados.
