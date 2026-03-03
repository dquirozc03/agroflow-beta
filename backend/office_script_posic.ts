const WEBHOOK_URL = "https://tu-servicio-agroflow.onrender.com/api/v1/sync/posicionamiento";
const SYNC_TOKEN = "TU_TOKEN_AQUI"; // Este debe coincidir con el SYNC_TOKEN de tu .env

function main(workbook: ExcelScript.Workbook) {
    const sheet = workbook.getWorksheet("CONTROL");
    if (!sheet) {
        console.log("No se encontró la hoja CONTROL");
        return;
    }

    // Obtenemos la fila de la celda donde está el cursor
    const activeCell = workbook.getActiveCell();
    const rowNum = activeCell.getRowIndex();

    // Los datos empiezan en la fila 10 (índice 9), la 9 son los encabezados
    if (rowNum < 9) {
        console.log("Por favor, selecciona una fila de datos (Fila 10 en adelante)");
        return;
    }

    // Leemos los encabezados (Fila 9) y los valores de la fila actual
    // Usamos un rango amplio para cubrir todas las columnas de la hoja CONTROL
    const headerRange = sheet.getRangeByIndexes(8, 0, 1, 50);
    const dataRange = sheet.getRangeByIndexes(rowNum, 0, 1, 50);

    const headers = headerRange.getValues()[0];
    const values = dataRange.getValues()[0];

    const payload: any = {};

    // Mapeamos dinámicamente: el nombre de la columna será la llave del JSON
    headers.forEach((header, index) => {
        const key = String(header).trim();
        const value = values[index];
        if (key && key !== "undefined") {
            payload[key] = value;
        }
    });

    // Validación básica
    if (!payload["BOOKING"] || payload["BOOKING"] === "") {
        console.log("Error: No se encontró un valor en la columna BOOKING de esta fila.");
        return;
    }

    // Enviamos al backend de AgroFlow
    console.log("Enviando datos a AgroFlow para Booking: " + payload["BOOKING"] + "...");

    fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Sync-Token": SYNC_TOKEN
        },
        body: JSON.stringify([payload])
    });

    console.log("Sincronización enviada correctamente.");
}
