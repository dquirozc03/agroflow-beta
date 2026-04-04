# 📋 TICKET DE DESARROLLO: Blindaje en Rojo Persistente (Booking Duplicado)

**Asignado a:** Desarrollador Senior / Frontend
**Estado:** PENDIENTE
**Prioridad:** CRÍTICA / UX PREVENTIVO

---

## 🎯 Objetivo General
Implementar un sistema de bloqueo visual persistente en el formulario de registro (`LogiCaptureV2Page`) que impida avanzar si un Booking ya ha sido procesado, marcando todos los campos asociados en rojo intenso y manteniendo la advertencia de forma permanente.

---

## 🛠️ Tareas de Frontend (Next.js)

### 1. Gestión de Estado de Bloqueo
- **Archivo:** `frontend/app/logicapture/page.tsx`
- **Nuevo Estado**: Añadir `const [isBookingBlocked, setIsBookingBlocked] = useState(false);`.
- **Lógica de Bloqueo (`handleFieldBlur`)**:
    - Si el campo es `booking` y el backend responde `exists: true`, activar `setIsBookingBlocked(true)`.
    - Si el usuario borra el booking o escribe uno nuevo en ese campo, llamar a `setIsBookingBlocked(false)` preventivamente (hasta la siguiente validación).

### 2. Feedback Visual "Inge Daniel Edition"
- **Campos Afectados**: Booking, Orden Beta, Contenedor y DAM.
- **Prop `highlightError`**: Enviar `highlightError={isBookingBlocked}` a todos estos componentes `FormField`.
- **Banner de Alerta**: Mostrar un mensaje de alerta persistente (ej: `AlertCircle` rojo) sobre el bloque "01. Datos de Embarque" mientras la variable de bloqueo sea verdadera.

### 3. Seguridad de Envío
- **Función `handleSave`**: Si `isBookingBlocked` es verdadero, el botón de guardado debe estar deshabilitado o disparar un `toast.error` inmediato bloqueando la persistencia en DB.

---

## ✅ Criterios de Aceptación
1. [ ] Al ingresar un booking procesado, los 4 campos (Booking, Orden, Contenedor, DAM) se marcan inmediatamente en rojo.
2. [ ] El mensaje de error NO desaparece al hacer clic o escribir en otros campos (como DNI o Precintos).
3. [ ] El sistema impide el registro de datos si el booking está bloqueado.
4. [ ] No se muestran iconos de "Success" (check Verde) en los campos bloqueados.

---
> **Nota del Arquitecto:** Esta es una mejora de "Hard Stop" para evitar errores humanos críticos en planta.
