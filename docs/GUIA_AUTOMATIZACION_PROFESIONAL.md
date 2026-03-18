# Guía de Automatización Profesional: AgroFlow (Hoja CONTROL)

Esta es la configuración definitiva para sincronizar las **70+ columnas** del Excel de Posicionamiento con AgroFlow de forma **totalmente automática, gratuita (sin Premium) e invisible**.

## 1. El Script "Relay" (Motor de Datos)
Para no tener que mapear 70 cajitas en Power Automate, usaremos un script que actúa como un "puente".

1. En su Excel Online, vaya a la pestaña **Automatizar** -> **Nuevo script**.
2. Guarde el script como `SincronizadorAgroFlow` con este código:

```typescript
/**
 * Script Automático AgroFlow - RELAY TOTAL (Universal)
 */
function main(workbook: ExcelScript.Workbook, jsonData: string) {
  const WEBHOOK_URL = "https://agroflow-beta.onrender.com/api/v1/sync/posicionamiento";
  const SYNC_TOKEN = "beta_sync_2026"; 
  
  try {
    const data = JSON.parse(jsonData);
    const payload = Array.isArray(data) ? data : [data];

    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "X-Sync-Token": SYNC_TOKEN 
      },
      body: JSON.stringify(payload)
    });
    console.log("Relay exitoso");
  } catch (e) {
    console.log("Error: " + e.toString());
  }
}
```

## 2. Power Automate (Configuración Express)

### Paso A: Enumerar filas
1. Use la acción: **Excel Online - Enumerar las filas presentes en una tabla**.
2. **Formato de fecha**: Seleccione `ISO 8601` en los parámetros avanzados.

### Paso B: El Bucle y el Envío
1. Agregue un **Aplicar a cada uno** (*Apply to each*) usando el `value` de Excel.
2. Dentro, agregue la acción: **Excel Online - Ejecutar script** (*Run script*).
3. **Parámetros**:
   - **Script**: Seleccione `SincronizadorAgroFlow`.
   - **jsonData**: Haga clic en el campo, vaya a la pestaña **Expresión** y escriba esto exactamente:
     `string(items('Aplicar_a_cada_uno'))`

## 3. ¿Por qué este método es el mejor?
- **Automático**: Se ejecuta solo según la programación que elija (ej: cada 1 minuto).
- **Gratis**: Usa el conector de Excel estándar, ahorrando el costo de la licencia Premium.
- **Cobertura Total**: El sistema captura las 70 columnas (Booking, Nave, Incoterm, FECHA VGM, etc.) automáticamente.
- **Invisible**: No interrumpe el trabajo de los posicionadores.

---
> [!TIP]
> **Dato Técnico**: Hemos expandido la base de datos de AgroFlow para que tenga nombres internos para cada una de las 70 columnas. Al enviar la fila completa, el sistema las organiza y guarda por usted.
