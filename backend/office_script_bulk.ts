/**
 * Script AgroFlow Raw - Sincronización Directa
 * Envía los datos tal cual están en Excel para que el servidor los procese.
 */
async function main(workbook: ExcelScript.Workbook) {
    const TABLE_NAME = "TablaPosicionamiento";
    const WEBHOOK_URL = "https://agroflow-beta.onrender.com/api/v1/sync/posicionamiento/raw";
    const SYNC_TOKEN = "dev_secret_token_2024";

    const table = workbook.getTable(TABLE_NAME);
    if (!table) {
        console.log("No se encontró la tabla: " + TABLE_NAME);
        return;
    }

    // Obtenemos los encabezados y los datos en un solo array 2D
    const headers = table.getHeaderRowRange().getTexts()[0];
    const rows = table.getRangeBetweenHeaderAndTotal().getTexts();

    // Unimos todo: la primera fila serán los encabezados
    const payload = [headers, ...rows];

    console.log(`Enviando tabla completa (${payload.length} filas incluyendo cabecera)...`);

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Sync-Token": SYNC_TOKEN
            },
            body: JSON.stringify(payload)
        });

        const result = await response.text();
        if (response.ok) {
            console.log("Sincronización Raw Exitosa: " + result);
        } else {
            console.log("Error Servidor: " + result);
        }
    } catch (error) {
        console.log("Error de conexión: " + error);
    }
}
