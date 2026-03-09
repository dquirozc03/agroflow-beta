/**
 * Script Automático AgroFlow - MÉTODO ANTI-ERROR (Sincrónico/Async)
 * Esta versión usa 'await' para asegurar que los datos lleguen al servidor
 * antes de que el script termine.
 */
async function main(workbook: ExcelScript.Workbook, jsonData: string) {
    // Configuración de Entorno Dinámica
    const envSheet = workbook.getWorksheet("CONFIG");
    let baseUrl = "https://agroflow-api.onrender.com"; // URL DE PRODUCCIÓN
    
    if (envSheet) {
        const envValue = envSheet.getRange("B1").getValue()?.toString().trim().toUpperCase();
        if (envValue === "DEV") {
            baseUrl = "http://TU_URL_DE_DEV_O_LOCAL.com"; // Cambiar por tu URL de pruebas
            console.log("Modo DESARROLLO (DEV) activo");
        }
    }

    const WEBHOOK_URL = `${baseUrl}/api/v1/sync/posicionamiento`;
    const SYNC_TOKEN = "TU_TOKEN_DE_RENDER_AQUI";

    if (!jsonData || jsonData.trim() === "") {
        console.log("No hay datos para enviar");
        return;
    }

    try {
        // Si el texto no empieza con "[", lo rodeamos de corchetes para que sea una lista
        const finalPayload = jsonData.trim().startsWith("[") ? jsonData : "[" + jsonData + "]";

        console.log("Enviando datos a AgroFlow...");

        // IMPORTANTE: Agregamos 'await' y guardamos la respuesta
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Sync-Token": SYNC_TOKEN
            },
            body: finalPayload
        });

        if (response.ok) {
            const resJson = await response.json();
            console.log("Sincronización exitosa: " + JSON.stringify(resJson));
        } else {
            const errText = await response.text();
            console.log("Error del servidor: " + response.status + " - " + errText);
        }

    } catch (e) {
        console.log("Error de red o de ejecución: " + e.toString());
    }
}
