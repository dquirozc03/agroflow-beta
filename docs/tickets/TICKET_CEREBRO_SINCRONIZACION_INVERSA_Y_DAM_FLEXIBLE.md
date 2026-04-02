# 📋 TICKET DE DESARROLLO: Cerebro de Sincronización Inversa y DAM Flexible (Inge Daniel Edition)

**Asignado a:** Desarrollador Senior / Backend
**Estado:** PENDIENTE
**Prioridad:** ALTA / INTELIGENCIA DE DATOS

---

## 🎯 Objetivo General
Implementar la "Sincronización Inversa" entre la Bandeja de Datos y los Maestros de Embarque, permitiendo que las correcciones operativas (DAM) actualicen automáticamente los datos maestros si están incompletos.

---

## 🛠️ Tareas de Backend (FastAPI / SQLAlchemy)

### 1. Flexibilidad en Maestros (DAM Opcional)
- **Archivo:** `backend/app/routers/maestros.py`
- **Cambio A (Pydantic):** En el esquema `EmbarqueCreate`, cambiar `dam: str` a `dam: Optional[str] = None`.
- **Cambio B (Validación):** En `create_embarque`, ajustar la validación de unicidad para que solo se ejecute si `data.dam` no es nulo o un placeholder (`**`, `PENDIENTE`).
- **Limpieza:** Asegurar que en creación/edición de maestros se normalicen los datos con `clean_booking()` y `clean_container_code()`.

### 2. Cerebro de Sincronización Inversa (Reverse Sync)
- **Archivo:** `backend/app/routers/logicapture.py`
- **Cambio (Fase Actualización):** En la función `update_registro` (línea ~507), tras actualizar `reg.dam`:
  - **Lógica Inteligente:** 
    1. Si `req.dam` es una DAM válida (no vacía/placeholder).
    2. Buscar el registro correspondiente en `ControlEmbarque` (Maestro) correlacionando por `booking` + `contenedor`.
    3. Si el Maestro existe y su campo `dam` es nulo o temporal, actualizarlo automáticamente con el valor de `req.dam`.
- **Cambio (Fase Registro):** Implementar esta misma lógica de "autorreparación" del maestro en `register_logicapture_data`.

---

## 🛠️ Tareas de Frontend (UX Maestros / Contenedores y DAM)

### 1. Refinamiento en "Registrar Contenedores y DAM"
- **Archivo:** `frontend/components/contenedores-modal.tsx`
- **Cambio A (Seguridad Autofill):** Añadir `autoComplete="off"` a todos los campos (`booking`, `dam`, `contenedor`).
- **Cambio B (Estado Limpio):** Asegurar que al poner un Booking nuevo, el campo Contenedor se mantenga vacío (`""`) para que el usuario sea quien lo defina.
- **Cambio C (DAM Opcional):** Eliminar el atributo `required` del campo **DAM** en el formulario para maestros.

---

## ✅ Criterios de Aceptación
1. [ ] Es posible registrar un Maestro de Embarque (Maestros > Contenedores y DAM) sin proporcionar la DAM.
2. [ ] Al escribir el Booking en el modal de maestros, el campo Contenedor se mantiene vacío (User-defined).
3. [ ] Al completar la DAM en una edición desde la Bandeja de Datos, el dato viaja y actualiza la tabla maestra de `ControlEmbarque`.
4. [ ] La normalización de datos (`clean_booking`) es consistente en todo el flujo para asegurar que el "match" entre tablas sea exacto.

---
> **Nota de Arquitectura:** Esta mejora reduce drásticamente la carga administrativa, permitiendo que la operación en campo alimente la base de datos maestra de forma orgánica.
