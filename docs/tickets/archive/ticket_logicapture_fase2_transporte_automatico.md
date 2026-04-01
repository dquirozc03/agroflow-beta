# 📋 TICKET DE ARQUITECTURA: LogiCapture - Fase 2 (Transporte Zero-Click)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** ALTA (Motor de Captura Fluida)

---

## 🛑 Objetivo Estructural
Implementar la resolución automática de datos en la "Tarjeta de Información de Transporte". El sistema debe identificar al chofer y a la empresa de transporte sin intervención manual de botones, garantizando la velocidad operativa.

---

## 🛠️ Fase 1: Backend (Puntos de Resolución)

### 1. Extender `app/routers/logicapture.py`
Añadir los siguientes controladores de consulta rápida:
- **`GET /driver/{dni}`**: 
  - Consultar tabla `choferes`.
  - Retornar: `{ dni, nombres, apellido_paterno, apellido_materno, licencia }`.
- **`GET /vehicle/{placa}`**:
  - Consultar tabla `vehiculos_tracto` con Join a `transportistas`.
  - Retornar: `{ placa, transportista: { nombre_transportista, ruc }, marca }`.

---

## 🎨 Fase 2: Frontend (Sensores Reactivos)

### 1. Lógica Zero-Click (`frontend/app/logicapture/page.tsx`)
Configurar eventos de escucha en la sección "02. Información del Transporte":
- **Placa Tracto (`placaTracto`):** Al detectar `onBlur` (salida del campo), realizar la petición a `/api/v1/logicapture/vehicle/{placa}`. Si es exitosa, poblar el campo `empresa`.
- **DNI Chofer (`dni`):** Al detectar `onBlur`, consultar `/api/v1/logicapture/driver/{dni}` para validar la existencia del conductor.
- **Campo Empresa:** Debe estar permanentemente en estado **`readOnly`**.

### 2. Gestión de Alertas y UX
- **Toasts:** Si los datos no existen en maestros, lanzar una alerta: *"Placa/DNI no registrado en el sistema de maestros"*.
- **Indicador de Carga:** Mostrar un `spinner` miniatura o cambio de color en el borde mientras se realiza la petición asíncrona.
- **Sanitización:** Limpiar la placa (quitar espacios/guiones) antes de enviarla al backend.

---

## ✅ Criterios de Aceptación
1. [ ] El usuario ingresa la placa y el transportista se llena solo al cambiar de input.
2. [ ] El campo "Empresa Transportes" está bloqueado para edición manual.
3. [ ] El sistema usa `sonner` para informar inconsistencias de datos.

---
> **Mensaje de Arquitectura:** Favor de asegurar que el evento `onBlur` no se dispare si el campo está vacío para evitar peticiones innecesarias.
