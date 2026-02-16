# Migración y asociar transportista a vehículos

## 1. ¿Las migraciones ya se ejecutaron?

No hasta que ejecutes Alembic. Para aplicar **todas** las migraciones (incluida la que agrega `transportista_id` a `cat_vehiculos`):

```bash
cd backend
alembic upgrade head
```

Desde la raíz del repo (donde está la carpeta `backend`):

```bash
cd "d:\PROJECTS\BETA\BETA LogiCapture 1.0\backend"
alembic upgrade head
```

Si algo falla, revisa que la base esté levantada y que `backend/.env` (o `.env.local`) tenga la variable `DATABASE_URL` correcta para tu PostgreSQL.

Para ver en qué revisión estás:

```bash
alembic current
```

Deberías ver algo como `a1b2c3d4e5f6 (head)` después de aplicar.

---

## 2. Cómo asociar un transportista a un vehículo

Tienes tres opciones.

### Opción A: Por API (PATCH)

Hay un endpoint para asociar/desasociar transportista a un vehículo:

```http
PATCH /api/v1/vehiculos/{id_vehiculo}/transportista
Content-Type: application/json

{"transportista_id": 1}
```

- `transportista_id`: ID del transportista en `cat_transportistas`, o `null` para desasociar.

Ejemplo con **curl** (backend en `http://127.0.0.1:8000`):

```bash
# Asociar el transportista con id=1 al vehículo con id=1
curl -X PATCH "http://127.0.0.1:8000/api/v1/vehiculos/1/transportista" -H "Content-Type: application/json" -d "{\"transportista_id\": 1}"
```

Primero necesitas los IDs:

- **Vehículos:** `GET /api/v1/vehiculos` (lista con `id` y `placas`).
- **Transportistas:** `GET /api/v1/transportistas` (si existe) o consulta directa a la base (ver abajo).

### Opción B: Directo en PostgreSQL

Con la migración ya aplicada (`alembic upgrade head`), en tu cliente SQL (pgAdmin, DBeaver, `psql`, etc.):

```sql
-- Ver transportistas (id y nombre)
SELECT id, codigo_sap, nombre_transportista FROM cat_transportistas;

-- Ver vehículos (id y placas)
SELECT id, placas, transportista_id FROM cat_vehiculos;

-- Asociar: poner el id del transportista en el vehículo que quieras
UPDATE cat_vehiculos
SET transportista_id = 1
WHERE id = 1;
-- (cambia 1 por el id del transportista y el id del vehículo que correspondan)
```

Si no tienes transportistas ni vehículos, créalos antes (por API o por SQL según tengas definido).

### Opción C: Al crear un vehículo (POST)

Al dar de alta un vehículo nuevo puedes mandar `transportista_id` en el body del `POST /api/v1/vehiculos` (si tu schema lo incluye). Los vehículos que ya existían antes de la migración tendrán `transportista_id` en NULL hasta que los actualices con A o B.

---

## 3. Resumen para probar en la web

1. Ejecutar migraciones: `cd backend && alembic upgrade head`.
2. En PostgreSQL (o por API) asegurarte de que exista al menos un transportista en `cat_transportistas`.
3. Asociar ese transportista a los vehículos con los que quieras probar (por PATCH o por `UPDATE cat_vehiculos SET transportista_id = ...`).
4. En la web, ingresar las **placas** (tracto y/o carreta) que correspondan a ese vehículo; el sistema cargará el transportista asociado y ya no debería decir "no hay transportista asociado".

Si quieres, en el siguiente paso podemos añadir un script (por ejemplo `scripts/asociar_transportista_vehiculo.py`) que lea IDs por argumentos y haga el PATCH por ti.
