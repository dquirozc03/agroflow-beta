# 📋 TICKET DE DESARROLLO: UI Instrucciones de Embarque (Solo Frontend)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Inge Daniel approved)
**Prioridad:** ALTA (Fase Visual)

---

## 🛑 ALCANCE: 100% UI / MAQUETACIÓN
**IMPORTANTE:** No implementar backend, ni APIs, ni lógica de generación de PDF. El objetivo es crear la "cáscara" visual premium siguiendo el diseño de referencia.

---

## 🎨 Requerimientos de Diseño

### 1. Estructura de Página (`frontend/app/logicapture/instrucciones/page.tsx`)
- Implementar un Layout de 3 secciones:
    - **Lateral Izquierda (350px):** Buscador de Bookings con lista de resultados en tarjetas.
    - **Derecha Superior:** Grid de información resumida (Booking, Orden Beta, Cliente, Cultivo).
    - **Inferior:** Historial de emisiones con filtros.

### 2. Componentes de Búsqueda
- Input con Icono Lucid-React `Search`.
- Renderizar tarjetas de ejemplo con: ID (Bold), Cliente (Subtle) y Cultivo (Tag/Badge).
- Implementar estado `active` (Borde verde esmeralda) para la tarjeta seleccionada.

### 3. Formulario de Emisión
- Grid de 4 campos de solo lectura para el resumen.
- Textarea estilizado para "Observaciones".
- Botón "Generar Instrucciones" (Vibrant Green) con icono `FileDescription`.

### 4. Tabla de Historial
- Usar el componente de tabla del sistema con:
    - Badges de color para los estados (ACTIVO: Verde, ANULADO: Rojo).
    - Columnas: Fecha/Hora, Booking, Orden Beta, Cliente, Cultivo, Estado, Acciones.
    - Iconos de acción: `Download` (Verde) y `Ban` (Rojo).

---

## ✅ Criterios de Aceptación
1. [ ] La UI es idéntica en distribución a la imagen de referencia.
2. [ ] El diseño es responsivo y respeta el tema oscuro/claro de AgroFlow.
3. [ ] Todos los botones e inputs tienen sus respectivos Hovers y Focus.
4. [ ] Se han creado los archivos necesarios sin lógica de servidor.

---
> **Nota del Arquitecto:** Mantener la coherencia con el estilo "Emerald" usado en LogiCapture y Maestros.
