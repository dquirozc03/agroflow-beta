# Ticket de Desarrollo: FIX Falso CORS (Colisiones de Unicidad LogiCapture)

## Objetivo
Implementar una capa de higiene de datos y protección transaccional en los endpoints de registro y actualización del módulo LogiCapture, para evitar colisiones de unicidad en bases de datos que causan errores `HTTP 500` (los cuales el navegador enmascara como errores de CORS `net::ERR_FAILED`).

## Tareas a Ejecutar

- [ ] **1. Modificar `update_registro` en`backend/app/routers/logicapture.py`**
  - Ubica la sección de **"Sincronización con LogiCaptureDetalle (Blindaje de Unicidad)"**.
  - Antes de iterar (`for tipo, codigos in mapeo_detalles:`), inicializa un conjunto (Set) en memoria: `codigos_procesados_en_request = set()`.
  - Dentro de la iteración profunda (`for code in codigos:`), aplica higiene al código: `code = code.strip().upper()`.
  - **Lógica Anti-Duplicado Intra-Request:** Verifica si `code` ya existe en `codigos_procesados_en_request`. Si es así, **levanta un `HTTPException(status_code=400)`** indicando: *"Error: El código [código] se ha ingresado varias veces en la misma actualización."*
  - Si no existe, agrégalo al conjunto: `codigos_procesados_en_request.add(code)`.
  - **Manejo de Errores Críticos:** Envuelve el evento final `db.commit()` en un bloque `try...except`. Importa `from sqlalchemy.exc import IntegrityError` si es necesario. En el `except IntegrityError as e:`, haz un `db.rollback()` y levanta un `HTTPException(status_code=400)` indicando *"Error de integridad en base de datos. Se enviaron códigos duplicados."*

- [ ] **2. Modificar `register_logicapture_data` en `backend/app/routers/logicapture.py`**
  - Ubica la sección **"4. Guardar Detalles de Unicidad"**.
  - Aplica exactamente la misma lógica de "Set" en un ciclo, con `code = code.strip().upper()` y validando duplicados de la misma forma descrita en la Tarea 1, antes de crear la instancia `LogiCaptureDetalle`.
  - Al igual que en la Tarea 1, envuelve el último `db.commit()` en un `try...except IntegrityError`.

## Reglas de Codificación (Arquitecto)
1. **NO modifiques lógica de otras partes** del archivo `logicapture.py`.
2. Las listas que se usan para ignorar valores (`ignore_values`) como `**`, `N/A`, etc., deben mantenerse intactas y la comprobación de `not code or code in ignore_values` debe seguir operando, pero haz el `strip().upper()` a `code` *antes* de comparar contra la lista.
3. Prueba levantar el backend localmente usando tu terminal y un comando a elección (ej. `uvicorn main:app`) para comprobar que no existan errores de sintaxis (*SyntaxError*) y que el enrutador cargue.

---
**El Arquitecto aprueba el inicio de codificación. Proceda.**
