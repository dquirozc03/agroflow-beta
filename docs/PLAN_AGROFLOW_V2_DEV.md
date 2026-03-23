# Plan Maestro: AGROFLOW V2 (Rama dev)

**Estrategia:** Refactorización Integral con Base de Datos Nueva.
**Objetivo:** Eliminar deuda técnica y preparar el sistema para escalabilidad global (AWS Ready).

---

## 1. Fase de Infraestructura
1.  **Git:** Cambiar a la rama `dev`.
2.  **DB:** Crear una base de datos nueva (ej. `agroflow_dev`).
3.  **Config:** Actualizar las variables de entorno en el panel de desarrollo para apuntar a la nueva raíz.
4.  **Alembic:** Inicializar migraciones desde cero (`alembic init alembic_v2`).

---

## 2. Rediseño del Modelo (Clean Architecture)
Abandonar el modelo "islas de datos". Implementar un núcleo relacional sólido:

### Bloque A: Catálogos (Independientes)
*   **cat_entidades:** Una sola tabla maestra para Transportistas y Clientes (usando tipos).
*   **cat_personal:** Choferes con validación de licencia y vigencia.
*   **cat_vehiculos:** Relaciones estrictas con Transportistas.

### Bloque B: La Referencia Maestra (Unificada)
*   **ope_ordenes_maestras:** Esta tabla será la única fuente de verdad para el sistema. 
*   Contendrá los datos de Booking, Orden Beta, AWB y DAM unificados. No habrá tablas duplicadas de Excel.

### Bloque C: La Operación (LogiCapture V2)
*   **ope_registros_bitacora:** Solo guardará IDs y metadatos operativos (precintos/termógrafos).
*   Se eliminarán las columnas redundantes de texto plano.

---

## 3. Hoja de Ruta del Programador (Sprint 1)

1.  **Crear Modelos Base:** Definir los nuevos modelos SQLAlchemy en la rama `dev`.
2.  **Script de Importación Inteligente:** Crear un script que tome los catálogos actuales de la DB de producción y los "limpie" al pasarlos a la nueva DB de desarrollo.
3.  **Router V2:** Implementar la lógica de creación de registros usando el **Service Layer Pattern** (routers delgados, lógica en servicios).

---

> [!IMPORTANT]
> A partir de ahora, cualquier cambio en la estructura se hará mediante **Migraciones de Alembic**. No se permiten cambios manuales en el esquema de la base de datos de desarrollo.
