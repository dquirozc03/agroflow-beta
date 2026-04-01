# 📋 TICKET DE ARQUITECTURA: OCR Inteligente en Edición de Transportistas

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** ALTA (Mejora de UX en Datos Maestros)

---

## 🛑 Objetivo Estructural
Habilitar la funcionalidad de OCR (Reconocimiento Óptico de Caracteres) en el flujo de **Actualización/Edición** de transportistas, permitiendo que el usuario pueda capturar RUC y Partida Registral desde imágenes, archivos o el portapapeles sin tener que crear un registro nuevo.

---

## 🛠️ Plan de Ejecución (Hoja de Ruta)

### 1. Refactor de `frontend/components/transportista-modal.tsx`
Debes realizar los siguientes ajustes en el componente del modal:

*   **Habilitar Zona de OCR:** Elimina la condición `!editingData` que actualmente oculta el componente `<div className="Zona de OCR Inteligente">`. Debe estar visible tanto en creación como en edición.
*   **Triggers de Campo (RUC y Partida):**
    *   Añade un botón sutil (ícono de `Sparkles` o similar) al final de los inputs de **RUC** (`ruc`) y **Partida Registral** (`partida_registral`).
    *   Este botón debe abrir el explorador de archivos para el OCR o resaltar visualmente que el campo está "listo para recibir un pegado (Ctrl+V)".
*   **Gestión de Datos:** Asegúrate de que el hook de `processOCR` siga actualizando el estado `setFormData` de forma incremental (sin borrar lo que ya existe en el formulario de edición).

### 2. Lógica de Intercepción (Clipboard)
*   Valida que el event listener de `paste` esté activo durante toda la vida del modal abierto, permitiendo al usuario pegar una imagen de tarjeta MTC en cualquier momento del proceso de edición.

---

## 🎨 Guía de Estilo (Sin Cambiar el Diseño)
*   Mantén los estilos de los inputs actuales (`h-12`, `bg-slate-50`, etc.).
*   El ícono de OCR dentro del input debe posicionarse de forma absoluta (`right-3`) para no desplazar el texto.
*   Usa el color `text-emerald-500` para los disparadores inteligentes.

---

## ✅ Criterios de Aceptación
1. [ ] El OCR es funcional al editar un transportista existente.
2. [ ] Se puede pegar una imagen (`Ctrl+V`) y los campos RUC/Partida se autocompletan.
3. [ ] Se puede subir un archivo desde los nuevos disparadores internos de cada campo.
4. [ ] El diseño visual del modal se mantiene fiel al original de la marca Agroflow.

---
> **Nota para el Coder:** Favor de revisar el hook `processOCR` para asegurar que el feedback visual (toasts) sea claro cuando se detectan datos nuevos sobre un registro ya guardado.
