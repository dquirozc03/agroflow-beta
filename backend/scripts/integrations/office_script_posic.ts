/**
 * Script Automático AgroFlow - MÉTODO ANTI-ERROR (Sincrónico/Async)
 * Esta versión usa 'await' para asegurar que los datos lleguen al servidor
 * antes de que el script termine.
 */
async function main(workbook: ExcelScript.Workbook, jsonData: string) {
    const WEBHOOK_URL = "https://agroflow-beta.onrender.com/api/v1/sync/posicionamiento";
    const SYNC_TOKEN = "dev_secret_token_2024";

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
