/**
 * AGROFLOW - PUENTE DE SINCRONIZACIÓN (Google Apps Script)
 * Este script reenvía datos de GSheets a Render de forma ilimitada.
 */
const RENDER_URL = "https://agroflow-beta.onrender.com/api/v1/sync/posicionamiento";
const SYNC_TOKEN = "dev_secret_token_2024";

function syncToAgroFlow() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return; // Solo encabezados

    const headers = data[0];
    const rowsToSync = [];

    // Empezamos desde la fila 2 (índice 1)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const item = {};
        headers.forEach((header, index) => {
            item[header] = row[index];
        });
        rowsToSync.push(item);
    }

    if (rowsToSync.length === 0) return;

    const options = {
        method: "post",
        contentType: "application/json",
        headers: { "X-Sync-Token": SYNC_TOKEN },
        payload: JSON.stringify(rowsToSync),
        muteHttpExceptions: true
    };

    try {
        const response = UrlFetchApp.fetch(RENDER_URL, options);
        const code = response.getResponseCode();

        if (code === 200) {
            console.log("Sincronización Exitosa: " + rowsToSync.length + " filas.");
            // Opcional: Limpiar la hoja después de sincronizar para no repetir datos
            if (sheet.getLastRow() > 1) {
                sheet.deleteRows(2, sheet.getLastRow() - 1);
            }
        } else {
            console.log("Error en Render: " + response.getContentText());
        }
    } catch (e) {
        console.log("Error de Conexión: " + e.toString());
    }
}
