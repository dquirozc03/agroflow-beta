# 📋 TICKET DE DESARROLLO: Normalización a Formato Compacto (Eliminación de Espacios en Slashes)

**Asignado a:** Desarrollador Backend (Python)
**Estado:** PENDIENTE
**Prioridad:** MEDIA / UX OPERATIVA

---

## 🎯 Objetivo General
Modificar la lógica de concatenación de datos en los reportes de Excel (y otras salidas de texto) para eliminar espacios redundantes alrededor del carácter slash ("/"). El resultado debe ser una cadena continua de caracteres más fácil de procesar y copiar.

---

## 🛠️ Tareas de Backend (`app/services/logicapture_service.py`)

### 1. Refactorización de Concatenación en Excel
- **Ubicación:** `LogiCaptureService.generate_excel_report(db)`
- **Cambios en Variables Locales**:
    - **Placas**: Cambiar `placas = f"{r.placa_tracto} / {r.placa_carreta}"` por `f"{r.placa_tracto}/{r.placa_carreta}"`.
    - **TUC**: Cambiar `tuc = f"{tuc_t} / {tuc_c}"` por `f"{tuc_t}/{tuc_c}"`.
    - **Senasa/Línea**: Cambiar `senasa_linea = f"{senasa_codes} / PS.LIN: {linea_codes}"` por `f"{senasa_codes}/PS.LIN:{linea_codes}"`.

### 2. Ajuste de Joins en Listas Multi-valor
Sustituir el separador `" / "` por `"/"` en todos los métodos `.join()` de los siguientes campos del DataFrame:
- **TERMOGRAFOS**: `.join("/")`.
- **PRECINTOS BETA**: `.join("/")`.
- **PRECINTO ADUANA**: `.join("/")`.
- **PRECINTO OPERADOR**: `.join("/")`.

---

## ✅ Criterios de Aceptación
1. [ ] Al generar el reporte Excel, los precintos deben visualizarse como: `ABC123/XYZ789` (sin espacios).
2. [ ] El campo de identificación de línea/senasa debe verse como: `S1/PS.LIN:L1` (sin espacios).
3. [ ] Las placas y TUCs deben seguir el mismo formato compacto.
4. [ ] No se producen errores de lectura en las celdas de Excel.

---
> **Nota del Arquitecto:** Esta mejora facilita la integración manual con otros sistemas al permitir copiar y pegar bloques de texto sin caracteres invisibles.
