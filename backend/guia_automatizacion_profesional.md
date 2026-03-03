# Guía de Automatización: Excel Online (CONTROL) ↔ AgroFlow

Esta guía detalla cómo configurar la sincronización **totalmente automática** entre la hoja **CONTROL** de su Excel de Posicionamiento y el sistema AgroFlow.

## 1. Preparar el Excel (Hoja CONTROL)
- **Hoja**: Asegúrese de que el nombre de la hoja sea `CONTROL`.
- **Encabezados**: Verifique que los encabezados estén en la **Fila 9**. El sistema espera nombres exactos como `BOOKING`, `O/BETA (STATUS FINAL)`, `Semaforización`, etc.
- **Tabla**: Seleccione el rango de datos (desde la fila 9 hacia abajo) e insértelo como una **Tabla de Excel** (Ctrl + T). Póngale un nombre claro como `TablaControl`.

## 2. Configurar Power Automate (Flujo de Nube)

### Paso A: El Disparador
1. Cree un flujo **Automatizado de nube**.
2. Trigger: **Excel Online (Business) - When a row is modified**.
3. Seleccione su Archivo y la Tabla (`TablaControl`).

### Paso B: Análisis de Datos (Parse JSON)
1. Agregue la acción **Parse JSON**.
2. **Content**: Seleccione el cuerpo dinámico de la fila de Excel (el `body` de la respuesta).
3. **Schema**: Copie y pegue el contenido completo de este archivo: [power_automate_schema_control.json](file:///d:/PROJECTS/BETA/BETA%20LogiCapture%201.0/backend/power_automate_schema_control.json).

### Paso C: Mapeo y Envío (HTTP)
1. Agregue la acción **HTTP**.
2. **Method**: `POST`.
3. **URI**: `https://tu-servicio-agroflow.onrender.com/api/v1/sync/posicionamiento`.
4. **Headers**:
   - `Content-Type`: `application/json`
   - `X-Sync-Token`: El token que configuramos en su `.env`.
5. **Body**: Aquí es donde mapeamos los encabezados de Excel a los objetos del sistema. Copie este formato:
   ```json
   [
     {
       "BOOKING": "@{body('Parse_JSON')?['BOOKING']}",
       "O/BETA (STATUS FINAL)": "@{body('Parse_JSON')?['O/BETA (STATUS FINAL)']}",
       "Semaforización": "@{body('Parse_JSON')?['Semaforización']}",
       "NAVE": "@{body('Parse_JSON')?['NAVE']}",
       "PLANTA EMPACADORA": "@{body('Parse_JSON')?['PLANTA EMPACADORA']}",
       "CULTIVO": "@{body('Parse_JSON')?['CULTIVO']}",
       "AWB": "@{body('Parse_JSON')?['AWB']}"
     }
   ]
   ```
   *(Puede añadir más columnas siguiendo la misma lógica del esquema).*

---

## 3. Pruebas y Validación
1. Modifique una celda en la hoja **CONTROL** de su Excel.
2. Espere unos segundos (Power Automate tiene un breve retraso).
3. Entre a **AgroFlow** y escriba el Booking en Logicapture.
4. Presione **Autocompletar**. Verá que la **Orden Beta Final** se llena automáticamente.

> [!IMPORTANT]
> **Seguridad**: Nunca comparta el `X-Sync-Token` fuera de su flujo de Power Automate. Este token es la llave que permite a Excel escribir en su base de datos.
