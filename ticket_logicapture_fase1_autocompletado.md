# 📋 TICKET DE ARQUITECTURA: LogiCapture - Fase 1 (Autocompletado Inteligente)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** CRÍTICA (Motor Operativo Core)

---

## 🛑 Objetivo Estructural
Implementar el motor de resolución de la "Tarjeta de Datos de Embarque". El sistema debe servir como un oráculo de datos que vincula el Booking ingresado con la información maestra de contenedores y la sincronización de pedidos.

---

## 🛠️ Fase 1: Backend (Capa de Resolución)

### 1. Nuevo Router (`app/routers/logicapture.py`)
Implementar endpoint `GET /api/v1/logicapture/lookup/{booking}`:
- **Lógica de Cruce:**
  1. Consultar `posicionamientos` para obtener `ORDEN_BETA`.
  2. Consultar `control_embarque` para obtener `DAM` y `CONTENEDOR`.
- **Manejo de Errores:** Retornar 404 si el Booking no existe en ninguna fuente de datos.

---

## 🎨 Fase 2: Frontend (Interfaz Controlada)

### 1. Blindaje de Formulario (`frontend/app/logicapture/page.tsx`)
Configurar los siguientes campos como **`readOnly`** en el componente `FormField`:
- `ordenBeta`
- `contenedor`
- `dam`
- *Nota:* El usuario solo tiene permiso de edición sobre el campo `booking` y los campos de transporte/precintos.

### 2. Conexión del Botón Venom (Floating Action Button)
- **Acción:** Al hacer click en el botón `Sparkles` (Venom o Header), disparar la petición al backend.
- **Población de Datos:** Inyectar los resultados en el estado `formData`.
- **Feedback Visual:** Cambiar el color de los bordes a `emerald-500` y mostrar el ícono `CheckCircle2` en los campos que fueron autocompletados con éxito.

### 3. Sanitización de Entrada
Asegurar que el `Booking` ingresado se limpie de espacios y se convierta a mayúsculas antes de disparar la búsqueda.

---

## ✅ Criterios de Aceptación
1. [ ] El usuario no puede escribir manualmente en Orden Beta, DAM o Contenedor.
2. [ ] Al presionar el botón de IA, los datos se recuperan y se bloquean en pantalla.
3. [ ] El sistema advierte con un Toast si no se encontró información para el Booking ingresado.

---
> **Mensaje de Arquitectura:** Favor de asegurar que el tiempo de respuesta de la búsqueda sea inferior a 500ms para mantener la fluidez operativa.
