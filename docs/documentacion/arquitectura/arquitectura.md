# Arquitectura del Sistema - LogiCapture 1.0

## Resumen Ejecutivo
LogiCapture 1.0 (AgroFlow) es una plataforma integral diseñada para la gestión operativa de exportaciones, enfocada en el registro de embarques, control de Packing Lists (OGL) y trazabilidad logística. El sistema adopta una arquitectura desacoplada con un backend robusto en Python y un frontend moderno en React/Next.js.

---

## Stack Tecnológico

### Backend (Capa de Servicios)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - Elegido por su alto rendimiento, validación automática con Pydantic y generación nativa de documentación OpenAPI.
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) - Para una gestión de base de datos robusta y tipada.
- **Base de Datos**: PostgreSQL - Motor relacional para asegurar la integridad de los datos logísticos.
- **Migraciones**: [Alembic](https://alembic.sqlalchemy.org/) - Control de versiones del esquema de base de datos.
- **Autenticación**: JWT (JSON Web Tokens) con expiración y roles definidos.

### Frontend (Capa de Presentación)
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router) - Para una navegación rápida, optimización de renderizado y SEO.
- **Lenguaje**: TypeScript - Garantiza seguridad en el tipado y reduce errores en tiempo de ejecución.
- **Estilos**: Tailwind CSS + [Shadcn/UI](https://ui.shadcn.com/) - Componentes consistentes, accesibles y estéticamente premium.
- **Iconografía**: Lucide React.
- **Validación de Formularios**: React Hook Form + Zod.

---

## Estructura del Proyecto

```text
.
├── backend/                # API REST y Lógica de Negocio
│   ├── app/
│   │   ├── models/         # Definiciones de SQLAlchemy
│   │   ├── schemas/        # Validaciones Pydantic (DTOs)
│   │   ├── routers/        # Endpoints de la API
│   │   ├── services/       # Lógica de negocio compleja
│   │   └── core/           # Configuración y seguridad
│   └── scripts/            # Utilidades de DB y Ops
├── frontend/               # Interfaz de Usuario
│   ├── app/                # Rutas y Páginas (Next.js App Router)
│   ├── components/         # Componentes React reutilizables
│   ├── lib/                # Utilidades, Hooks y Cliente API
│   └── public/             # Recursos estáticos
└── docs/                   # Documentación oficial del proyecto
```

---

## Flujo de Datos

1. **Petición**: El usuario interactúa con la interfaz en Next.js.
2. **Cliente API**: Las peticiones se centralizan en `frontend/lib/api.ts`, gestionando tokens de portador (Bearer Tokens).
3. **Validación**: FastAPI recibe la petición, valida los tipos con Pydantic Schemas y verifica la autorización.
4. **Negocio**: La lógica reside principalmente en los `services`, interactuando con la base de datos a través de SQLAlchemy.
5. **Respuesta**: Se retorna un JSON estandarizado que el frontend procesa para actualizar la UI.

---

## Seguridad
- **CORS**: Configurado para permitir únicamente orígenes autorizados.
- **Hashing**: Contraseñas protegidas con `bcrypt`.
- **Validación**: Doble capa de validación (Frontend con Zod y Backend con Pydantic).
