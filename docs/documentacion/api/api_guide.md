# Guía de Integración de API - LogiCapture 1.0

Esta guía describe cómo consumir los servicios del backend de LogiCapture de forma segura y eficiente.

---

## Información Base

- **Versión del API**: v1
- **Base URL (Local)**: `http://127.0.0.1:8000/api/v1`
- **Documentación Interactiva (Swagger)**: `/docs`
- **Documentación Estática**: `/redoc`

---

## Autenticación

El sistema utiliza **JSON Web Tokens (JWT)** para proteger los endpoints.

### 1. Obtener Token
Realice una petición `POST` a `/auth/login` con las credenciales del usuario.

**Request**:
```json
{
  "usuario": "admin",
  "password": "su-password"
}
```

**Response**:
```json
{
  "access_token": "eyJhbG...",
  "token_type": "bearer",
  "usuario": "admin",
  "rol": "ADMIN"
}
```

### 2. Usar el Token
Para todas las peticiones subsiguientes, incluya el token en las cabeceras HTTP:

`Authorization: Bearer <su_token>`

---

## Endpoints Principales

### Maestros
- `GET /maestros/transportistas`: Lista de transportistas activos.
- `GET /maestros/choferes`: Lista de conductores.
- `POST /maestros/bulk-upload`: Carga masiva mediante archivo Excel.

### LogiCapture (Operaciones)
- `POST /logicapture/registro`: Crear un nuevo registro de salida con precintos.
- `GET /logicapture/bandeja`: Obtener el historial de operaciones según filtros.
- `GET /logicapture/pdf/{id}`: Generar reporte OGL (Packing List) en formato PDF.

---

## Formato de Respuesta de Error

En caso de error, el API responderá con un código HTTP (4xx o 5xx) y un cuerpo JSON estandarizado:

```json
{
  "detail": "Descripción del error para el usuario"
}
```

*Nota: Para errores de validación (422), el campo `detail` contendrá un array con los campos específicos que fallaron.*

---

## Consejos de Integración

1. **Keep-Alive**: No abra y cierre conexiones por cada petición; use una sesión persistente si es posible.
2. **Timeouts**: Configure un timeout de al menos 30 segundos, especialmente para endpoints que generan PDFs o procesan OCR.
3. **CORS**: Asegúrese de que el origen de su frontend esté incluido en la lista blanca de `CORS_ORIGINS` del backend.
