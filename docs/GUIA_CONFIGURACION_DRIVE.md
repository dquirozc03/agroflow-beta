# Guía de Configuración: Sincronización Profesional con Google Drive

Para una gestión ordenada, usaremos un flujo de 4 carpetas que moverá los archivos automáticamente según el resultado del procesamiento.

## 1. Preparar la Estructura en Drive
Crea 4 carpetas dentro de tu Google Drive para el módulo logístico:
1. `01_Entrada`: Donde subirás los nuevos XMLs.
2. `02_Procesados`: Donde el sistema moverá los archivos cargados con éxito.
3. `03_Errores`: Donde irán los archivos que tengan algún problema de datos o red.
4. `04_CDRs`: Donde se guardarán las respuestas de SUNAT (ApplicationResponse) que el sistema detecta e ignora.

**IMPORTANTE:** Copia el ID de cada una de estas 4 carpetas (lo sacas de la URL de Drive al abrirlas).

## 2. Configurar el Script (Google Apps Script)
1. Ve a [script.google.com](https://script.google.com) o crea un script nuevo dentro de tu carpeta principal.
2. Borra todo el código y pega el contenido de: `backend/apps_script_drive_webhook.js`.
3. **Modifica las constantes** al inicio del script con los IDs que copiaste:
   - `FOLDER_ENTRADA_ID`: ID de la carpeta 01_Entrada.
   - `FOLDER_PROCESADOS_ID`: ID de la carpeta 02_Procesados.
   - `FOLDER_ERRORES_ID`: ID de la carpeta 03_Errores.
   - `FOLDER_CDRS_ID`: ID de la carpeta 04_CDRs.
   - `WEBHOOK_URL`: Usa esta URL: `https://agroflow-api.onrender.com/api/v1/agroflow/webhook/factura`

## 3. Crear el Activador Automático (Trigger)
1. En el panel izquierdo de Apps Script, haz clic en el icono del **Reloj (Activadores)**.
2. Haz clic en **"+ Añadir activador"**.
3. Configuración:
   - Función: `procesarArchivosNuevos`
   - Fuente: `Según tiempo`
   - Tipo: `Temporizador de minutos`
   - Intervalo: `Cada minuto`
4. Guarda y acepta los permisos de Google Drive.

## 4. Flujo de Trabajo
1. **Subida:** Sueltas tus XMLs en `01_Entrada`.
2. **Proceso:** El sistema los lee cada minuto.
3. **Resultado:** Verás cómo los archivos desaparecen de `Entrada` y aparecen automáticamente en `Procesados` (si todo salió OK) o en `Errores` (si falta algún dato de BETA, por ejemplo).
4. **Visibilidad:** Refresca el sistema AgroFlow para ver la data extraída de los archivos exitosos.

---
> [!TIP]
> Si quieres forzar el proceso sin esperar el minuto, puedes darle al botón **"Ejecutar"** desde el editor de código del Google Apps Script.
