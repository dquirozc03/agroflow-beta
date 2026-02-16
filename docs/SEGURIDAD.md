# Seguridad en Nexo / LogiCapture

## Lo que ya está implementado

### Frontend

- **Protección de rutas**: `AuthGuard` redirige a `/login` si no hay sesión. Solo `/login` es ruta pública; el resto exige usuario autenticado.
- **Roles en cliente**: La UI muestra u oculta pestañas y botones según el rol (administrador, supervisor_facturacion, facturador, documentaria). No se puede acceder a Captura/Bandeja si el rol es documentaria; el botón Editar solo aparece para administrador y supervisor.
- **Envío de rol al backend**: Las peticiones de edición envían el header `X-User-Role` (admin/editor) para que el backend rechace ediciones de usuarios no autorizados.
- **Sesión persistente**: La sesión (usuario y rol) se guarda en `localStorage` bajo la clave `nexo-auth`. Al refrescar, el usuario sigue logueado en el mismo navegador.

### Backend

- **Edición condicionada por rol**: `PATCH /api/v1/registros/{id}/editar` exige el header `X-User-Role: admin` o `editor`. Si no viene o es otro valor, responde **403**.
- **Validación de negocio**: Crear registro exige DNI de chofer, placas (tracto + carreta), vehículo con transportista; anular exige motivo; etc.

---

## Lo que falta para un sistema seguro en producción

### 1. Autenticación real

- **Ahora**: Usuario y contraseña se validan contra una lista fija en el frontend (mock). Cualquiera que abra la consola puede ver los usuarios de prueba.
- **Recomendado**:
  - Backend: endpoint `POST /auth/login` que valide credenciales (LDAP, BD, IdP, etc.) y devuelva un **token JWT** (o cookie de sesión httpOnly).
  - Frontend: enviar usuario/contraseña al login; guardar solo el token (en memoria o en cookie); no guardar la contraseña.
  - En cada petición a la API, enviar el token en el header `Authorization: Bearer <token>` (o cookie si usas sesión).

### 2. Validación de token en el backend

- **Ahora**: Las rutas de la API (registros, vehiculos, etc.) no comprueban identidad. Cualquiera que conozca la URL del backend podría llamar a la API sin estar logueado.
- **Recomendado**:
  - Middleware o dependencia en FastAPI que en cada petición (excepto `/health`, `/auth/login`) exija un token válido y extraiga usuario y rol del token.
  - Rechazar con **401** si no hay token o está caducado; **403** si el rol no tiene permiso para esa acción (por ejemplo, editar solo para admin/editor).

### 3. Rol en el servidor

- **Ahora**: El rol se guarda en el cliente y se envía en headers. Un usuario podría manipular el cliente y enviar otro rol.
- **Recomendado**: Tras el login, el backend asigna el rol (desde BD o IdP) y lo incluye **dentro del JWT**. El backend debe leer el rol del token, no del header `X-User-Role` enviado por el cliente. El header puede seguir usándose como respaldo si el backend rellena el valor desde el token.

### 4. JWT_SECRET en producción

- **Implementado**: Si `ENVIRONMENT=production`, el backend **no arranca** si `JWT_SECRET` no está definido o sigue siendo el valor por defecto de desarrollo.
- **Qué hacer**: En producción definir en el entorno:
  - `ENVIRONMENT=production`
  - `JWT_SECRET=<valor aleatorio y largo>` (p. ej. generado con `openssl rand -hex 32`).

### 5. Contraseñas por defecto y recuperación

- Los scripts `seed_admin` y `seed_all_roles` crean usuarios con contraseñas de prueba (admin/admin, etc.).
- **En producción**: cambiar todas las contraseñas tras el primer acceso. No dejar admin/admin ni usuario=contraseña.
- **Recuperar contraseña**: no hay email en el modelo; un **administrador** puede restablecer la contraseña de cualquier usuario con `PATCH /api/v1/auth/usuarios/{usuario}/password` (body: `{ "nueva_password": "..." }`). En el login se indica "Contacta al administrador".

### 6. HTTPS en producción

- **Objetivo**: Que todo el tráfico (login, API) vaya cifrado. Usuario, contraseña y JWT no deben viajar en claro.
- **Cómo**:
  - No exponer uvicorn directamente a internet. Detrás de un **reverse proxy** que termine SSL (nginx, Caddy, Traefik) o usar un host que lo ofrezca (Render, Railway, Fly.io, etc.).
  - El proxy recibe HTTPS y hace proxy a `http://127.0.0.1:8000` (uvicorn). El frontend debe cargarse también por HTTPS.
- **Frontend**: Si se sirve con Next.js en Vercel/Netlify o similar, HTTPS suele venir por defecto.

### 7. Buenas prácticas adicionales

- **Auditoría**: En anular y editar se registra **quién** realizó la acción (usuario del JWT) en la tabla `ope_registro_eventos` (campo `usuario` y `creado_en`). Consultar esa tabla para ver quién anuló o editó cada registro.
- **Cierre de sesión**: Invalidar el token en el backend al hacer logout (lista negra de tokens o sesión en servidor), además de borrar el token en el cliente.
- **Caducidad**: JWT con `exp` razonable (ej. 8 h) y renovación con refresh token si se desea.
- **CORS**: En producción definir `CORS_ORIGINS` en el backend con la URL del frontend (ej. `https://app.tudominio.com`). Por defecto solo localhost.
- **Rate limiting**: **Implementado** en `POST /api/v1/auth/login`: máximo 10 intentos por IP cada 15 minutos (429 si se excede). Almacén en memoria; con varios workers usar Redis u otro almacén compartido.

---

## Checklist rápido para producción

- [ ] Login real (API que valide credenciales y devuelva token/sesión).
- [ ] Backend exige token en todas las rutas protegidas y valida firma/caducidad.
- [ ] Rol y usuario obtenidos del token en el servidor, no confiar en headers enviados por el cliente para autorización.
- [ ] HTTPS en frontend y backend.
- [ ] Logout invalida la sesión/token en el servidor.
- [ ] CORS y, si aplica, rate limiting configurados.

Con esto tendrás una base de seguridad sólida; el siguiente paso natural es implementar login real y protección de la API con JWT (o sesiones) en el backend.
