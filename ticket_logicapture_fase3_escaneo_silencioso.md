# 📋 TICKET DE ARQUITECTURA: LogiCapture - Fase 3 (Escaneo Silencioso en Ráfaga)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** CRÍTICA (Motor de Captura de Campo)

---

## 🛑 Objetivo Estructural
Implementar la captura ultra-rápida de precintos y termógrafos mediante pistolas de escaneo, eliminando la fricción de mensajes de error y asegurando que el operario pueda realizar registros múltiples sin interactuar con la pantalla.

---

## 🎨 Fase 1: Frontend (UX de Alta Velocidad)

### 1. Refactor de `MultiInput` (`frontend/app/logicapture/page.tsx`)
Modificar la lógica de procesamiento de entrada:
- **Evento Enter (Pistola):** Al detectar el Enter enviado por el escáner:
    1. Sanitizar el valor (quitar espacios laterales).
    2. Verificar unicidad: `if (!values.includes(scannedValue))`.
    3. **Si es Único:** Añadir a la lista.
    4. **Si es DUPLICADO:** No añadir nada.
    5. **IMPORTANTE:** En ambos casos (éxito o duplicado), **NO MOSTRAR ALERTAS** y vaciar el input inmediatamente (`setInputValue("")`).
- **Mantenimiento de Foco:** Asegurar que el `input` recupere el foco (`focus()`) automáticamente después de cada procesamiento para permitir el siguiente escaneo sin "miss-clicks".

---

## 🛠️ Fase 2: Backend (Persistencia LogiCapture)

### 1. Extender `app/routers/logicapture.py`
Implementar el guardado definitivo del formulario:
- **`POST /api/v1/logicapture/register`**:
    - Recibe el payload completo de la tarjeta (Booking, Transporte, Precintos).
    - Guardar en una nueva tabla `logicapture_registros` (o similar) para auditoría.
    - Se recomienda persistir los campos de precintos como arreglos (JSONB).

---

## ✅ Criterios de Aceptación
1. [ ] El usuario puede escanear precintos seguidos sin tocar el teclado ni ver mensajes de error.
2. [ ] Los precintos duplicados se ignoran silenciosamente.
3. [ ] El cursor siempre vuelve al campo de entrada después de un escaneo.
4. [ ] El botón final de "Guardar y Confirmar Salida" persiste todos los datos en la base de datos.

---
> **Nota de Arquitectura:** Favor de usar `autoFocus` en el primer campo de precintos al cargar la sección para optimizar el inicio de la operación.
