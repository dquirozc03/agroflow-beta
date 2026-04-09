# 🐛 TICKET: Optimización Módulo Instrucciones de Embarque
**Estado:** PENDIENTE
**Módulo:** Instrucciones de Embarque (IE)
**Responsable:** Programador

## 🎯 Objetivo
Resolver tres problemas clave reportados por Operaciones:
1. Problema de carga de datos cuando el Booking seleccionado no ha hecho "match" en la BD.
2. Añadir herramienta visual (leyenda/tooltip nativo de HTML) para los textos que son muy largos y se cortan en la UI.
3. Asegurar que el formato de generación del PDF preserve los saltos de línea (`\n` hacia `<br/>` en reportlab) y renombrar los archivos con el estándar `IE_{ORDEN_BETA}.pdf`.

---

## 🛠 Tareas - Frontend (`frontend/app/operaciones/instrucciones/page.tsx`)

### Tarea 1: Leyenda para Textos Largos (Tooltips)
1. Ubica la sección del JSX en el Grid `md:grid-cols-4` (línea ~435) done se mapean las métricas como `[ { label: 'Booking', val... }, ...]`.
2. En el `<div>` que sirve de contenedor visual del dato (clase `bg-slate-50/80 border rounded-2xl...`), agrega el atributo HTML nativo `title={f.val}`.
3. Asegúrate de que el texto interior de `f.val` tenga la clase de Tailwind `truncate` (ya la debería tener) para no solaparse y que solo se revele al colocar el mouse (`hover`).

### Tarea 2: Solución al Fallo de Pre-Carga de Variables
1. En la función asíncrona `handleBookingSelect` (línea ~172), localiza el bloque `catch / else` donde se mockea o pre-completa la data si da 404 el match:
```typescript
      } else {
        setLookupData({
          booking: bookingId,
          cliente_nombre: b.CLIENTE || b.cliente || "POR DEFINIR",
          cultivo: b.CULTIVO || b.cultivo || "PENDIENTE",
          orden_beta: b.ORDEN_BETA || b.orden_beta || "PENDIENTE",
          warning: "BOOKING_NO_ENCONTRADO_EN_SISTEMA"
        });
      }
```
> *Asegúrate de acceder también por nombres de atributos en mayúscula (`b.CLIENTE`, `b.CULTIVO`) debido a cómo está retornando el /sync/posicionamiento.*

### Tarea 3: Archivo `a.download` Modo Custom
1. En `handleGenerateOverridePdf` (línea ~255), localiza el flujo de creación de `blob` cuando se da clic en "Generar IE con Cambios".
2. Sustituir `a.download = \`IE_CUSTOM_${overrideForm.booking}.pdf\`;` por `a.download = \`IE_${overrideForm.orden_beta}.pdf\`;`.

---

## ⚙️ Tareas - Backend (`backend/app/...`)

### Tarea 4: Mantener los saltos de línea (pdf_service.py)
1. Edita `backend/app/services/pdf_service.py`. En la clase `InstructionPDFService`, crea en su interior un pequeño helper superior a `generate_instruction_pdf`:
```python
    def _format_multiline(self, text: str) -> str:
        if not text: return ""
        return text.replace('\n', '<br/>')
```
2. Aplícalo a los textos problemáticos del `override_data` ANTES de incluirlos al PDF para que ReportLab respete sus retornos de carro:
```python
        direccion_notify = self._format_multiline(override_data.get("direccion_notify", ""))
        consignatario_fito = self._format_multiline(override_data.get("consignatario_fito", ""))
        direccion_fito = self._format_multiline(override_data.get("direccion_fito", ""))
        observaciones_final = self._format_multiline(override_data.get("observaciones", "..."))
        direccion_consignatario = self._format_multiline(override_data.get("direccion_consignatario", ""))
        notify_bl = self._format_multiline(override_data.get("notify_bl", ""))
```

### Tarea 5: Forzar Nombre por Defecto `routers/instrucciones.py`
1. Revisa `backend/app/routers/instrucciones.py` en el endpoint `@router.post("/generate-pdf")` ~linea 253.
2. Ajusta la lógica de retorno del `StreamingResponse`:
```python
        orden_beta = pdf_data.get("orden_beta")
        # Asegurarnos de que no esté en blanco, falso, y priorizarlo
        if orden_beta and str(orden_beta).strip() and str(orden_beta).upper() != "PENDIENTE":
            filename = f"IE_{orden_beta}.pdf"
        elif str(orden_beta).strip().upper() == "PENDIENTE":
            filename = f"IE_PENDIENTE.pdf"
        else:
            filename = f"IE_{req.booking}.pdf"
```
3. En `@router.post("/generate-pdf-override")`, quita el hardcode de _CUSTOM_ de:
`filename = f"IE_CUSTOM_{req.booking}.pdf"` => `filename = f"IE_{req.orden_beta}.pdf"`


**Nota Importante:** NO avanzar sin confirmar todos estos puntos con un build correcto.
