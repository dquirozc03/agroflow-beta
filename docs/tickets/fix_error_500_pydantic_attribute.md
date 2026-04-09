# Ticket de Desarrollo: FIX Error 500 y CORS por Pydantic Attributes

## Objetivo
Solucionar el colapso crítico del backend (Error 500) y su consecuente error CORS en la operación de `update_registro` producido al intentar acceder a propiedades indefinidas (`req.planta` y `req.cultivo`) dentro del objeto de petición en FastAPI.

## Diagnóstico Técnico
Al actualizar un registro, el controlador (`logicapture.py` línea 559) intenta sincronizar las variables `planta` y `cultivo` asumiendo que vienen en el payload (request). Sin embargo, el DTO (`LogiCaptureUpdateRequest`) no declara estas dos propiedades. Esto causa una excepción de tipo `AttributeError` a nivel de aplicación nativa, lo cual rompe FastAPI y evita que el middleware de CORS pueda adjuntar las cabeceras a la respuesta del servidor.

## Tareas a Ejecutar

- [ ] **1. Modificar `LogiCaptureUpdateRequest` en `backend/app/routers/logicapture.py`:**
  - Ve hacia las primeras líneas del archivo donde se definen las clases (models) de Pydantic.
  - Ubica la clase `LogiCaptureUpdateRequest`.
  - Agrega (como opcionales) hacia el final de la clase, las siguientes propiedades:
    ```python
    planta: Optional[str] = None
    cultivo: Optional[str] = None
    ```

## Reglas de Codificación (Arquitecto)
1. Solo modifica la definición de la clase `LogiCaptureUpdateRequest`. No vayas a modificar las otras clases base u operaciones transaccionales.
2. Levanta el servidor local (`uvicorn app.main:app`) antes de hacer commit para asegurarte de que FastAPI compila correctamente los esquemas de Pydantic.

---
**El Arquitecto aprueba el inicio de codificación. Proceda.**
