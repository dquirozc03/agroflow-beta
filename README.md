# BETA LogiCapture 1.0 (Nexo)

Sistema para el área comercial y exportaciones: registro operativo, bandeja SAP e historial. Incluye login real (JWT), roles y auditoría.

## Requisitos

- **Backend:** Python 3.x, PostgreSQL, dependencias en `backend/requirements.txt` y `backend/requirements-auth.txt`
- **Frontend:** Node.js 18+, npm o pnpm

## Arranque rápido

### 1. Backend

```bash
cd backend
# Crear venv y activar (recomendado)
pip install -r requirements.txt
pip install -r requirements-auth.txt   # JWT + bcrypt

# Variables de entorno (copiar .env.example si existe o crear .env):
# DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_bd
# SYNC_TOKEN=un-token-secreto
# Opcional: JWT_SECRET=clave-secreta (obligatorio si ENVIRONMENT=production)

alembic upgrade head
python -m app.scripts.seed_all_roles   # Usuarios de prueba: admin/admin, etc.

uvicorn app.main:app --reload
```

El backend queda en **http://127.0.0.1:8000**.

### 2. Frontend

```bash
cd frontend
npm install

# En .env.local (crear si no existe):
# API_PROXY_TARGET=http://127.0.0.1:8000

npm run dev
```

El frontend queda en **http://localhost:3000**. Entrar a la app y hacer login con **admin** / **admin** (o el usuario creado por los seeds).

## Variables de entorno principales

| Variable | Dónde | Descripción |
|--------|--------|-------------|
| `DATABASE_URL` | backend | URL de PostgreSQL |
| `SYNC_TOKEN` | backend | Token para sincronización |
| `JWT_SECRET` | backend | Secreto para firmar JWT (obligatorio en producción) |
| `ENVIRONMENT` | backend | `development` (por defecto) o `production` |
| `API_PROXY_TARGET` | frontend | URL del backend (dev: `http://127.0.0.1:8000`; prod: `https://api.tudominio.com`) |
| `CORS_ORIGINS` | backend | Orígenes permitidos para CORS, separados por coma (prod: URL del frontend) |

## Documentación adicional

- **[docs/LOGIN_REAL.md](docs/LOGIN_REAL.md)** – Login JWT, migraciones auth, seeds
- **[docs/SEGURIDAD.md](docs/SEGURIDAD.md)** – Checklist producción, JWT, HTTPS, rate limiting, auditoría
- **[docs/BACKUPS.md](docs/BACKUPS.md)** – Copias de seguridad de la base de datos

## Producción

- **Backend:** Definir `ENVIRONMENT=production`, `JWT_SECRET` fuerte y `CORS_ORIGINS` con la URL real del frontend (ej. `https://app.tudominio.com`), separada por comas si hay varias.
- **Frontend:** En el build/entorno de producción, definir `API_PROXY_TARGET` con la URL pública del backend (ej. `https://api.tudominio.com`).
- Cambiar contraseñas por defecto de los usuarios.
- Servir por HTTPS (reverse proxy o plataforma).
- Ver [docs/SEGURIDAD.md](docs/SEGURIDAD.md) para el checklist completo.
