# 📋 TICKET DE ARQUITECTURA: Optimización y Limpieza Industrial

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** ALTA (Estabilidad Estructural)

---

## 🛑 Objetivo Estructural
Optimizar el código fuente para mejorar la mantenibilidad y el rendimiento, sin afectar la funcionalidad actual del sistema. Se busca eliminar la duplicidad de lógica (DRY) y desacoplar los servicios pesados de los routers.

---

## 🛠️ Fase 1: Backend (Refactor de Capas)

### 1. Desacoplamiento de Servicios
- **Crear:** `backend/app/services/logicapture_service.py`.
- **Acción:** Mover toda la lógica de validación, guardado y formateo de `logicapture.py` a este servicio. El Router solo debe manejar peticiones y respuestas.

### 2. Centralización de Formateadores (`backend/app/utils/formatters.py`)
- **Crear:** Librería de utilidades para limpieza de datos.
- **Funciones:**
    - `clean_booking()` (Upper + Strip)
    - `clean_plate()` (Upper + No hyphens)
    - `clean_container()` (ISO Regex)
    - `clean_dni()` (Strip + Validation)
- **Acción:** Reemplazar todas las limpiezas manuales (`.upper().strip()`) en los routers por estas funciones centralizadas.

### 3. Reportes Excel con Identidad
- **Imagen:** Insertar `public/Logo_AgroFlow.png` en la cabecera del Excel.
- **Optimización:** Usar el motor de servicios para generar el archivo, asegurando que la tabla nativa de Excel (`Table`) incluya todos los campos de auditoría con auto-ajuste de columnas.

---

## 📊 Fase 2: Performance de Base de Datos

### 1. Auditoría de Índices
- Revisar modelos de SQLAlchemy y asegurar que `index=True` esté presente en:
    - `LogiCaptureRegistro.planta`
    - `LogiCaptureRegistro.cultivo`
    - `LogiCaptureRegistro.status`
    - `LogiCaptureRegistro.booking`
- **Acción:** Correr script de sincronización para reflejar índices en Supabase.

---

## ✅ Criterios de Aceptación
1. [ ] El sistema se mantiene 100% funcional y el usuario no nota cambios en la UI.
2. [ ] El reporte de Excel ahora muestra el logo de Agroflow.
3. [ ] No existe lógica de limpieza de texto duplicada en el backend.
4. [ ] Las búsquedas por filtros en la bandeja son sub-segundo.

---
> **Mensaje de Arquitectura:** Favor de realizar pruebas de regresión en las validaciones de unicidad de LogiCapture tras el refactor.
