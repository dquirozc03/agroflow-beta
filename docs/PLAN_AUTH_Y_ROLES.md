# Plan: Login y roles de usuario (LogiCapture)

## Ya implementado en esta sesión

1. **Persistencia al refrescar**: La bandeja SAP se guarda en `localStorage` y se restaura al recargar.
2. **Pestaña Historial**: Listado paginado (10 / 25 / 50 / 100 por página), con “Mostrando X–Y de Z” y botones anterior/siguiente.
3. **Login básico (opcional)**:
   - Variables de entorno: `AUTH_ENABLED`, `AUTH_EMAIL`, `AUTH_PASSWORD`, `JWT_SECRET`.
   - Si `AUTH_ENABLED` no está o es false, la API no exige login.
   - Endpoints: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`.

## Próximos pasos recomendados (orden sugerido)

### 1. Tabla de usuarios en BD (producción)

- Crear modelo `Usuario` (id, email, password_hash, rol, activo, created_at).
- Migración Alembic para la tabla.
- Endpoint `POST /auth/register` (solo si no hay usuarios, para crear el primer admin) o script de seed.
- Sustituir la validación por env por consulta a la tabla y verificación de contraseña con **passlib** (bcrypt).

### 2. Roles y permisos

- Roles sugeridos: `admin`, `operador`, `consulta`.
  - **admin**: todo (crear/editar/anular registros, ver historial, exportar, gestionar usuarios si se implementa).
  - **operador**: crear registros, bandeja SAP, historial (solo lectura o con “añadir a bandeja”), sin anular/editar procesados.
  - **consulta**: solo lectura (historial, bandeja si se comparte).
- En el backend: dependencia `get_current_user` que devuelve el usuario; otra `require_rol("admin")` que verifica el rol.
- Proteger rutas según rol (por ejemplo, anular/editar solo admin o operador con permiso).

### 3. Frontend: protección de rutas

- Si se activa auth en backend: pantalla de login (`/login`), guardar token (p. ej. en `localStorage` o cookie).
- En cada petición a la API, enviar cabecera `Authorization: Bearer <token>`.
- Si la API devuelve 401, redirigir a `/login`.
- Opcional: mostrar en la UI el rol del usuario y ocultar/deshabilitar acciones según permisos (p. ej. “Anular” solo para admin).

### 4. Mejoras opcionales

- Refresh token (acceso corto + refresh largo).
- “Recordar sesión” vs cerrar al salir del navegador.
- Auditoría: guardar `usuario_id` en eventos de registros (ya tienes `usuario` en `RegistroEvento`).
- Recuperación de contraseña (email o flujo interno).

## Variables de entorno (login por env, actual)

| Variable        | Descripción                          | Ejemplo (desarrollo)   |
|----------------|--------------------------------------|-------------------------|
| AUTH_ENABLED   | Activar login (true/false)           | false                   |
| AUTH_EMAIL     | Email del único usuario (si env)     | admin@beta.local        |
| AUTH_PASSWORD  | Contraseña (solo para desarrollo)    | cambio_en_produccion    |
| JWT_SECRET     | Clave para firmar el token JWT       | una_clave_larga_secreta |

En producción conviene usar tabla de usuarios y nunca poner la contraseña en env.
