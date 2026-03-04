/**
 * Script Automático AgroFlow - CONTROL TOTAL (28 Columnas)
 * Este script es invisible para el usuario y se ejecuta vía Power Automate.
 */
function main(
    workbook: ExcelScript.Workbook,
    booking: string, b_limpio: string, nave: string, status: string, beta_final: string,
    planta: string, cultivo: string, etd_b: string, eta_b: string, wk_eta_b: string,
    tt_b: number, etd_f: string, eta_f: string, wk_eta_r: string, tt_r: number,
    wk_arribar: string, pol: string, beta_i: string, beta_c1: string, mot_c1: string,
    beta_c2: string, mot_c2: string, area: string, det: string, dep: string,
    nro_cont: string, tipo_cont: string, awb: string
) {
    const WEBHOOK_URL = "https://agroflow-beta.onrender.com/api/v1/sync/posicionamiento";
    const SYNC_TOKEN = "beta_sync_2026";

    // Mapeamos EXACTAMENTE como lo espera el servidor
    const payload = [{
        "BOOKING": booking,
        "BOOKING LIMPIO": b_limpio,
        "NAVE": nave,
        "Semaforización": status,
        "O/BETA FINAL": beta_final, // CORREGIDO: Usando el campo con el valor real de la Beta
        "PLANTA EMPACADORA": planta,
        "CULTIVO": cultivo,
        "ETD (BOOKING)": etd_b,
        "ETA (BOOKING)": eta_b,
        "WEEK ETA (BOOKING)": wk_eta_b,
        "DIAS TT (BOOKING)": tt_b,
        "ETD FINAL": etd_f,
        "ETA FINAL": eta_f,
        "WEEK ETA REAL": wk_eta_r,
        "DIAS TT REAL": tt_r,
        "WEEK DEBE ARRIBAR": wk_arribar,
        "POL": pol,
        "O/BETA INICIAL": beta_i,
        "O/BETA CAMBIO 1": beta_c1,
        "MOTIVO CAMBIO 1": mot_c1,
        "O/BETA CAMBIO 2": beta_c2,
        "MOTIVO CAMBIO 2": mot_c2,
        "AREA RESPONSABLE": area,
        "DETALLE ADICIONAL": det,
        "DEPOSITO VACIO": dep,
        "NRO CONTENEDOR": nro_cont,
        "TIPO CONTENEDOR": tipo_cont,
        "AWB": awb
    }];

    // Envío profesional a AgroFlow
    fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Sync-Token": SYNC_TOKEN
        },
        body: JSON.stringify(payload)
    });

    console.log("Sincronización automática completa enviada para: " + booking);
}
