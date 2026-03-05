/**
 * Script AgroFlow - Extractor de Datos
 * Este script lee la tabla y devuelve los datos a Power Automate.
 */
async function main(workbook: ExcelScript.Workbook): Promise<string[][]> {
    const TABLE_NAME = "TablaControlPosicionamiento";
    let payload: string[][] = [];

    const table = workbook.getTable(TABLE_NAME);
    if (table) {
        console.log("Tabla encontrada: " + TABLE_NAME);
        const headers = table.getHeaderRowRange().getTexts()[0];
        const rows = table.getRangeBetweenHeaderAndTotal().getTexts();
        payload = [headers, ...rows];
    } else {
        console.log("Tabla no encontrada, leyendo rango de la fila 9...");
        const sheet = workbook.getActiveWorksheet();
        const range = sheet.getRange("9:500");
        const texts = range.getTexts();
        payload = texts.filter((row: string[]) => row.some((cellValue: string) => cellValue.trim() !== ""));
    }

    console.log(`Datos capturados: ${payload.length} filas.`);
    return payload;
}
