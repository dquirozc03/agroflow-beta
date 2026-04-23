# AgroFlow Backend

API REST del sistema AgroFlow V2 - plataforma de logistica agroexportadora para gestion de embarques, despachos aduaneros y trazabilidad de contenedores.

## Tech Stack

- **Framework:** FastAPI 0.128.0 + Uvicorn
- **Python:** 3.12 (requerido)
- **Base de Datos:** PostgreSQL (Supabase dev / AWS RDS prod)
- **ORM:** SQLAlchemy 2.0
- **Migraciones:** Alembic
- **Auth:** JWT (PyJWT + bcrypt, HS256)
- **PDFs:** WeasyPrint + ReportLab
- **OCR:** Google Generative AI
- **Datos:** pandas, numpy, openpyxl

## Estructura del Proyecto

```
├── app/
│   ├── main.py              # FastAPI app, CORS, routers
│   ├── configuracion.py     # Pydantic Settings (.env)
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models/              # Modelos ORM (7 tablas)
│   ├── routers/             # Endpoints REST (8 routers)
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Logica de negocio
│   ├── dependencies/        # Auth dependency injection
│   ├── utils/               # Audit, logging, rate_limit
│   ├── scripts/             # Seeds y migraciones manuales
│   └── templates/pdf/       # Templates HTML para PDFs
├── alembic/                 # Migraciones de BD
├── assets/                  # Logos y templates Excel/PDF
├── scripts/                 # Scripts de BD y ops
├── scratch/                 # Scripts de debug ad-hoc
├── docs/                    # Documentacion y tickets
├── Dockerfile               # Imagen Docker (python:3.11-slim)
├── requirements.txt         # Dependencias Python
├── bootstrap.bat            # Setup completo (venv + deps + migraciones)
└── start.bat                # Arranque del servidor
```

## Modulos (Routers)

| Router | Prefijo | Descripcion |
|--------|---------|-------------|
| auth | `/api/v1/auth` | Login JWT, gestion de usuarios y roles |
| sync | `/api/v1/sync` | Sincronizacion de datos maestros |
| maestros | `/api/v1/maestros` | CRUD de entidades base (plantas, contenedores) |
| vehiculos | `/api/v1/vehiculos` | Tractos, carretas y choferes |
| logicapture | `/api/v1/logicapture` | Captura de salidas (modulo core) |
| clientes_ie | `/api/v1/clientes-ie` | Clientes de importacion/exportacion |
| instrucciones | `/api/v1/instrucciones` | Instrucciones de embarque |
| packing_list | `/api/v1/packing-list` | Packing list OGL |

## Setup Local

### Prerrequisitos

- Python 3.12 ([descargar](https://www.python.org/downloads/release/python-31210/))
- PostgreSQL corriendo con una base de datos `agroflow`

### 1. Configurar variables de entorno

Crear archivo `.env.local` en la raiz:

```env
DATABASE_URL=postgresql+psycopg2://postgres:admin@localhost:5432/agroflow
SYNC_TOKEN=dev-sync-token
ENVIRONMENT=development
AUTH_ENABLED=true
JWT_SECRET=dev-secret-cambiar-en-prod
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
GOOGLE_API_KEY=
```

### 2. Bootstrap (primera vez)

```bash
bootstrap.bat
```

Esto ejecuta: crear venv Python 3.12, instalar dependencias, correr migraciones Alembic + SQL, aplicar patches/seeds, y crear usuario admin.

### 3. Arrancar el servidor

```bash
start.bat
```

O manualmente:

```bash
.venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs

## Docker

```bash
docker build -t agroflow-backend .
docker run -p 8000:8000 --env-file .env.local agroflow-backend
```

## Modelo de Datos

Tablas principales:

- `auth_usuarios` / `auth_roles` - Autenticacion con permisos granulares (JSON)
- `transportistas` -> `vehiculos_tracto` / `vehiculos_carreta` - Transporte (1:N)
- `clientes_ie` -> `maestro_fitos` - Clientes IE con datos fitosanitarios (N:1)
- `logicapture_registros` -> `logicapture_detalles` - Captura de salidas con unicidad de precintos (1:N)
- `posicionamientos` - Programacion de bookings
- `pedidos_comerciales` - Ordenes comerciales de exportacion
- `control_embarque` - Booking + DAM + contenedor
- `ope_registro_eventos` - Auditoria (snapshots JSON antes/despues)
