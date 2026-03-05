/**
 * Script AgroFlow - Extractor de Asignación de Unidades
 * Este script lee el Excel de Asignación y devuelve los datos a Power Automate.
 */
async function main(workbook: ExcelScript.Workbook): Promise<string[][]> {
    // Intentamos buscar una tabla, si no, leemos el rango usado de la hoja activa
    let payload: string[][] = [];

    const tables = workbook.getTables();
    if (tables.length > 0) {
        const table = tables[0];
        console.log("Usando tabla: " + table.getName());
        const headers = table.getHeaderRowRange().getTexts()[0];
        const rows = table.getRangeBetweenHeaderAndTotal().getTexts();
        payload = [headers, ...rows];
    } else {
        console.log("No hay tablas, leyendo rango usado...");
        const sheet = workbook.getActiveWorksheet();
        const range = sheet.getUsedRange();
        if (range) {
            payload = range.getTexts();
        }
    }

    // Filtrar filas vacías (donde el booking esté vacío)
    payload = payload.filter((row: string[]) => row.length > 0 && row[0].trim() !== "");

    console.log(`Datos capturados: ${payload.length} filas.`);
    return payload;
}
