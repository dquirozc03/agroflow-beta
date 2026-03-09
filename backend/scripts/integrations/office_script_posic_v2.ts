/**
 * Script AgroFlow v2 - Extractor de Posicionamiento (Versión 100% Compatible)
 * Nombre sugerido: Sincronizar AgroFlow
 */
async function main(workbook: ExcelScript.Workbook, rowDataJson: string) {
    // 1. Definición estricta de la estructura (No se permite 'any')
    interface ExcelRow {
        "STATUS - FCL"?: string;
        "O/BETA (STATUS FINAL)"?: string;
        "PLT. EMPACADORA"?: string;
        "CULTIVO"?: string;
        "BOOKING"?: string;
        "NAVE"?: string;
        "ETD BOOKING"?: string;
        "ETA BOOKING"?: string;
        "WEEK ETA BOOKING"?: string;
        "DIAS TT. BOOKING"?: string | number;
        "ETD FINAL"?: string;
        "ETA FINAL"?: string;
        "WEEK ETA REAL"?: string;
        "DIAS TT. REAL"?: string | number;
        "WEEK DEBE ARRIBAR"?: string;
        "POL"?: string;
        "O/BETA INICIAL"?: string;
        "O/BETA FINAL"?: string;
        "CLIENTE"?: string;
        "RECIBIDOR"?: string;
        "DESTINO (PEDIDO)"?: string;
        "PO"?: string;
        "DESTINO (BOOKING)"?: string;
        "PAIS (BOOKING)"?: string;
        "N° FCL"?: string;
        "DEPOT DE RETIRO"?: string;
        "OPERADOR"?: string;
        "NAVIERA"?: string;
        "TERMOREGISTROS"?: string;
        "AC"?: string;
        "C/T"?: string;
        "VENT"?: string;
        "T°"?: string;
        "HORA SOLICITADA (OPERADOR)"?: string;
        "FECHA REAL DE LLENADO"?: string;
        "WEEK LLENADO"?: string;
        "VARIEDAD"?: string;
        "TIPO DE CAJA"?: string;
        "ETIQUETA CAJA"?: string;
        "PRESENTACIÓN"?: string;
        "CALIBRE"?: string;
        "CJ/KG"?: string;
        "TOTAL"?: string | number;
        "INCOTERM"?: string;
        "FLETE"?: string;
    }

    // 2. Configuración de Entorno Dinámica
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
    const SYNC_TOKEN = "dev_secret_token_2024";

    // 3. Convertir el texto a objeto real con la interfaz definida
    let rowData: ExcelRow;
    try {
        rowData = JSON.parse(rowDataJson) as ExcelRow;
    } catch (e) {
        console.log("Error al procesar los datos de la fila");
        return;
    }

    const bookingId = rowData["BOOKING"] ? String(rowData["BOOKING"]) : "SIN-BOOKING";
    console.log("Sincronizando Booking: " + bookingId);

    // 4. Mapeo de columnas
    const payload = {
        "STATUS - FCL": rowData["STATUS - FCL"],
        "O/BETA (STATUS FINAL)": rowData["O/BETA (STATUS FINAL)"],
        "PLT. EMPACADORA": rowData["PLT. EMPACADORA"],
        "CULTIVO": rowData["CULTIVO"],
        "BOOKING": rowData["BOOKING"],
        "NAVE": rowData["NAVE"],
        "ETD BOOKING": rowData["ETD BOOKING"],
        "ETA BOOKING": rowData["ETA BOOKING"],
        "WEEK ETA BOOKING": rowData["WEEK ETA BOOKING"],
        "DIAS TT. BOOKING": rowData["DIAS TT. BOOKING"],
        "ETD FINAL": rowData["ETD FINAL"],
        "ETA FINAL": rowData["ETA FINAL"],
        "WEEK ETA REAL": rowData["WEEK ETA REAL"],
        "DIAS TT. REAL": rowData["DIAS TT. REAL"],
        "WEEK DEBE ARRIBAR": rowData["WEEK DEBE ARRIBAR"],
        "POL": rowData["POL"],
        "O/BETA INICIAL": rowData["O/BETA INICIAL"],
        "O/BETA FINAL": rowData["O/BETA FINAL"],
        "CLIENTE": rowData["CLIENTE"],
        "RECIBIDOR": rowData["RECIBIDOR"],
        "DESTINO (PEDIDO)": rowData["DESTINO (PEDIDO)"],
        "PO": rowData["PO"],
        "DESTINO (BOOKING)": rowData["DESTINO (BOOKING)"],
        "PAIS (BOOKING)": rowData["PAIS (BOOKING)"],
        "N° FCL": rowData["N° FCL"],
        "DEPOT DE RETIRO": rowData["DEPOT DE RETIRO"],
        "OPERADOR": rowData["OPERADOR"],
        "NAVIERA": rowData["NAVIERA"],
        "TERMOREGISTROS": rowData["TERMOREGISTROS"],
        "AC": rowData["AC"],
        "C/T": rowData["C/T"],
        "VENT": rowData["VENT"],
        "T°": rowData["T°"],
        "HORA SOLICITADA (OPERADOR)": rowData["HORA SOLICITADA (OPERADOR)"],
        "FECHA REAL DE LLENADO": rowData["FECHA REAL DE LLENADO"],
        "WEEK LLENADO": rowData["WEEK LLENADO"],
        "VARIEDAD": rowData["VARIEDAD"],
        "TIPO DE CAJA": rowData["TIPO DE CAJA"],
        "ETIQUETA CAJA": rowData["ETIQUETA CAJA"],
        "PRESENTACIÓN": rowData["PRESENTACIÓN"],
        "CALIBRE": rowData["CALIBRE"],
        "CJ/KG": rowData["CJ/KG"],
        "TOTAL": rowData["TOTAL"],
        "INCOTERM": rowData["INCOTERM"],
        "FLETE": rowData["FLETE"]
    };

    // 5. Envío al servidor
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Sync-Token": SYNC_TOKEN
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("Sincronización exitosa");
        } else {
            console.log("Error servidor");
        }
    } catch (error) {
        console.log("Error de conexión");
    }
}
