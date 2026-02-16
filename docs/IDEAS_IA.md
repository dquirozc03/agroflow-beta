# Ideas de IA para Nexo / LogiCapture

Estas son ideas de cómo la IA podría ayudar en el sistema, según el rol y los datos que cada uno ve. No están implementadas; sirven como hoja de ruta o inspiración.

---

## 1. Por rol

### Documentaría (solo Historial)
- **Resumen en lenguaje natural**: “En los últimos 7 días hubo 42 registros, 38 procesados y 2 anulados. El transportista más frecuente fue X.”
- **Gráficos explicados**: Al pasar el mouse (o en un botón “Explicar”), un texto corto: “Este pico del martes se debe a 12 registros en un solo día.”
- **Alertas suaves**: “Hay 3 registros anulados esta semana; los motivos más usados son …”

### Facturador (Captura + Bandeja + Historial, sin editar)
- **Sugerencias al capturar**: Al escribir un booking, sugerir AWB/DAM desde referencias: “¿Usar AWB XXX asociado a este booking?”
- **Recordatorios**: “Tienes 5 registros pendientes en la bandeja; 2 llevan más de un día.”
- **Detección de posibles errores**: “Este DNI ya se usó hoy en otro registro; ¿es el mismo chofer?”

### Supervisor / Administrador
- **Todo lo anterior** más:
- **Anomalías**: “El mismo AWB aparece en dos registros con fechas distintas.”
- **Resumen para reuniones**: “Esta semana: X registros, Y procesados, Z anulados; comparado con la semana pasada …”
- **Recomendaciones**: “Hay muchos anulados por ‘Error de facturación’; revisar proceso.”

---

## 2. Funciones concretas que podrían implementarse

| Idea | Descripción | Dato que usa |
|------|-------------|--------------|
| **Autocompletado por booking** | Al ingresar booking, sugerir O_BETA, AWB, DAM desde referencias (ya hay datos; la IA podría ordenar o priorizar sugerencias). | Referencias, historial |
| **Clasificación de motivo de anulación** | Si el usuario escribe texto libre en “Otro”, proponer una etiqueta del listado (Contenedor no salió, Error de facturación, etc.). | Motivos guardados |
| **Resumen en texto** | Un párrafo corto del dashboard: totales, comparación con periodo anterior, transportista más usado. | Stats, historial |
| **Detección de duplicados / anomalías** | Avisar si el mismo AWB (o combinación crítica) aparece en más de un registro en ventanas de tiempo definidas. | Historial, unicidad |
| **Chat o consultas en lenguaje natural** | “¿Cuántos registros procesamos ayer?” → la IA traduce a filtros o a una llamada al backend y muestra el resultado. | API, historial |
| **Predicción de carga** | Estimar “mañana podrían llegar X registros” según día de la semana y tendencia reciente (opcional, más avanzado). | Historial por fecha |

---

## 3. Cómo integrar la IA (a nivel idea)

- **Backend**: Un servicio (propio o externo) que reciba contexto (rol, datos agregados o IDs) y devuelva texto o sugerencias. El frontend solo muestra y no expone lógica sensible.
- **Seguridad**: El rol y los permisos se validan en el servidor; la IA solo recibe los datos que ese rol puede ver (por ejemplo, documentaría solo datos de historial agregados).
- **Privacidad**: No enviar DNI ni datos personales completos al modelo si no es necesario; usar códigos o agregados cuando alcance.
- **UX**: Mostrar las sugerencias como “opcionales”: el usuario puede aceptar o ignorar; la IA no cambia datos sin confirmación.

Si más adelante quieres priorizar una de estas ideas (por ejemplo “resumen en texto” o “sugerencias por booking”), se puede bajar a flujo concreto y endpoints.
</think>

<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
TodoWrite