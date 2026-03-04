/**
 * Script AgroFlow Raw - Sincronización Directa
 * Envía los datos tal cual están en Excel para que el servidor los procese.
 */
async function main(workbook: ExcelScript.Workbook) {
    const TABLE_NAME = "TablaControlPosicionamiento";
    const WEBHOOK_URL = "https://agroflow-beta.onrender.com/api/v1/sync/posicionamiento/raw";
    const SYNC_TOKEN = "dev_secret_token_2024";

    let payload: string[][] = [];

    // Intento 1: Buscar por Tabla (Lo ideal)
    const table = workbook.getTable(TABLE_NAME);
    if (table) {
        console.log("Tabla encontrada: " + TABLE_NAME);
        const headers = table.getHeaderRowRange().getTexts()[0];
        const rows = table.getRangeBetweenHeaderAndTotal().getTexts();
        payload = [headers, ...rows];
    } else {
        console.log("No se encontró la tabla: " + TABLE_NAME + ". Intentando leer rango directo...");

        // Intento 2: Buscar por Hoja Activa (Desde la fila 9 donde están tus cabeceras)
        const sheet = workbook.getActiveWorksheet();

        // Leemos desde la fila 9 (cabeceras) hasta el final de los datos
        const range = sheet.getRange("9:500"); // Rango amplio
        const texts = range.getTexts();

        // Filtramos para quitar filas totalmente vacías
        payload = texts.filter(row => row.some(cell => cell.trim() !== ""));

        if (payload.length > 0) {
            console.log("Datos leídos correctamente desde el rango de la hoja: " + sheet.getName());
        }
    }

    if (payload.length < 2) {
        console.log("Error: No se encontraron datos suficientes (se necesita cabecera y datos).");
        return;
    }

    console.log(`Enviando ${payload.length} filas al servidor (incluyendo cabecera)...`);

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
