# 📋 TICKET DE ARQUITECTURA: Bandeja de Datos LogiCapture (Auditoría y Gestión)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** CRÍTICA (Módulo de Cierre Operativo)

---

## 🛑 Objetivo Estructural
Implementar el centro de control "Bandeja de Datos" que permita gestionar, editar y anular registros de LogiCapture, asegurando la integridad de los datos maestros y la calidad de los reportes gerenciales.

---

## 🛠️ Fase 1: Backend (Estructura y Reportabilidad)

### 1. Extensión del Modelo (`app/models/logicapture.py`)
Asegurar la existencia de los siguientes campos en `LogiCaptureRegistro`:
- `status`: Enum (PENDIENTE, PROCESADO, ANULADO).
- `motivo_anulacion`: String descriptivo.
- `fecha_embarque`: DateTime con soporte TZ.
- `planta` y `cultivo`: Capturados del maestro de posicionamiento.
- `codigo_sap`, `ruc_transportista`, `marca_tracto`, `cert_tracto`, `cert_carreta`.

### 2. API de Gestión
- **`GET /api/v1/logicapture/registros`**: Paginación de 10 items. Soporte para filtros múltiples por `planta` y `cultivo`.
- **`PUT /api/v1/logicapture/registros/{id}`**: Lógica de edición que permite actualizar precintos y fecha, pero restringe choferes/vehículos a una selección de lista cerrada (Maestros).
- **`GET /api/v1/logicapture/export/excel`**: Usar `exceljs`. Insertar `public/Logo_AgroFlow.png` en la cabecera. Formatear como **Table Object** con filtros y estilos zebra.

---

## 🎨 Fase 2: Frontend (Bandeja Multi-Tab)

### 1. Página de Bandeja (`frontend/app/logicapture/bandeja/page.tsx`)
- **Pestañas:** "Pendientes" (Default) y "Procesados".
- **DataTable Premium:**
  - Placas: `Tracto/Carreta`.
  - Chofer: `Nombre ApePat InicialMat.`
  - Precintos/Termógrafos: Listado unido por `/`.
- **Filtros Header:** Selectores para Planta y Cultivo que actualizan la tabla reactivamente.

### 2. Lógica de Modales
- **Anulación:** Dropdown con motivos fijos (`Error booking`, `Error precinto`, etc.) + Campo de texto para "Otros".
- **Edición:** Selectores tipo `ComboBox` para Choferes y Vehículos que consultan la base de datos de maestros. **No permitir creación de maestros desde este modal.**

---

## ✅ Criterios de Aceptación
1. [ ] El Excel exportado abre con el logo de AgroFlow y la tabla filtrable armada.
2. [ ] Solo se puede elegir choferes/vehículos ya existentes en maestros al editar.
3. [ ] El botón "Procesar" mueve el registro de la pestaña Pendientes a Procesados.
4. [ ] Se capturan Planta y Cultivo internamente para el filtrado especializado.

---
> **Mensaje de Arquitectura:** Favor de asegurar que el ajuste de columnas en el Excel sea dinámico (auto-fit) para evitar que el texto de los precintos se corte.
