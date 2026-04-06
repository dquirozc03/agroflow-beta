# 📋 TICKET DE DESARROLLO: Corrección de Fallo en Anulación de Registros (Bandeja)

**Asignado a:** Desarrollador Senior / Frontend
**Estado:** PENDIENTE
**Prioridad:** ALTA / OPERATIVA

---

## 🎯 Objetivo General
Corregir la pérdida de referencia del registro al intentar anular una operación desde el menú de acciones de la Bandeja de Datos. Actualmente, el modal de anulación se abre pero no sabe a qué ID de registro aplicar el cambio, lo que genera el error "Error al anular el registro".

---

## 🛠️ Tareas de Frontend (`frontend/app/logicapture/bandeja/page.tsx`)

### 1. Sincronización de Selección en Acciones
- **Archivo:** `frontend/app/logicapture/bandeja/page.tsx`
- **Función:** `handleStatusChange` (Línea 307+)
- **Acción**: 
    - El modal de anulación (`isAnularOpen`) depende del estado `selectedReg`.
    - Actualmente, al llamar a `handleStatusChange(id, 'ANULADO')` desde el menú, **no se está actualizando `selectedReg`**.
    - **Solución**: 
        1. Modificar la firma de `handleStatusChange` para recibir el objeto `reg` completo: `handleStatusChange(reg: any, newStatus: string)`.
        2. Dentro de la función, si `newStatus === "ANULADO"`, ejecutar `setSelectedReg(reg)` antes de `setIsAnularOpen(true)`.

### 2. Actualización de Llamadas en el Menú
- **Ubicación:** Componente `DropdownMenu` (Línea 715+)
- **Acción**: Cambiar `onClick={() => handleStatusChange(reg.id, 'ANULADO')}` por `onClick={() => handleStatusChange(reg, 'ANULADO')}` para pasar el objeto completo.

### 3. Saneamiento de Mensaje de Error
- **Acción**: Mejorar el `toast.error` en `handleAnularConfirm` para que sea más específico si `selectedReg` no está definido, facilitando el diagnóstico futuro.

---

## ✅ Criterios de Aceptación
1. [ ] Al seleccionar "Anular Registro" desde cualquier fila de la bandeja, el modal debe contener la referencia correcta al ID.
2. [ ] El proceso de anulación debe completarse exitosamente en el backend (estatus cambia a ANULADO en rojo).
3. [ ] No aparecerá el toast de error genérico si los datos son válidos.

---
> **Nota del Arquitecto:** Este es un error de estado común en componentes con menús de acciones dinámicos. Es fundamental que la acción de "Abrir Modal" siempre vaya precedida de la acción "Seleccionar Registro".
