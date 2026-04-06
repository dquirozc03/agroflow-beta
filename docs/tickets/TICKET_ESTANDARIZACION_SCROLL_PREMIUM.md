# 📋 TICKET DE DESARROLLO: Estandarización de Barras de Desplazamiento "Premium" (AgroFlow UI)

**Asignado a:** Desarrollador Senior / Frontend (UI/UX)
**Estado:** PENDIENTE
**Prioridad:** ESTÉTICA / ALTA (Consistencia de Marca)

---

## 🎯 Objetivo General
Eliminar las barras de desplazamiento por defecto del navegador (especialmente visibles y "feas" en Windows) de todos los formularios y contenedores de la aplicación, reemplazándolas por el estilo personalizado "Emerald Minimalist" de AgroFlow para una experiencia de usuario premium y uniforme.

---

## 🛠️ Tareas de Estilo (`frontend/app/globals.css`)

### 1. Globalización de `lc-scroll`
- **Archivo:** `frontend/app/globals.css`
- **Acción**: 
    - Actualmente, el estilo está encapsulado en la clase `.lc-scroll`. 
    - **Nueva Lógica**: Aplicar las propiedades de `scrollbar-width` y `::-webkit-scrollbar` de forma global o mediante una variable de capa base para que **todos** los elementos con `overflow-y-auto` lo hereden por defecto.
    - **Color**: Mantener `rgba(16, 185, 129, 0.15)` como base (Esmeralda suave) y `0.4` en hover.

### 2. Sincronización de Modales (Radix UI)
- **Componentes**: `VehiculoModal`, `ChoferModal`, `TransportistaModal`, `UsuarioModal`, `ClienteIEModal`.
- **Acción**: Asegurar que el contenedor de `Dialog.Content` use la clase de scroll global y que el `padding` sea suficiente para que la barra no "chóque" con el contenido de los campos.

### 3. Ajuste de Contenedores de Tablas y Bandeja
- **Archivo**: `frontend/app/logicapture/bandeja/page.tsx` y otros contenedores de tablas.
- **Acción**: Aplicar el mismo estilo de scroll delgado a los Scrolls horizontales de las tablas si es necesario.

---

## ✅ Criterios de Aceptación
1. [ ] Ningún formulario o modal en Windows debe mostrar la barra de desplazamiento gris por defecto.
2. [ ] La barra de desplazamiento debe ser delgada (6px), con bordes redondeados y de color esmeralda.
3. [ ] El desplazamiento debe ser fluido y no debe causar saltos visuales en el layout (usar `scrollbar-gutter: stable`).
4. [ ] El Sidebar debe mantener su versión extra-delgada (`sidebar-scroll`) pero con la misma paleta de colores.

---
> **Nota del Arquitecto:** "La elegancia está en los detalles". Un usuario de AgroFlow debe sentir que está en una herramienta de grado industrial pero con la finura de una app moderna.
