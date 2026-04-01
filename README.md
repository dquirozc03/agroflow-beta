# BETA LogiCapture 1.0 (AgroFlow)

Sistema avanzado para el área comercial y exportaciones: registro operativo de embarques, gestión de Packing Lists (OGL) e historial. Implementado con FastAPI (Python) y Next.js (TypeScript).

---

## 📂 Organización del Proyecto (Arquitectura)

Para mantener la escalabilidad y el orden, seguimos esta estructura:

- **`/backend`**: API REST con FastAPI.
  - **`/app`**: Código fuente (Models, Schemas, Services, Routers).
  - **`/scripts`**: Utilidades de mantenimiento organizadas por:
    - `db/`: Migraciones y carga de datos (seeds).
    - `ops/`: Operaciones de sistema (crear admin, resets).
    - `testing/`: Pruebas de integración y validación.
- **`/frontend`**: Interfaz de usuario con Next.js (App Router) y Shadcn/UI.
- **`/docs`**: Documentación técnica y operativa.
  - **`documentacion/`**: Área de trabajo para el documentador (API, Arquitectura, Procesos).
  - **`tickets/archive/`**: Historial de desarrollo y requerimientos finalizados.

---

## 🛠️ Requisitos e Instalación

### 1. Backend

```bash
cd backend
# Crear venv y activar
pip install -r requirements.txt

# Variables de entorno: copia .env.example a .env.local y completa:
# DATABASE_URL, SYNC_TOKEN, JWT_SECRET (ver sección abajo)

alembic upgrade head
python -m app.scripts.seed_all_roles   # Usuarios iniciales (admin/admin)
uvicorn app.main:app --reload
```

El backend queda en **http://127.0.0.1:8000**.

### 2. Frontend

```bash
cd frontend
npm install

# En .env.local: API_PROXY_TARGET=http://127.0.0.1:8000
npm run dev
```

El frontend queda en **http://localhost:3000**. Login: `admin` / `admin`.

---

## ⚙️ Configuración (Variables de Entorno)

| Variable | Dónde | Descripción |
|--------|--------|-------------|
| `DATABASE_URL` | backend | URL de PostgreSQL (ej. Supabase o AWS RDS) |
| `JWT_SECRET` | backend | Clave para firmar tokens (obligatorio en producción) |
| `ENVIRONMENT` | backend | `development` o `production` |
| `API_PROXY_TARGET` | frontend | URL del backend para el proxy de Next.js |
| `CORS_ORIGINS` | backend | URLs permitidas (separadas por coma en prod) |

---

## 📑 Documentación Clave

- **[docs/MANUAL_TECNICO.md](docs/MANUAL_TECNICO.md)** – Funcionamiento interno y lógica de negocio.
- **[docs/SEGURIDAD.md](docs/SEGURIDAD.md)** – Checklist de producción y seguridad JWT.
- **[docs/BACKUPS.md](docs/BACKUPS.md)** – Procedimientos de respaldo de base de datos.

---

## 🚀 Producción (AWS)

1. Cambiar `ENVIRONMENT=production`.
2. Generar un `JWT_SECRET` seguro.
3. Configurar `CORS_ORIGINS` y `API_PROXY_TARGET` con los dominios oficiales.
4. Ajustar el Pool de Conexiones en `backend/app/database.py` vía variables de entorno si la carga es alta.

