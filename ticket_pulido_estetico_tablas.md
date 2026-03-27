# 📋 TICKET DE ARQUITECTURA: Pulido Estético Premium (Tablas Maestras)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** MEDIA (Refinamiento de UX/UI)

---

## 🛑 Objetivo Estructural
Elevar la calidad visual y la simetría de todas las tablas de datos maestros (Transportistas, Vehículos y Choferes) para ofrecer una experiencia de usuario más profesional y robusta.

---

## 🛠️ Plan de Ejecución (Hoja de Ruta de Diseño)

### 1. Corrección Operativa (Vehículos)
En `frontend/app/maestros/vehiculos/page.tsx`, debes insertar el bloque de "Empty State" que falta:
- **Acción:** Si `filtered.length === 0`, mostrar una fila con un mensaje centrado: *"No se encontraron unidades registradas"*.

### 2. Simetría y Centrado (Global)
Modificar los archivos de página (`page.tsx`) de los tres módulos maestros:
- **Encabezados:** Cambiar las clases de los `<th>` de `text-left` a **`text-center`**.
- **Acciones:** Asegurar que tanto el encabezado de "Acciones" como su celda correspondiente (`<td>`) estén centrados (`text-center` / `justify-center`).

### 3. Rediseño de Botones de Acción (Premium)
Mejorar la interacción semántica de los botones:
- **Botón Editar:** Aplicar `hover:bg-emerald-500 hover:text-white hover:border-emerald-500`.
- **Botón Inhabilitar:** Aplicar `hover:bg-rose-500 hover:text-white hover:border-rose-500`.
- **Transiciones:** Usar `transition-all duration-300` y `active:scale-95` para una sensación de respuesta táctil.

### 4. Líneas Divisorias de "Seda"
Añadir bordes inferiores muy tenues entre las filas de la tabla:
- **Estilo:** `border-b border-slate-100/50`. El objetivo es que sean casi imperceptibles, actuando solo como guía visual sutil.

---

## ✅ Criterios de Aceptación
1. [ ] La tabla de vehículos ya no queda en blanco cuando no hay datos.
2. [ ] Todos los títulos y acciones de las tablas están perfectamente centrados.
3. [ ] Los botones de acción reaccionan con colores vivos según su función.
4. [ ] Se mantiene la limpieza estética original (sin sombras pesadas ni bordes gruesos).

---
> **Nota para el Coder:** Favor de verificar que el centrado no afecte la legibilidad de los nombres largos; si es necesario, usa `truncate` o un `max-w-xs` para los campos de texto densos.
