# Plan de Arquitectura & Limpieza — AGROFLOW (BETA LogiCapture 1.0)

**Autor:** Arquitecto de Software Principal  
**Fecha:** Marzo 2026  
**Alcance:** Backend + Frontend + Documentación + Archivos del proyecto  
**Propósito:** Guía oficial para que el equipo de programación deje el proyecto limpio, organizado y listo para migrar a AWS sin reescrituras.

> **REGLA DE ORO:** Ninguna tarea de este plan romperá el entorno actual.  
> Todo sigue funcionando en la nube (Supabase + Render/Railway + Vercel) mientras se aplican las mejoras.

---

## CONTEXTO DE ENTORNO — Cómo funciona este proyecto

Este proyecto opera en **100% cloud**. No existe entorno de desarrollo local como flujo de trabajo principal. La estructura de entornos es:

```
ENTORNO DEV (nube)
───────────────────────────────────────────────────────
Frontend  →  Vercel (rama dev / preview deployments)
Backend   →  Render o Railway (servicio dev)
Base de datos  →  Supabase (PostgreSQL gratis)
Variables de entorno  →  Panel de Render/Railway + Panel de Vercel

ENTORNO PRODUCTION (nube) — pendiente de aprobación
───────────────────────────────────────────────────────
Frontend  →  Vercel (rama main/prod) o AWS Amplify
Backend   →  AWS EC2 o Elastic Beanstalk
Base de datos  →  Amazon RDS (PostgreSQL dedicado)
Variables de entorno  →  Variables de entorno del servidor EC2 o AWS Secrets Manager
```

### ¿Para qué sirven entonces los archivos `.env.local`?

Los archivos `.env.local` que existen en el repositorio **son solo de referencia rápida** cuando algún miembro del equipo necesita correr algo puntualmente en su máquina (ej. ejecutar un script de alembic, seed, o debug urgente). Están correctamente excluidos por `.gitignore` — **nunca suben a Git**.

**En la nube, las variables se definen directamente en:**
- **Backend (Render/Railway):** Panel de Environment Variables del servicio.
- **Backend (AWS EC2 futuro):** Variables del servidor o AWS Secrets Manager.
- **Frontend (Vercel):** Settings → Environment Variables del proyecto.

### ¿Hay que cambiar algo por trabajar en cloud?

**No.** El código ya está perfectamente preparado para esto:
- `configuracion.py` usa `pydantic-settings` que lee variables del entorno del sistema operativo primero, y solo si no las encuentra busca en `.env.local`. En la nube, el SO del servidor ya tiene las variables inyectadas por el panel → funciona perfecto.
- `next.config.mjs` lee `API_PROXY_TARGET` de las variables de entorno de Vercel → funciona perfecto.

---

## SECCIÓN 1 — Diagnóstico General

### ✅ Lo que está MUY BIEN (No tocar)

| Componente | Por qué es correcto |
|---|---|
| `backend/app/configuracion.py` | Lee TODO desde variables de entorno del sistema. Cambie a AWS = solo actualizar el panel del servidor. |
| `backend/app/database.py` | Usa `settings.DATABASE_URL`. Migrar a RDS = cambiar el valor en el panel del servidor EC2. |
| `frontend/next.config.mjs` | Proxy de API vía `API_PROXY_TARGET` desde Vercel env vars. Portable al 100%. |
| `dependencies/auth.py` (JWT) | Stateless. No requiere sesión en servidor. Compatible con cualquier cloud. |
| `main.py` (CORS dinámico) | Lee `CORS_ORIGINS` desde env. En Render/Railway ya está configurado como variable. |
| Sistema de Autenticación completo | Roles, bloqueo de cuentas, bcrypt, JWT. Implementación profesional. |
| Alembic (migraciones) | Control de versiones del schema. Funciona igual con RDS PostgreSQL. |
| `.gitignore` global | Excluye `.env.*` correctamente. Ningún secreto puede subir a Git. ✅ |
| `routers/` con 16 módulos | Buena separación por dominio de negocio. |
| `scripts/integrations/` | Office Scripts y Power Automate bien separados del código principal. |

---

## SECCIÓN 2 — Variables de Entorno: Cómo Debe Manejarse Esto

### 2.1 — Qué variables deben estar configuradas en cada panel de la nube

El programador debe asegurarse de que estas variables estén presentes en el panel de cada servicio cloud:

#### En el panel del Backend (Render / Railway / EC2 futuro)

| Variable | Dev (Supabase) | Prod (AWS) | ¿Obligatoria? |
|---|---|---|---|
| `DATABASE_URL` | URL Pool de Supabase | URL de Amazon RDS | ✅ Sí |
| `SYNC_TOKEN` | Valor secreto dev | Valor secreto distinto | ✅ Sí |
| `ENVIRONMENT` | `development` | `production` | ✅ Sí |
| `JWT_SECRET` | Puede ser valor dev simple | **Obligatorio**: valor largo aleatorio (`openssl rand -hex 32`) | ✅ Sí en prod |
| `JWT_ALGORITHM` | `HS256` | `HS256` | ⬜ Opcional (tiene default) |
| `JWT_EXPIRE_MINUTES` | `1440` (1 día) | `480` (8 horas, más seguro) | ⬜ Opcional |
| `CORS_ORIGINS` | URL de Vercel Preview | URL del dominio oficial de producción | ✅ Sí en prod |

#### En el panel del Frontend (Vercel)

| Variable | Dev | Prod |
|---|---|---|
| `API_PROXY_TARGET` | URL del backend en Render/Railway | URL del backend en AWS EC2 |
| `NEXT_PUBLIC_USER_ROLE` | **Verificar si todavía se usa** (ver Tarea F03) | Probablemente a eliminar |

### 2.2 — Los archivos `.env.local` del repositorio

Como no se trabaja localmente, estos archivos son **solo una referencia mínima de emergencia**. Deben tener solo lo mínimo para correr un script puntual. **No son el origen de verdad de la configuración.**

**Acción:** Crear `backend/.env.example` con TODAS las variables documentadas. Este archivo **sí sube a Git** y sirve como referencia para quien configura un nuevo servicio en la nube.

```dotenv
# ============================================================
# AGROFLOW — Referencia de Variables de Entorno del Backend
#
# ¿CÓMO SE USA ESTO?
# En cloud (Render, Railway, AWS EC2): definir estas variables
# directamente en el panel Environment Variables del servicio.
# NO se usa un archivo .env en producción ni en dev cloud.
#
# Si necesitas correr un script localmente de emergencia:
# Copiar este archivo como ".env.local" (no subir a Git, ya está
# en .gitignore) y completar los valores.
# ============================================================

# Base de datos PostgreSQL
# Dev cloud:  URL Pool de Supabase
# Prod cloud: URL de Amazon RDS
DATABASE_URL=postgresql://user:password@host:5432/database

# Token para el endpoint de sincronización (/api/v1/sync)
SYNC_TOKEN=reemplazar_con_valor_secreto

# Entorno: "development" o "production"
# En "production" el backend NO arranca si JWT_SECRET está vacío
ENVIRONMENT=development

# Clave secreta para firmar tokens JWT
# En producción: generar con "openssl rand -hex 32"
JWT_SECRET=

# Algoritmo JWT (no cambiar salvo necesidad específica)
JWT_ALGORITHM=HS256

# Minutos de validez del token. Dev: 1440 (1 día). Prod: 480 (8h)
JWT_EXPIRE_MINUTES=1440

# URLs del frontend separadas por coma (para CORS)
# Dev: URL de Vercel Preview, ej: https://agroflow-dev.vercel.app
# Prod: URL del dominio oficial
CORS_ORIGINS=
```

### 2.3 — El archivo `requirements-auth.txt` es redundante

**Detectado:** `backend/requirements-auth.txt` existe con dependencias que ya están en `requirements.txt`.

**Acción:** Eliminar `requirements-auth.txt`. En Render/Railway el servicio instala `requirements.txt` — tener dos archivos genera confusión sobre cuál se instala.

---

## SECCIÓN 3 — Archivos y Carpetas a Eliminar

> ⚠️ **Antes de eliminar cualquier archivo, hacer commit en Git para tener un punto de restauración.**

### 3.1 — En `docs/` (documentación obsoleta)

| Archivo | Acción | Razón |
|---|---|---|
| `docs/PLAN_AUTH_Y_ROLES.md` | 🔴 **ELIMINAR** | Plan ya implementado. El auth real, roles, bloqueo de cuentas ya existen en el código. |
| `docs/LOGIN_REAL.md` | 🔴 **ELIMINAR** | Guía de instalación del auth ya completada. Información vigente está en SEGURIDAD.md. |
| `docs/CONSULTAS_SQL_Y_PRUEBA_EDICION.md` | 🔴 **ELIMINAR** | El archivo `inserts_prueba.sql` ya contiene los mismos datos de prueba en formato ejecutable. |
| `docs/MIGRACION_Y_ASOCIAR_TRANSPORTISTA.md` | 🔴 **ELIMINAR** | Guía de una migración específica ya ejecutada. El schema actual ya tiene ese campo. |
| `docs/IDEAS_IA.md` | 🟡 **LIMPIAR y MOVER** | Ideas válidas pero el final del archivo tiene basura de IA (`</think>`, `TodoWrite`). Limpiar y mover a `docs/roadmap/`. |
| `docs/BACKUPS.md` | ✅ **CONSERVAR** | Guía de backups manuales de PostgreSQL. Relevante tanto para dev como para producción futura. |
| `docs/SEGURIDAD.md` | ✅ **CONSERVAR y ACTUALIZAR** | Checklist para producción. **Actualizar**: tachar los puntos ya implementados (auth JWT real, bloqueo de cuentas, RBAC). |
| `docs/inserts_prueba.sql` | ✅ **CONSERVAR** | Script SQL para poblar entornos de prueba. Necesario para dev cloud. |

### 3.2 — En la RAÍZ del proyecto (mal ubicados)

| Archivo | Acción | Razón |
|---|---|---|
| `manual_tecnico.md` | 🟡 **MOVER a `docs/`** | Documento técnico valioso pero mal ubicado en la raíz. |
| `propuesta_requerimientos_TI.md` | 🟡 **MOVER a `docs/`** | Propuesta para TI/Gerencia. También debe estar en `docs/`. |
| `README.md` | ✅ **CONSERVAR y ACTUALIZAR** | Debe tener instrucciones claras de cómo deployar en Render y Vercel. |

### 3.3 — En `backend/` (mal ubicados o redundantes)

| Archivo | Acción | Razón |
|---|---|---|
| `backend/requirements-auth.txt` | 🔴 **ELIMINAR** | Duplicado de `requirements.txt`. |
| `backend/GUIA_CONFIGURACION_DRIVE.md` | 🟡 **EVALUAR** | Si Google Drive ya fue reemplazado por SharePoint, eliminar. Si sigue activo, mover a `docs/`. |
| `backend/guia_automatizacion_profesional.md` | 🟡 **MOVER a `docs/`** | Documentación técnica en carpeta incorrecta. |

### 3.4 — En `backend/scripts/debug/` (scripts temporales)

Todos los scripts de debug son temporales. En un entorno cloud el debug se hace con **logs estructurados**, no con scripts sueltos. El proyecto ya tiene `utils/logging.py` configurado — usarlo.

| Archivo | Acción |
|---|---|
| `debug_any.py` | 🔴 **ELIMINAR** |
| `debug_ebkg.py` | 🔴 **ELIMINAR** |
| `debug_posic.py` | 🔴 **ELIMINAR** |
| `debug_posic_list.py` | 🔴 **ELIMINAR** |
| `debug_find_posic.py` | 🔴 **ELIMINAR** |
| `debug_vehicle_lookup.py` | 🔴 **ELIMINAR** |
| `debug_users.py` | 🔴 **ELIMINAR** |

> **Regla futura:** Si se necesita investigar un bug en cloud, usar los logs del panel de Render/Railway (`logger.info(...)`, `logger.error(...)`). No crear scripts de debug temporales en el repositorio.

### 3.5 — En `backend/scripts/db/` (scripts ya aplicados)

| Archivo | Acción | Razón |
|---|---|---|
| `migrate_neon.py` | 🔴 **ELIMINAR** | Era para migrar de Neon. Migración ya completada. |
| `fix_db.py` | 🟡 **EVALUAR** | Si el fix ya fue absorbido en una migración Alembic, eliminar. Si todavía es necesario como script de operación, conservar. |
| `explore_db.py` | 🟡 **EVALUAR** | Si ya no se usa activamente para explorar el schema, eliminar. |
| `inspect_db_simple.py` | 🔴 **ELIMINAR** | (en `checks/`) Duplicado de `inspect_db_schema.py`. |

**Scripts a CONSERVAR en `backend/scripts/`:**

| Archivo | Por qué conservar |
|---|---|
| `db/create_tables.py` | Útil para arrancar un ambiente nuevo en cloud. |
| `db/seed_plantas.py` | Semilla inicial de datos necesaria en cada entorno nuevo. |
| `db/reset_password.py` | Herramienta de recuperación de emergencia sin UI. |
| `db/remove_fk_booking_dam.sql` | Migración SQL de referencia histórica. |
| `integrations/` (todos) | Office Scripts, Power Automate y Google Apps Script. Activos. |
| `tests/test_db_insert.py` | Verificación de conexión básica a la BD. |
| `tests/test_ocr_local.py` | Prueba del módulo OCR. |
| `checks/check_server.py` | Health check manual. |
| `checks/check_table_exists.py` | Verificador de schema. |
| `app/scripts/seed_admin.py` | Seed de usuario admin. Necesario en cada entorno nuevo. |
| `app/scripts/seed_all_roles.py` | Seed de todos los roles. Necesario en cada entorno nuevo. |

### 3.6 — En `frontend/` (archivos de logs)

| Archivo | Acción |
|---|---|
| `frontend/build.log` | 🔴 **ELIMINAR** — Los logs de build de Vercel están en el panel de Vercel, no en Git. |
| `frontend/build_final.log` | 🔴 **ELIMINAR** — Ídem. |

> **Verificar:** El `.gitignore` global ya excluye `*.log` ✅. Estos archivos probablemente están siendo trackeados porque se crearon antes de que se agregara esa regla. Ejecutar: `git rm --cached frontend/build.log frontend/build_final.log`

### 3.7 — Carpeta vacía

| Carpeta | Acción |
|---|---|
| `backend/app/data/` | Está vacía. **Eliminar** o documentar su propósito con un `README.md` si se planea usar. |

---

## SECCIÓN 4 — Tareas de Refactorización de Código

### 4.1 — PRIORIDAD ALTA

#### TAREA-B01: Separar Schemas Pydantic del Router `auth.py`

**Problema:** `LoginRequest`, `LoginResponse`, `UsuarioCreate`, `UsuarioResponse`, etc. están definidos en `routers/auth.py`, mezclados con los endpoints.

**Acción:**
1. Crear `backend/app/schemas/auth.py`
2. Mover todos los modelos Pydantic allí
3. Importar en `routers/auth.py`: `from app.schemas.auth import LoginRequest, ...`

No cambia ninguna funcionalidad. No afecta el servicio en la nube.

---

#### TAREA-B02: Verificar prefijo `/api/v1` en Todos los Routers

**Problema potencial:** `routers/auth.py` usa `/api/v1/auth` ✅. Los otros 15 routers deben verificarse.

**Acción:** Revisar el atributo `prefix=` de cada archivo en `backend/app/routers/`. Corregir los que no tengan `/api/v1/`. Esto es vital para cuando exista una `v2`.

---

#### TAREA-F01: Verificar Centralización de Llamadas API en el Frontend

**Situación:** `frontend/lib/api.ts` ya existe (22KB) — buen indicio.

**Verificar que todos los componentes usen este cliente y que maneje:**
- Error `401` → limpiar token y redirigir a `/login` automáticamente
- Error `500` → mostrar mensaje amigable sin exponer detalles técnicos
- Header `Authorization: Bearer <token>` en cada petición

---

#### TAREA-F02: Verificar si `NEXT_PUBLIC_USER_ROLE` está Obsoleto

**Detectado:** `frontend/.env.local` tiene `NEXT_PUBLIC_USER_ROLE=` (vacío) y `docs/CONSULTAS_SQL_Y_PRUEBA_EDICION.md` la referencia como mecanismo de control de rol.

**El problema:** El control de roles ahora lo hace el JWT real (`/api/v1/auth/me` retorna el rol). Pasar el rol por variable de entorno del frontend es inseguro y redundante.

**Acción:** Verificar si algún componente del frontend todavía lee `NEXT_PUBLIC_USER_ROLE`. Si no se usa, eliminar la variable del panel de Vercel y del `.env.local`. Si aún se usa, es una deuda técnica crítica de seguridad: el rol debe venir siempre del token.

---

### 4.2 — PRIORIDAD MEDIA (Antes del lanzamiento en AWS)

#### TAREA-B03: Extraer Lógica de Negocio a Capa de Servicio

**Problema:** `routers/auth.py` hace queries directas a la BD. Los routers deben ser delgados.

**Acción:**
1. Crear `backend/app/services/auth_service.py`
2. Extraer: `autenticar_usuario()`, `crear_usuario()`, `restablecer_password()`
3. El router solo llama al servicio y devuelve la respuesta HTTP

---

#### TAREA-B04: Configurar Pool de Conexiones para Producción

En cloud con múltiples usuarios concurrentes, el pool por defecto de SQLAlchemy puede ser insuficiente. Agregar al panel del servidor de producción (EC2/Render):

```
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
```

Y leerlos en `database.py` condicionados a `ENVIRONMENT=production`. En dev, sin cambios.

---

#### TAREA-B05: Centralizar Excepciones HTTP

Crear `backend/app/core/exceptions.py`:
```python
class PermisoInsuficienteError(HTTPException): ...
class UsuarioNoEncontradoError(HTTPException): ...
class CredencialesInvalidasError(HTTPException): ...
```

Permite cambiar mensajes de error desde un solo lugar en vez de buscarlos en 16 router files.

---

#### TAREA-B06: Actualizar `SEGURIDAD.md` — Marcar lo ya implementado

El archivo `docs/SEGURIDAD.md` lista cosas como "falta para producción" que YA están implementadas:
- ✅ Auth real con JWT → **YA implementado**
- ✅ Validación de token en el backend → **YA implementado** (`dependencies/auth.py`)
- ✅ Rol embebido en JWT, no en header → **YA implementado**
- ✅ `JWT_SECRET` obligatorio en production → **YA implementado** (`main.py`)

**Acción:** Actualizar ese archivo para reflejar el estado real. Es el checklist de producción y debe estar al día.

---

### 4.3 — PRIORIDAD BAJA (Post-lanzamiento)

#### TAREA-B07: Suite de Pruebas Unitarias

```
backend/tests/
├── conftest.py           # BD SQLite en memoria, fixtures de usuario
├── test_auth.py          # Flujo de login, bloqueo, roles
└── test_registros.py     # Creación y cambio de estado de registros
```

En un servicio cloud con deploy automático (CI/CD), las pruebas corren antes del deploy y evitan que código roto llegue a producción.

---

## SECCIÓN 5 — Estructura de `docs/` después de la limpieza

Así debe quedar `docs/` una vez ejecutado el plan:

```
docs/
├── BACKUPS.md                       ✅ Conservado
├── SEGURIDAD.md                     ✅ Conservado (actualizar checklist)
├── inserts_prueba.sql               ✅ Conservado
├── MANUAL_TECNICO.md                ← Movido desde la raíz
├── PROPUESTA_TI.md                  ← Movido desde la raíz
├── PLAN_ARQUITECTURA_Y_LIMPIEZA.md  ← Este archivo (permanente)
└── roadmap/
    └── IDEAS_IA.md                  ← Limpiado y movido aquí
```

**Eliminados de `docs/`:**
- `PLAN_AUTH_Y_ROLES.md`
- `LOGIN_REAL.md`
- `CONSULTAS_SQL_Y_PRUEBA_EDICION.md`
- `MIGRACION_Y_ASOCIAR_TRANSPORTISTA.md`

---

## SECCIÓN 6 — Hoja de Ruta de Implementación

```
SEMANA 1 — Limpieza (no toca código funcional):
  □ Commit de seguridad en Git antes de cualquier eliminación
  □ Eliminar los 7 archivos debug_*.py de scripts/debug/
  □ Eliminar docs obsoletos (4 archivos)
  □ Limpiar IDEAS_IA.md (quitar basura del final)
  □ Eliminar requirements-auth.txt
  □ Eliminar frontend/build.log y build_final.log
      → git rm --cached frontend/build.log frontend/build_final.log
  □ Mover a docs/: manual_tecnico.md y propuesta_requerimientos_TI.md
  □ Mover a docs/: backend/guia_automatizacion_profesional.md
  □ Crear backend/.env.example con el contenido de la Sección 2.2
  □ Evaluar y eliminar migrate_neon.py y scripts de DB ya obsoletos

SEMANA 2 — Refactorización de código (no afecta el servicio en cloud):
  □ TAREA-B01: Crear schemas/auth.py y mover modelos Pydantic
  □ TAREA-B02: Verificar prefijo /api/v1 en todos los routers
  □ TAREA-F01: Verificar centralización de API calls en el frontend
  □ TAREA-F02: Verificar y eliminar NEXT_PUBLIC_USER_ROLE si está obsoleto
  □ TAREA-B06: Actualizar SEGURIDAD.md con estado real

SEMANA 3-4 — Previo al lanzamiento en AWS:
  □ TAREA-B03: Extraer lógica a auth_service.py
  □ TAREA-B04: Configurar pool de BD para producción en database.py
  □ TAREA-B05: Centralizar excepciones HTTP

POST-LANZAMIENTO:
  □ TAREA-B07: Suite de pruebas unitarias (CI/CD)
```

---

## SECCIÓN 7 — Reglas que el Equipo de Programación debe seguir

### Reglas para el Backend

1. **Nunca hardcodear** URLs, tokens, keys o nombres de servidor en el código. Solo en variables de entorno configuradas en el panel cloud.
2. **Routers delgados:** El router recibe la petición HTTP, llama al servicio, retorna la respuesta. Cero queries directas a la BD en el router.
3. **Schemas en su capa:** Los modelos Pydantic van en `app/schemas/`, no dentro de los routers.
4. **Logs, no prints:** Usar siempre `from app.utils.logging import logger` para registrar eventos. En cloud los prints no se guardan bien en los paneles de logging.
5. **No crear scripts `debug_*.py`:** Si se necesita investigar algo, usar `logger.debug()` y revisar los logs del panel de Render/Railway/CloudWatch.

### Reglas para el Frontend

1. **Nunca llamar a la API directamente desde componentes.** Toda llamada pasa por `frontend/lib/api.ts`.
2. **El rol del usuario viene del token JWT** (`/api/v1/auth/me`), no de una variable de entorno.
3. **`API_PROXY_TARGET` es la única variable que conecta al backend.** Para cambiar de Dev a Prod solo se actualiza ese valor en el panel de Vercel.

### Regla de Migración a AWS (cuando llegue el momento)

Para pasar de Supabase + Render a AWS, el programador **solo necesita:**
1. Crear la instancia RDS y copiar su URL.
2. Actualizar `DATABASE_URL` en las variables de entorno del servidor EC2.
3. Actualizar `API_PROXY_TARGET` en las variables de entorno del proyecto en Vercel.
4. Actualizar `CORS_ORIGINS` con el nuevo dominio de producción.
5. Definir `ENVIRONMENT=production` y `JWT_SECRET` con un valor fuerte.

**Cero cambios en el código fuente.** Todo está preparado para esto.
