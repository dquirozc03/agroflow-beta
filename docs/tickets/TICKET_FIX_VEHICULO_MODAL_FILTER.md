# 📋 TICKET DE DESARROLLO: Corrección de Pantalla Blanca en Módulo de Vehículos

**Asignado a:** Desarrollador Senior / Frontend
**Estado:** PENDIENTE
**Prioridad:** CRÍTICA (Bloqueo de UI)

---

## 🎯 Objetivo General
Resolver el error `TypeError: d.filter is not a function` que ocurre al abrir el `VehiculoModal` e intentar buscar un transportista, lo cual inhabilita por completo el registro de nuevas unidades (Tractos/Carretas).

---

## 🛠️ Tareas de Frontend (`frontend/components/vehiculo-modal.tsx`)

### 1. Corrección de Respuesta de API (Transportistas)
- **Archivo:** `frontend/components/vehiculo-modal.tsx`
- **Función:** `fetchTransportistas` (Línea 95+)
- **Acción**: 
    - El endpoint `/api/v1/maestros/transportistas` ahora devuelve un objeto paginado `{ items: [...], total: ... }`.
    - Modificar la llamada para extraer los resultados: `const data = await resp.json(); setTransportistas(data.items || []);`.
    - **Mejora**: Añadir el parámetro `?size=100` a la URL del fetch para asegurar que el selector tenga una base completa de transportistas activos.

### 2. Limpieza de Advertencias y Accesibilidad
- **Advertencia**: `Warning: Missing Description or aria-describedby={undefined} for {DialogContent}.`
- **Acción**: Añadir el componente `<Dialog.Description>` dentro de `<Dialog.Content>` con una breve descripción del formulario (puede ocultarse visualmente con CSS `sr-only` si es necesario, aunque en nuestro diseño premium puede ir debajo del título).

---

## ✅ Criterios de Aceptación
1. [ ] El modal de vehículos carga exitosamente sin disparar excepciones de tipo.
2. [ ] El buscador de transportistas funciona correctamente filtrando por nombre o RUC.
3. [ ] No aparece el mensaje de "Application error" (pantalla blanca) al abrir el modal.
4. [ ] La consola del navegador está libre de errores de `DialogContent`.

---
> **Nota del Arquitecto:** Este es un error de regresión causado por la actualización de los endpoints a formato paginado "Carlos Style". Se recomienda revisar siempre las claves `items` al consumir servicios de maestros.
