# Login real (JWT + BD)

## Backend

### 1. Dependencias

```bash
cd backend
pip install -r requirements-auth.txt
```

(O añade a tu `requirements.txt`: `PyJWT>=2.8.0` y `passlib[bcrypt]>=1.7.4`.)

### 2. Migración

```bash
alembic upgrade head
```

Crea la tabla `auth_usuarios`.

### 3. Crear usuarios

**Solo administrador:**

```bash
python -m app.scripts.seed_admin
```

Crea usuario `admin` con contraseña `admin`. Variables opcionales: `SEED_USUARIO`, `SEED_PASSWORD`, `SEED_NOMBRE`.

**Todos los roles (admin, supervisor, facturador, documentaria):**

```bash
python -m app.scripts.seed_all_roles
```

Crea: `admin`, `supervisor`, `facturador`, `doc`. Contraseña = mismo que el usuario (cambiar en producción).

### 4. JWT (opcional)

En `backend/.env` o `.env.local`:

- `JWT_SECRET`: clave secreta para firmar tokens (obligatoria en producción).
- `JWT_EXPIRE_MINUTES`: validez del token (por defecto 1440 = 1 día).

Si no defines `JWT_SECRET`, se usa un valor por defecto solo válido para desarrollo.

---

## Frontend

El frontend ya está preparado:

- Envía usuario y contraseña a `POST /api/v1/auth/login`.
- Guarda el token en `localStorage` y lo envía en `Authorization: Bearer <token>` en todas las peticiones.
- Si el backend responde 401, se cierra sesión y se redirige a `/login`.
- Al cargar la app, si hay token se llama a `GET /api/v1/auth/me` para obtener el usuario actual.

---

## Resumen

1. `pip install -r requirements-auth.txt`
2. `alembic upgrade head`
3. `python -m app.scripts.seed_all_roles`
4. Iniciar backend y frontend; entrar con `admin` / `admin` (o el usuario que hayas creado).
