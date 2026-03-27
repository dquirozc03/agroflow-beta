# 📋 TICKET DE ARQUITECTURA: OCR con Selector de Modo (RUC / Partida / Completo)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** CRÍTICA (Mejora de Precisión en Captura)

---

## 🛑 Objetivo Estructural
Habilitar un **Selector de Modo** directamente dentro de la interfaz del OCR en el `TransportistaModal`. El usuario debe poder elegir explícitamente qué dato desea "inyectar" antes de realizar el escaneo o pegado de imagen.

---

## 🛠️ Plan de Ejecución (Hoja de Ruta de Interfaz)

### 1. Interfaz de Usuario (UI) dentro del OCR
Dentro del `div` de la zona de OCR (`border-dashed`), añade un grupo de botones (Toggle Group) sutil pero claro:
-   **Botón 1:** "Completo" (Icono: `Zap` o `Sparkles`).
-   **Botón 2:** "Solo RUC" (Icono: `Fingerprint`).
-   **Botón 3:** "Solo Partida" (Icono: `ScrollText`).

*Estilo sugerido:* Botones pequeños con fondo `bg-emerald-100` cuando estén activos, para mantener la línea estética de Agroflow.

### 2. Lógica de Filtrado Dinámico
El componente debe mantener un estado `selectedOcrMode` (`'all' | 'ruc' | 'partida'`).

**Implementación en `processOCR`:**
```tsx
const onResult = (data) => {
  setFormData(prev => {
    switch(selectedOcrMode) {
      case 'ruc':
        return { ...prev, ruc: data.ruc || prev.ruc };
      case 'partida':
        return { ...prev, partida_registral: data.partida_registral || prev.partida_registral };
      default:
        // Modo Completo: Comportamiento original
        return { ...prev, ...data };
    }
  });
}
```

### 3. Persistencia de Visual
Asegúrate de que este modo esté disponible tanto en **Creación** como en **Edición** (eliminar la restricción `!editingData`).

---

## ✅ Criterios de Aceptación
1. [ ] El usuario puede ver y seleccionar el "Modo RUC" antes de pegar una imagen.
2. [ ] Si el modo "Solo RUC" está activo, el nombre del transportista **NO** se ve afectado por el escaneo.
3. [ ] El modo por defecto al abrir el modal debe ser "Completo".
4. [ ] La interfaz se mantiene limpia y profesional, integrada en el cuadro de escaneo actual.

---
> **Nota para el Coder:** Esta es una instrucción directa de la arquitectura para resolver el problema de sobreescritura de datos. Favor de usar íconos de Lucide para los botones de modo.
