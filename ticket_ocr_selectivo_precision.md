# 📋 TICKET DE ARQUITECTURA: OCR Selectivo de Precisión (Solo RUC / Solo Partida)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** CRÍTICA (Resolución de defecto de sobreescritura de datos)

---

## 🛑 Objetivo Estructural
Implementar una lógica de **OCR Selectivo** en el `TransportistaModal`. El sistema debe permitir al usuario elegir el destino específico de la extracción para evitar que el OCR sobrescriba accidentalmente campos ya correctos (específicamente el Nombre del Transportista).

---

## 🛠️ Plan de Ejecución (Hoja de Ruta de Precisión)

### 1. Gestión de Estado de Destino (Frontend)
Debes añadir un estado reactivo que controle el "Foco Inteligente" del OCR:
```tsx
const [ocrTarget, setOcrTarget] = useState<'all' | 'ruc' | 'partida' | null>(null);
```

### 2. Disparadores de Campo (Inputs)
Añade íconos de "Chispas" (`Sparkles`) dentro de los inputs de RUC y Partida Registral con las siguientes acciones:
- **Botón en RUC:** Debe ejecutar `setOcrTarget('ruc')` antes de abrir el explorador de archivos o recibir el pegado.
- **Botón en Partida:** Debe ejecutar `setOcrTarget('partida')`.
- **Botón General (Superior):** Debe ejecutar `setOcrTarget('all')`.

### 3. Lógica de Inyección Filtrada (`processOCR`)
Modifica la función que recibe los datos del backend para que aplique el siguiente filtro:

```tsx
// PSEUDOCÓDIGO DE LÓGICA ARQUITECTÓNICA
const onOcrSuccess = (resultData) => {
  setFormData(prev => {
    if (ocrTarget === 'ruc') {
      return { ...prev, ruc: resultData.ruc || prev.ruc };
    } 
    if (ocrTarget === 'partida') {
      return { ...prev, partida_registral: resultData.partida_registral || prev.partida_registral };
    }
    // Si es 'all' o null, mantiene el comportamiento original de llenar todo
    return { ...prev, ...resultData };
  });
  
  // Limpiar target al finalizar
  setOcrTarget(null);
}
```

---

## ✅ Criterios de Aceptación
1. [ ] Al usar el OCR desde el input de **RUC**, el nombre del transportista **NO** cambia.
2. [ ] Al usar el OCR desde el input de **Partida**, solo se puebla ese campo.
3. [ ] El "Scanner General" (arriba) sigue llenando todos los campos para nuevos registros.
4. [ ] Se mantiene el soporte para Pegado (`Ctrl+V`) respetando el target seleccionado.

---
> **Nota para el Coder:** Esta es una mejora crítica de usabilidad solicitada por Inge Daniel. Favor de no alterar el diseño base de los inputs, solo añadir el botón disparador de forma absoluta a la derecha de cada campo.
