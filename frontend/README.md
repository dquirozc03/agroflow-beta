# AgroFlow Frontend

Interfaz web del sistema AgroFlow V2 - dashboard operativo para logistica agroexportadora.

## Tech Stack

- **Framework:** Next.js 14.2 (App Router)
- **UI:** React 18.3 + TypeScript
- **Estilos:** Tailwind CSS 3.4
- **Componentes:** shadcn/ui (Radix UI primitives)
- **Formularios:** react-hook-form + zod
- **Graficos:** Recharts
- **Scanner/QR:** html5-qrcode + qrcode.react
- **Excel:** exceljs + xlsx

## Estructura del Proyecto

```
├── app/
│   ├── login/                    # Pagina de login
│   ├── logicapture/              # Registro y bandeja de salidas
│   ├── operaciones/
│   │   ├── instrucciones/        # Instrucciones de embarque
│   │   └── packing-list/         # Packing list OGL
│   ├── maestros/
│   │   ├── bulk-upload/          # Carga masiva
│   │   ├── choferes/             # CRUD choferes
│   │   ├── clientes-ie/          # CRUD clientes IE
│   │   ├── contenedores-dams/    # CRUD contenedores
│   │   ├── plantas/              # CRUD plantas
│   │   ├── transportistas/       # CRUD transportistas
│   │   └── vehiculos/            # CRUD vehiculos
│   ├── configuracion/
│   │   ├── usuarios/             # Gestion de usuarios (admin)
│   │   └── roles/                # Gestion de roles (admin)
│   ├── api/v1/[...path]/         # Proxy route al backend
│   ├── layout.tsx                # Layout raiz
│   └── globals.css               # Estilos globales
├── components/
│   ├── ui/                       # shadcn/ui (~40 componentes)
│   ├── auth-guard.tsx            # Proteccion de rutas
│   ├── session-timeout.tsx       # Expiracion automatica
│   ├── app-sidebar.tsx           # Navegacion lateral
│   ├── app-header.tsx            # Header principal
│   └── *-modal.tsx               # Modales de CRUD
├── contexts/
│   ├── auth-context.tsx          # Autenticacion JWT
│   └── backend-status-context.tsx # Estado del backend
├── hooks/
│   ├── use-scanner.ts            # Scanner de codigos
│   ├── use-ocr.ts                # OCR con camara
│   └── use-mobile.tsx            # Deteccion mobile
├── lib/                          # API client, constants, utils
├── public/                       # Assets estaticos
├── styles/                       # Estilos adicionales
├── bootstrap.bat                 # Setup (npm install)
├── start.bat                     # Arranque (npm run dev)
├── next.config.mjs               # Config Next.js + proxy API
├── tailwind.config.ts            # Config Tailwind
└── tsconfig.json                 # Config TypeScript
```

## Setup Local

### Prerrequisitos

- Node.js LTS ([descargar](https://nodejs.org/en/download))
- Backend corriendo en http://127.0.0.1:8000

### 1. Configurar variables de entorno

Crear archivo `.env.local` en la raiz:

```env
API_PROXY_TARGET=http://127.0.0.1:8000
```

### 2. Bootstrap (primera vez)

```bash
bootstrap.bat
```

Esto instala las dependencias con `npm install`.

### 3. Arrancar el servidor

```bash
start.bat
```

O manualmente:

```bash
npm run dev
```

App disponible en http://localhost:3000

## Autenticacion

- JWT almacenado en localStorage
- `AuthGuard` protege todas las rutas (excepto login)
- `SessionTimeout` expira la sesion automaticamente
- Retry con `wakeBackend()` para cold starts del backend
- Permisos granulares por sub-modulo (JSON en usuario)

## Proxy API

El frontend proxea todas las llamadas `/api/v1/*` hacia el backend via `next.config.mjs` (rewrites). La variable `API_PROXY_TARGET` define la URL destino.
