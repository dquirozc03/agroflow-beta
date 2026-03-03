/**
 * Office Script para enviar la fila activa de Excel Online al Webhook de AgroFlow.
 * Hoja: POSIC
 */
async function main(workbook: ExcelScript.Workbook) {
    const sheet = workbook.getActiveWorksheet();
    const range = workbook.getSelectedRange();
    const row = range.getRow(0); // Tomamos la primera fila seleccionada
    const values = row.getValues()[0];

    // Mapeo manual basado en los encabezados esperados del Excel
    // Ajustar los índices (0, 1, 2...) según la posición real de las columnas en tu Excel
    const data = {
        booking: String(values[0] || ""), // Columna A
        nave: String(values[1] || ""),    // Columna B
        etd: formatDate(values[2]),       // Columna C
        eta: formatDate(values[3]),       // Columna D
        pol: String(values[6] || ""),     // Columna G
        pod: String(values[9] || ""),     // Columna J
        cliente: String(values[8] || ""), // Columna I
        operador_logistico: String(values[14] || ""), // Columna O
        naviera: String(values[15] || ""), // Columna P
        termog: String(values[12] || ""), // Columna M

        // Transformación SI/NO a Boolean
        ac_option: toBool(values[16]),    // Columna Q
        ct_option: toBool(values[17]),    // Columna R
        aforo_planta: toBool(values[11]), // Columna L

        // Otros campos
        cultivo: String(values[21] || ""),
        planta_llenado: String(values[20] || ""),
        total: String(values[26] || ""),
    };

    if (!data.booking || data.booking === "undefined") {
        console.log("Error: No se detectó un Booking en la fila seleccionada.");
        return;
    }

    const webhookUrl = "https://TU-URL-DE-DEV.render.com/api/v1/sync/posicionamiento";
    const syncToken = "TU_SYNC_TOKEN_AQUÍ";

    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Sync-Token": syncToken
        },
        body: JSON.stringify([data])
    });

    if (response.ok) {
        console.log("Sincronización exitosa para Booking: " + data.booking);
    } else {
        console.log("Error en sincronización: " + response.statusText);
    }
}

function toBool(val: any): boolean {
    if (!val) return false;
    const s = String(val).toUpperCase().trim();
    return s === "SI" || s === "S" || s === "YES" || s === "1" || s === "TRUE";
}

function formatDate(excelDate: any): string {
    if (typeof excelDate === "number") {
        // Excel date to JS Date
        const d = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        return d.toISOString();
    }
    return String(excelDate || "");
}
