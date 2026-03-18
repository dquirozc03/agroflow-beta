# Seguridad en AGROFLOW / LogiCapture

> **Estado actualizado:** Marzo 2026. Refleja el estado real implementado.

---

## ✅ Lo que YA está implementado

### Autenticación y JWT

- **Login real con JWT:** `POST /api/v1/auth/login` valida usuario y contraseña contra la BD (bcrypt). Devuelve un token JWT firmado con `JWT_SECRET`.
- **Validación de token en el backend:** Todas las rutas protegidas usan la dependencia `get_current_user` (`dependencies/auth.py`) que valida firma y caducidad del token en cada petición. Sin token válido → **401**.
- **Rol embebido en el JWT:** El rol del usuario se incluye en el payload del token al momento del login. El backend lo lee desde el token, nunca confía en headers enviados por el cliente (`X-User-Role` fue una deuda técnica de la fase anterior, ya superada).
- **`JWT_SECRET` obligatorio en producción:** Si `ENVIRONMENT=production`, el backend no arranca si `JWT_SECRET` está vacío o es el valor por defecto de desarrollo. Implementado en `main.py`.
- **Bloqueo de cuenta por intentos fallidos:** Tras 3 intentos de login fallidos, la cuenta se bloquea (`bloqueado=True` en BD). Solo un administrador puede desbloquearla vía `PATCH /api/v1/auth/usuarios/{usuario}/desbloquear`.
- **Rate limiting en login:** `POST /api/v1/auth/login` limite 10 intentos por IP cada 15 minutos. Responde **429** si se excede. Implementado en `utils/rate_limit.py`.
- **Cambio de contraseña forzado en primer login:** Los usuarios creados por el administrador tienen `requiere_cambio_password=True`. El frontend detecta esta bandera en la respuesta del login y redirige a la pantalla de cambio antes de permitir el acceso.

### Control de Acceso por Rol (RBAC)

- Las rutas de administración (crear usuarios, restablecer contraseñas, desbloquear cuentas) verifican `current_user.rol == "administrador"` y responden **403** si el rol no alcanza.
- Las rutas de edición de registros verifican el rol del token antes de permitir la mutación.

### Infraestructura

- **CORS dinámico:** `CORS_ORIGINS` se lee desde la variable de entorno del servidor (panel de Render/Railway/EC2). En producción se define solo el dominio oficial del frontend.
- **Protección de rutas en frontend:** `AuthGuard` redirige a `/login` si no hay token válido. Solo `/login` es ruta pública.
- **HTTPS automático:** El despliegue en Render/Railway/Vercel provee HTTPS por defecto. En AWS EC2 (futuro), el reverse proxy (nginx/ALB) terminará SSL antes de llegar a uvicorn.
- **Auditoría de acciones:** Las acciones de edición y anulación registran quién las realizó (usuario del JWT) en la tabla `ope_registro_eventos`.

---

## 🔲 Pendiente antes de lanzamiento en AWS

### 1. Contraseñas por defecto

- Los scripts `seed_admin` y `seed_all_roles` crean usuarios con contraseñas de prueba (admin/admin, usuario=contraseña).
- **En producción:** Cambiar todas las contraseñas tras el primer acceso. El sistema ya fuerza el cambio con `requiere_cambio_password=True`.

### 2. Pool de conexiones para carga alta

- Actualmente `database.py` usa el pool por defecto de SQLAlchemy (5 conexiones).
- **En producción con múltiples usuarios concurrentes** configurar en el panel del servidor:
  ```
  DB_POOL_SIZE=10
  DB_MAX_OVERFLOW=20
  DB_POOL_TIMEOUT=30
  ```
- Y leer estos valores en `database.py` condicionados a `ENVIRONMENT=production`.

### 3. Logout que invalide token en servidor

- Actualmente el logout borra el token del cliente (localStorage).
- **Para mayor seguridad en producción:** Implementar lista negra de tokens (Redis) o usar refresh tokens con rotación. Prioridad post-lanzamiento inicial.

### 4. Rate limiting con almacén compartido

- El rate limiting actual usa memoria del proceso. Con múltiples workers (gunicorn/uvicorn multiprocess) cada proceso tiene su propio contador.
- **En producción con múltiples workers:** Usar Redis como almacén compartido para el rate limiter.

---

## Checklist rápido para producción en AWS

- [x] Login real con JWT y bcrypt.
- [x] Backend valida token en todas las rutas protegidas.
- [x] Rol obtenido del token en el servidor, no de headers del cliente.
- [x] Bloqueo de cuenta tras 3 intentos fallidos.
- [x] `JWT_SECRET` obligatorio en producción (el backend no arranca sin él).
- [x] Rate limiting en el endpoint de login.
- [x] HTTPS (Render/Railway en dev; ALB/nginx en AWS prod).
- [x] CORS configurado por variable de entorno.
- [ ] Contraseñas de seeds cambiadas en producción.
- [ ] Pool de conexiones BD configurado para carga concurrente.
- [ ] Logout invalida token en servidor (lista negra o refresh tokens).
- [ ] Rate limiting con Redis en entorno multi-worker.
- [ ] Secretos en AWS Secrets Manager (en lugar de variables de entorno del servidor).

---

## Referencia: Cómo restablecer contraseña de un usuario

No hay recuperación por email (el modelo de usuario no tiene campo email).  
Un **administrador** puede restablecer la contraseña de cualquier usuario:

```http
PATCH /api/v1/auth/usuarios/{usuario_id}/password-reset
Authorization: Bearer <token_del_administrador>
Content-Type: application/json

{"nueva_password": "NuevaPass123"}
```

El sistema marcará `requiere_cambio_password=True` al usuario, forzándolo a elegir una nueva contraseña en su próximo login.
