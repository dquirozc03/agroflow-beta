/**
 * SCRIPT PARA GOOGLE DRIVE - FLUJO DE 4 CARPETAS (AGROFLOW)
 * 
 * ESTRUCTURA:
 * 1. 01_Entrada_XML: Coloca aquí los XML nuevos.
 * 2. 02_Procesados: Aquí irán los enviados con éxito al sistema.
 * 3. 03_Errores_o_Advertencias: Aquí irán los que fallen (error de red o datos inválidos).
 * 4. 04_Basura_CDRs: Aquí irán las respuestas de SUNAT (ApplicationResponse) que el sistema ignora.
 */

const FOLDER_ENTRADA_ID = "ID_CARPETA_ENTRADA";
const FOLDER_PROCESADOS_ID = "ID_CARPETA_PROCESADOS";
const FOLDER_ERRORES_ID = "ID_CARPETA_ERRORES";
const FOLDER_CDRS_ID = "ID_CARPETA_CDRS";

const WEBHOOK_URL = "https://agroflow-api.onrender.com/api/v1/agroflow/webhook/factura";

function procesarArchivosNuevos() {
    const entrada = DriveApp.getFolderById(FOLDER_ENTRADA_ID);
    const procesados = DriveApp.getFolderById(FOLDER_PROCESADOS_ID);
    const errores = DriveApp.getFolderById(FOLDER_ERRORES_ID);
    const cdrsFolders = DriveApp.getFolderById(FOLDER_CDRS_ID);

    const files = entrada.getFiles();

    while (files.hasNext()) {
        const file = files.next();
        const fileName = file.getName();

        // Solo procesar XML
        if (!fileName.toLowerCase().endsWith(".xml")) continue;

        const xmlContent = file.getBlob().getDataAsString("utf-8");
        let destinationFolder = errores; // Por defecto a errores si algo falla

        try {
            const response = UrlFetchApp.fetch(WEBHOOK_URL, {
                method: "post",
                contentType: "application/xml",
                payload: xmlContent,
                muteHttpExceptions: true
            });

            const code = response.getResponseCode();
            const bodyText = response.getContentText();
            let body = {};

            try {
                body = JSON.parse(bodyText);
            } catch (e) {
                console.error("No se pudo parsear respuesta: " + bodyText);
            }

            if (code === 200 || code === 201) {
                if (body.status === "ignored") {
                    destinationFolder = cdrsFolders;
                    console.log("CDR detectado y movido: " + fileName);
                } else if (body.status === "success" || body.status === "duplicated") {
                    destinationFolder = procesados;
                    console.log("Procesado con éxito: " + fileName);
                } else {
                    destinationFolder = errores;
                    console.warn("Estado desconocido en 200: " + body.status);
                }
            } else {
                destinationFolder = errores;
                console.error("Error servidor (" + code + "): " + bodyText);
            }

        } catch (e) {
            destinationFolder = errores;
            console.error("Error de red/script: " + e.toString());
        }

        // Mover el archivo a su carpeta de destino
        file.moveTo(destinationFolder);
        // Opcional: añadir log en la descripción del archivo
        file.setDescription("Resultado: " + new Date().toLocaleString());
    }
}
