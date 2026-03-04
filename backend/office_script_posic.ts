/**
 * Script Automático AgroFlow - RELAY TOTAL (Universal)
 * Este script recibe la fila COMPLETA desde Power Automate como JSON 
 * y la reenvía a AgroFlow sin necesidad de mapear campo por campo.
 */
function main(workbook: ExcelScript.Workbook, jsonData: string) {
    // 1. Configuración de Destino
    const WEBHOOK_URL = "https://agroflow-beta.onrender.com/api/v1/sync/posicionamiento";
    const SYNC_TOKEN = "beta_sync_2026";

    try {
        // 2. Procesamos el JSON recibido de Power Automate
        const data = JSON.parse(jsonData);

        // Si Power Automate manda un objeto único, lo metemos en una lista
        // Si manda una lista, la usamos tal cual
        const payload = Array.isArray(data) ? data : [data];

        // 3. Enviamos a AgroFlow
        fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Sync-Token": SYNC_TOKEN
            },
            body: JSON.stringify(payload)
        });

        console.log("Relay exitoso para AgroFlow");
    } catch (e) {
        console.log("Error al procesar el JSON: " + e.toString());
    }
}
