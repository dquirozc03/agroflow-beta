# Plan Maestro: LogiCapture Next (V2)

**Estrategia:** Strangler Pattern — coexistencia de V1 y V2.
**Objetivo:** Crear una base de datos profesional y relacional desde cero.

---

## 1. El Nuevo Corazón: La Base de Datos
No modificaremos `ope_registros`. Crearemos una tabla nueva con estándares de alta disponibilidad.

### Tabla: `ope_bitacora_v2`
*   `id`: Primary Key.
*   `uuid`: Identificador único universal (para seguridad y AWS).
*   **Relaciones Reales:**
    *   `reference_id`: FK a una nueva tabla maestra.
    *   `chofer_id`: FK (Obligatorio).
    *   `vehiculo_id`: FK (Obligatorio).
    *   `transportista_id`: FK (Obligatorio).
*   **Datos Operativos:**
    *   `metadata_precintos`: JSONB (Beta, Aduana, Operador, Línea, Senasa).
    *   `metadata_termografos`: JSONB (Lista de códigos).
    *   `booking_alias`: String (Solo para búsqueda rápida).
*   **Control:**
    *   `usuario_creador`: FK a `auth_usuarios`.
    *   `estado`: ENUM (borrador, pendiente, procesado, anulado).
    *   `timestamps`: Creado, Actualizado, Procesado.

---

## 2. Hoja de Ruta para el Programador

### PASO 1: El Modelo V2 (Backend)
1. Crear `backend/app/models/operacion_v2.py`.
2. Crear `backend/app/models/referencias_v2.py` (Esta tabla será la que "absorba" los datos de los 4 Excels y los unifique).

### PASO 2: Router Versionado
1. Crear `backend/app/routers/v2/registros.py`.
2. Implementar los endpoints básicos de creación, pero con validación estricta: **Si el chofer no existe en el catálogo, no se puede crear en V2.**

### PASO 3: El UI "Next" (Frontend)
1. Crear una nueva carpeta `frontend/app/(dashboard)/logicapture-v2/`.
2. Reutilizar el componente `ScannerModal` pero apuntando a la API `/api/v2/`.
3. Agregar un interruptor "Usar versión V2 (Beta)" en el Sidebar.

---

## 3. Por qué esto es mejor
*   **Mantenimiento:** El programador puede borrar código viejo sin miedo una vez que la V2 sea estable.
*   **AWS Ready:** Al usar UUIDs y JSONB, la base de datos está lista para escalar a millones de registros en Amazon RDS.
*   **Datos Limpios:** No habrá más "choferes fantasma" que no están en el catálogo.

---

> [!TIP]
> Empezaremos creando las tablas de la V2. De esta forma, los datos que entren hoy por el sistema viejo siguen ahí, pero lo nuevo que se capture en V2 será "oro puro" para tus reportes.
