# Consultas SQL para datos de prueba y cómo probar la edición

## Importante

- **`alembic upgrade head`** solo aplica el *esquema* (crea tablas/columnas). **No inserta datos**. Los datos hay que cargarlos aparte.
- **No pegues este archivo .md** en PostgreSQL: los títulos con `#` dan error de sintaxis. Usa el archivo **`docs/inserts_prueba.sql`**: ábrelo en pgAdmin/DBeaver o ejecútalo con `psql -f docs/inserts_prueba.sql` (desde la raíz del proyecto, conectando a tu base).

## 1. Consultas SQL para insertar datos

Ejecuta el archivo **`docs/inserts_prueba.sql`** en tu cliente PostgreSQL (pgAdmin, DBeaver, o `psql -f`), **después** de haber aplicado las migraciones (`alembic upgrade head`). A continuación se detallan las mismas consultas por si quieres ejecutarlas por partes.

### 1.1 Transportistas (`cat_transportistas`)

```sql
-- Si la tabla está vacía, insertar transportistas de prueba
INSERT INTO cat_transportistas (codigo_sap, ruc, nombre_transportista, partida_registral, estado)
VALUES
  ('SAP001', '20100000001', 'Transportes Alpha S.A.C.', 'PR-001', 'activo'),
  ('SAP002', '20100000002', 'Logística Beta E.I.R.L.', NULL, 'activo'),
  ('SAP003', '20100000003', 'Carga Rápida S.A.', 'PR-003', 'activo')
ON CONFLICT (codigo_sap) DO NOTHING;
```

### 1.2 Choferes (`cat_choferes`)

```sql
-- Choferes para asociar a registros (DNI único)
INSERT INTO cat_choferes (dni, primer_nombre, apellido_paterno, apellido_materno, licencia, estado)
VALUES
  ('12345678', 'Juan', 'Pérez', 'García', 'B2', 'activo'),
  ('87654321', 'María', 'López', 'Sánchez', 'B2', 'activo')
ON CONFLICT (dni) DO NOTHING;
```

### 1.3 Vehículos (`cat_vehiculos`) con transportista

Las configuraciones válidas y peso bruto son: `T3/S3` → 48000 kg, `T3/S2` → 43000 kg, `T3/Se2` → 47000 kg.  
`placas` debe ser único (formato `TRACTO` o `TRACTO/CARRETA`).

```sql
-- Obtener id de un transportista (ajusta el nombre si usaste otros)
-- SELECT id FROM cat_transportistas WHERE codigo_sap = 'SAP001';  -- ej: 1

-- Vehículo 1: tracto ABC-123, carreta XYZ-789 → transportista Alpha
INSERT INTO cat_vehiculos (
  placa_tracto, placa_carreta, placas,
  marca, cert_vehicular,
  largo_tracto, ancho_tracto, alto_tracto,
  largo_carreta, ancho_carreta, alto_carreta,
  configuracion_vehicular, peso_neto_carreta, peso_neto_tracto, peso_bruto_vehicular,
  estado, transportista_id
)
SELECT
  'ABC123', 'XYZ789', 'ABC123/XYZ789',
  'Volvo', 'CERT-001',
  2.60, 2.55, 4.00,
  12.20, 2.55, 2.70,
  'T3/S3', 6500, 8500, 48000,
  'activo', (SELECT id FROM cat_transportistas WHERE codigo_sap = 'SAP001' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM cat_vehiculos WHERE placas = 'ABC123/XYZ789');

-- Vehículo 2: solo tracto DEF-456 → transportista Beta (para probar búsqueda por tracto)
INSERT INTO cat_vehiculos (
  placa_tracto, placa_carreta, placas,
  marca, cert_vehicular,
  largo_tracto, ancho_tracto, alto_tracto,
  largo_carreta, ancho_carreta, alto_carreta,
  configuracion_vehicular, peso_neto_carreta, peso_neto_tracto, peso_bruto_vehicular,
  estado, transportista_id
)
SELECT
  'DEF456', NULL, 'DEF456',
  'Scania', NULL,
  2.60, 2.55, 4.00,
  12.20, 2.55, 2.70,
  'T3/S2', 6000, 8000, 43000,
  'activo', (SELECT id FROM cat_transportistas WHERE codigo_sap = 'SAP002' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM cat_vehiculos WHERE placas = 'DEF456');

-- Vehículo 3: carreta GHI-999 de otro transportista (Carga Rápida) para probar alerta “carreta distinto”
INSERT INTO cat_vehiculos (
  placa_tracto, placa_carreta, placas,
  marca, cert_vehicular,
  largo_tracto, ancho_tracto, alto_tracto,
  largo_carreta, ancho_carreta, alto_carreta,
  configuracion_vehicular, peso_neto_carreta, peso_neto_tracto, peso_bruto_vehicular,
  estado, transportista_id
)
SELECT
  'GHI999', 'GHI999', 'GHI999/GHI999',
  'Mercedes', NULL,
  2.60, 2.55, 4.00,
  12.20, 2.55, 2.70,
  'T3/Se2', 6200, 8200, 47000,
  'activo', (SELECT id FROM cat_transportistas WHERE codigo_sap = 'SAP003' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM cat_vehiculos WHERE placas = 'GHI999/GHI999');
```

Así tendrás:
- **ABC123** (tracto) + **XYZ789** (carreta) → Transportes Alpha.
- **DEF456** (solo tracto) → Logística Beta.
- **GHI999** (tracto y carreta) → Carga Rápida. Si en captura pones tracto **ABC123** y carreta **GHI999**, debe salir la alerta de “placa carreta de otro transportista”.

### 1.4 (Opcional) Un registro procesado para probar Editar

Solo si ya tienes chofer, vehículo y transportista con `id` conocidos:

```sql
-- Ajusta los IDs según tu BD (chofer_id, vehiculo_id, transportista_id)
INSERT INTO ope_registros (
  chofer_id, vehiculo_id, transportista_id,
  estado, booking, o_beta, awb, dam,
  ps_beta, ps_aduana, ps_operador, senasa, ps_linea, senasa_ps_linea,
  termografos, processed_at
)
SELECT
  (SELECT id FROM cat_choferes LIMIT 1),
  (SELECT id FROM cat_vehiculos WHERE placas = 'ABC123/XYZ789' LIMIT 1),
  (SELECT id FROM cat_transportistas WHERE codigo_sap = 'SAP001' LIMIT 1),
  'procesado', 'BKG-TEST-001', 'OB-001', 'AWB-TEST-001', 'DAM-001',
  'PS-B', 'PS-A', '**', '*', 'PS-L', 'SENASA-PS',
  'OK', NOW()
WHERE EXISTS (SELECT 1 FROM cat_choferes LIMIT 1)
  AND EXISTS (SELECT 1 FROM cat_vehiculos WHERE placas = 'ABC123/XYZ789')
  AND EXISTS (SELECT 1 FROM cat_transportistas WHERE codigo_sap = 'SAP001');
```

Si prefieres marcar como procesado un registro que ya existe:

```sql
UPDATE ope_registros
SET estado = 'procesado', processed_at = NOW()
WHERE id = <ID_DEL_REGISTRO>;
```

---

## 2. Cómo probar la autorización para Editar

La edición de registros (botón **Editar** en Bandeja SAP y endpoint `PATCH .../editar`) está controlada por **rol**: solo usuarios con rol **admin** o **editor** pueden editar.

### 2.1 Dónde se define el “rol”

- **Frontend**: la variable de entorno **`NEXT_PUBLIC_USER_ROLE`**.
  - Si es `admin` o `editor` → se muestra el botón Editar y las peticiones de edición envían el header **`X-User-Role`** con ese valor.
  - Cualquier otro valor (o vacío) → no se muestra el botón y, si aun así se llama al API, el backend responde **403**.
- **Backend**: el endpoint `PATCH /api/v1/registros/{id}/editar` exige el header **`X-User-Role: admin`** o **`X-User-Role: editor`**. Si no viene o es otro valor, responde **403** con mensaje tipo *"Sin permiso para editar. Se requiere rol admin o editor."*.

### 2.2 Pruebas en la interfaz (frontend)

1. **Sin rol (no puede editar)**  
   - En el frontend (Next.js), asegúrate de **no** tener `NEXT_PUBLIC_USER_ROLE` o tenerla vacía (o distinta de `admin`/`editor`).  
   - Reinicia el servidor de desarrollo si cambias el `.env`.  
   - Entra a **Bandeja SAP** → pestaña **Procesados**.  
   - **Comprobación**: no debe aparecer el botón **Editar** en los registros.

2. **Con rol editor o admin (sí puede editar)**  
   - En el `.env` del frontend (por ejemplo `frontend/.env.local`) pon:
     ```env
     NEXT_PUBLIC_USER_ROLE=editor
     ```
     o `admin`.  
   - Reinicia el servidor de desarrollo.  
   - Entra de nuevo a **Bandeja SAP** → **Procesados**.  
   - **Comprobación**: debe aparecer el botón **Editar**. Al usarlo, el diálogo de edición debe abrirse y al guardar la petición debe ir con header `X-User-Role: editor` (o `admin`) y completarse correctamente.

### 2.3 Pruebas directas al API (backend)

Con un registro en estado **procesado** (por ejemplo el que creaste en la sección 1.4):

**A) Sin header → debe dar 403**

```bash
curl -X PATCH "http://127.0.0.1:8000/api/v1/registros/1/editar" \
  -H "Content-Type: application/json" \
  -d "{\"campo\": \"booking\", \"data\": {\"booking\": \"BKG-NUEVO\"}, \"motivo\": null}"
```

Respuesta esperada: **403** y mensaje de que se requiere rol admin o editor.

**B) Con header `X-User-Role: viewer` → debe dar 403**

```bash
curl -X PATCH "http://127.0.0.1:8000/api/v1/registros/1/editar" \
  -H "Content-Type: application/json" \
  -H "X-User-Role: viewer" \
  -d "{\"campo\": \"booking\", \"data\": {\"booking\": \"BKG-NUEVO\"}, \"motivo\": null}"
```

Respuesta esperada: **403**.

**C) Con header `X-User-Role: editor` (o `admin`) → debe aceptar la edición**

```bash
curl -X PATCH "http://127.0.0.1:8000/api/v1/registros/1/editar" \
  -H "Content-Type: application/json" \
  -H "X-User-Role: editor" \
  -d "{\"campo\": \"booking\", \"data\": {\"booking\": \"BKG-EDITADO\"}, \"motivo\": null}"
```

Respuesta esperada: **200** y el registro con el campo actualizado (según la respuesta que devuelva tu API).

Sustituye `1` por el `id` real del registro procesado y la URL base si tu backend corre en otro puerto/host.

### 2.4 Resumen de pruebas

| Prueba | NEXT_PUBLIC_USER_ROLE | Header X-User-Role | Botón Editar | PATCH /editar |
|--------|------------------------|--------------------|--------------|----------------|
| Sin permiso | vacío / otro | no enviado / otro | No | 403 |
| Con permiso | `editor` o `admin` | `editor` o `admin` | Sí | 200 |

Con esto puedes validar tanto la UI como el backend para la autorización de edición.
