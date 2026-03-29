# 📋 TICKET TÉCNICO: Lógica Funcional Instrucciones de Embarque

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Inge Daniel approved)
**Prioridad:** ALTA

---

## 🎯 Objetivo
Implementar la lógica de "Match" inteligente entre Posicionamiento, Cuadro de Pedidos y Maestros de Clientes para el módulo de Instrucciones de Embarque (IE).

---

## 🛠️ Requerimientos de Backend

### 1. Nuevo Punto de Acceso (Endpoint)
- **Ruta:** `GET /api/v1/instrucciones/lookup/{booking}`.
- **Lógica de Ejecución:**
    1. Buscar en `posicionamiento` el `booking` ingresado. Obtener `ORDEN_BETA` y `CULTIVO`.
    2. **Normalización:** Extraer solo números de `ORDEN_BETA` (Ej: `BG009` -> `009`).
    3. Buscar en `cuadro_de_pedidos` el registro donde sea el mismo número de `orden` y el mismo `cultivo`. Obtener el campo `CLIENTE`.
    4. Buscar en `clientes_ie` el registro donde coincida el nombre legal del cliente obtenido.

### 2. Respuesta Estructurada (JSON)
- Retornar objeto con: `booking`, `orden_beta`, `cultivo`, `cliente_nombre`, y los detalles del maestro de cliente (consignatarios, etc.).
- **Alerta de Maestro:** Si el cliente no existe en `clientes_ie`, retornar un flag `warning: "CLIENTE_NO_MAESTRO"`.

---

## 🎨 Requerimientos de Frontend

### 1. Conexión de Búsqueda
- Vincular el buscador lateral de IE con el nuevo endpoint de Lookup.
- Al seleccionar una tarjeta, poblar automáticamente todos los campos del formulario.

### 2. Validaciones y UX Premium 💎
- **Tooltip de Cliente:** Si el nombre del cliente es mayor a 50 caracteres, aplicar truncamiento visual (CSS) y mostrar un Tooltip (Lucide o Radix) al poner el cursor.
- **Manejo de Alerta:** Si llega el flag `CLIENTE_NO_MAESTRO`, resaltar el campo de Cliente con borde rojo y texto: *"⚠️ El cliente no existe en maestros"*.

---

## ✅ Criterios de Aceptación
1. [ ] El cruce de tablas funciona correctamente limpiando las letras iniciales de la orden.
2. [ ] Se valida el cultivo correctamente para el match.
3. [ ] El formulario muestra el aviso visual si el cliente no está en la base de maestros de IE.
4. [ ] No se rompe la UI con nombres de clientes muy largos.

---
> **Nota del Arquitecto:** No implementar generación de PDF todavía. Solo la recuperación y validación de datos.
