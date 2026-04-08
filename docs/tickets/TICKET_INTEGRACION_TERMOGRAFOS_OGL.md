# 📋 TICKET DE DESARROLLO: Integración de Termógrafos en Packing List OGL

**Asignado a:** Desarrollador Senior / Backend
**Estado:** PENDIENTE
**Prioridad:** ALTA / OPERATIVA

---

## 🎯 Objetivo General
Habilitar el procesamiento del archivo `TERMOGRAFOS.xlsx` durante la generación del Packing List OGL Maestro, cruzando los datos por Pallet ID para inyectar automáticamente los códigos de termógrafos en la columna de Notas.

---

## 🛠️ Tareas de Backend (`backend/app/routers/packing_list.py`)

### 1. Procesamiento de Fuente (`TERMOGRAFOS.xlsx`)
- **Acción**: Implementar la lectura del archivo `termografos` (UploadFile).
- **Mapeo**: 
    - Columna **N** (Pallet ID): Llave de búsqueda.
    - Columna **M** (Código Termógrafo): Valor a extraer.
- **Normalización**: Aplicar `.strip()` y `.upper()` a los IDs de los pallets para asegurar el match.

### 2. Inyección en Packing List Maestro
- **Archivo Destino**: `FORMATO PL - OGL.xlsx`.
- **Ubicación**: Columna **M** (Indice 13 en `openpyxl`) - "Additional information / Notes".
- **Lógica**: 
    - Durante la iteración de pallets en `generate_packing_list_ogl`, buscar el ID del pallet en el mapa generado en el paso 1.
    - Si existe coincidencia, escribir el código en la columna M de la fila correspondiente.

### 3. Saneamiento y Robustez
- **Fallback**: Si no se sube el archivo de termógrafos (opcional), el sistema debe generar el Packing List normalmente con la columna de Notas vacía.
- **Consolidación**: Asegurar que la lógica funcione correctamente para múltiples bookings consolidados en una misma nave.

---

## ✅ Criterios de Aceptación
1. [ ] El Packing List generado contiene los códigos de los termógrafos en los pallets correspondientes.
2. [ ] Los pallets que no están en el Excel de termógrafos permanecen con la columna de Notas vacía.
3. [ ] El formato del Excel resultante (OGL Maestro) se mantiene intacto (estilos, fórmulas, otras columnas).

---
> **Nota del Arquitecto:** "La trazabilidad por pallet es un requerimiento crítico de OGL. El match debe ser exacto y el código debe estar presente en cada fila que corresponda."
