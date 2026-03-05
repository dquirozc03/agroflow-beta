/**
 * Office Script para extraer la Base de Datos de Clientes IE
 * Este script devuelve un array 2D con los datos de la hoja activa (ej. Granada)
 */
function main(workbook: ExcelScript.Workbook) {
    const sheet = workbook.getActiveWorksheet();

    // Opción 1: Intentar leer de una tabla si existe
    const tables = sheet.getTables();
    if (tables.length > 0) {
        const table = tables[0];
        const range = table.getRange();
        const values = range.getValues();
        return values;
    }

    // Opción 2: Leer el rango usado si no hay tabla
    const usedRange = sheet.getUsedRange();
    if (usedRange) {
        return usedRange.getValues();
    }

    return [];
}
