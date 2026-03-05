/**
 * Office Script para extraer la Base de Datos de Clientes IE (Hoja Granada)
 * Este script devuelve un array 2D con los datos de la tabla 'TablaGranada'
 */
function main(workbook: ExcelScript.Workbook) {
    // 1. Intentar obtener la hoja 'Granada'
    const sheet = workbook.getWorksheet("Granada");
    if (!sheet) {
        throw new Error("No se encontró la hoja llamada 'Granada'");
    }

    // 2. Intentar leer de la tabla 'TablaGranada'
    const table = sheet.getTable("TablaGranada");
    if (table) {
        const range = table.getRange();
        const values = range.getValues();
        return values;
    }

    // 3. Fallback: Leer el rango usado si no hay tabla
    const usedRange = sheet.getUsedRange();
    if (usedRange) {
        return usedRange.getValues();
    }

    return [];
}
