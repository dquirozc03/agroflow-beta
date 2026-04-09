# Reporte General de Estado Técnico y Documentación

**Proyecto:** BETA LogiCapture 1.0 (Rama DEV)
**Fecha:** 9 de Abril, 2026

---

## 1. Visión General
BETA LogiCapture 1.0 es una plataforma de logística (fase 2 de la evolución hacia AgroFlow) que opera bajo un modelo cliente-servidor. El proyecto se basa en tecnologías modernas y robustas, orientadas a la escalabilidad, el tipado fuerte y la rápida respuesta en arquitecturas de backend eficientes.

## 2. Tecnologías Principales (Tech Stack)

### 2.1 Backend (Directorio: `/backend`)
*   **Framework Core:** FastAPI (v0.128.0) corriendo bajo Python 3.x.
*   **Base de Datos:** PostgreSQL.
*   **ORM y Migraciones:** SQLAlchemy para modelado de datos y Alembic para el control de versiones y migraciones.
*   **Procesamiento de Datos:** Uso intensivo de `pandas`, `numpy` y `openpyxl` (exceljs) para reportes y transformaciones estructuradas.
*   **Gestión de PDFs:** Implementación vía `weasyprint`, `reportlab` y `pdf2image`.
*   **Autenticación:** Seguridad implementada con `PyJWT` y cifrado de `bcrypt`.

### 2.2 Frontend (Directorio: `/frontend`)
*   **Framework Core:** Next.js (v14.2) empleando App Router.
*   **Librería Principal:** React 18.3.1 con TypeScript (tipos estrictos).
*   **Capa de Estilos y Diseño:** Tailwind CSS (v3.4), `class-variance-authority`, y `clsx` para control de clases utilitarias.
*   **Sistema de Componentes:** Componentes accesibles base de Radix UI (`@radix-ui/react-*`), fusionados en una arquitectura estilo "shadcn/ui".
*   **Gestión de Formularios:** `react-hook-form` con validaciones de esquemas centralizados mediante `zod`.
*   **Hardware / Scanners:** Biblioteca `html5-qrcode` para integraciones OCR y códigos de barras en dispositivo.

---

## 3. Estructura de Lógica de Negocios y Módulos Activos

El backend actualmente orquesta los siguientes módulos operativos (según la carga de `main.py`):
1.  **Auth (`/auth`):** Gestión de sesiones y seguridad.
2.  **Sync (`/sync`):** Sincronización de bases de datos maestras con el cerebro de operaciones.
3.  **Maestros (`/maestros`):** Panel fuerte con CRUD para clientes, contenedores y entidades base.
4.  **Vehículos (`/vehiculos`):** Registro detallado de transporte y modales de filtrado.
5.  **LogiCapture (`/logicapture`):** El módulo clave de captura y escaneo rápido.
6.  **Instrucciones de Embarque (`/instrucciones`):** Operaciones complejas de importación y embarque.
7.  **Packing List (`/packing_list`):** Manejo logístico y empaquetado OGL.

---

## 4. Estado de la Documentación (Lo que Falta)

A pesar de tener un desarrollo muy estructurado bajo Clean Code y SOLID, el área de documentación técnica requiere mejoras urgentes tras la limpieza general:

1.  **Archivo Maestro `README.md` (Desactualizado):** Requiere una reescritura que cubra pasos de despliegue, configuración de variables de entorno (los `.env.example`) e inicialización de la DB de DEV.
2.  **Glosario y Contexto de Negocios (`wiki/` o `docs/negocio`):** Falta mapear explícitamente términos clave ("DAM", "IE", "Cerebro") con los que el código opera todos los días.
3.  **Documentación de API:** Aunque FastAPI expone localmente un `/docs` útil (Swagger UI), se requiere documentar la lógica profunda de ciertos endpoints que manejan archivos, procesan datos OCR e interactúan con la base de datos de manera directa.
4.  **Guía de Estilos y Convenciones:** Un documento detallado en el frontend sobre las reglas para la creación de modales, alertas premium y flujos de formularios.
5.  **Bitácora Centralizada (`CHANGELOG.md`):** Acabamos de eliminar +30 archivos huérfanos que servían de "tickets". Debemos adoptar un CHANGELOG secuencial limpio o un tracker robusto, no archivos fragmentados.

---

## 5. Recomendación como Technical Writer

> **Importante para el Área de Arquitectura:** 
> Recomiendo iniciar la fase de documentación redactando primero el archivo `README.md` a nivel raíz, estructurar el `CHANGELOG.md` para recuperar nuestra historia de versiones reciente, y generar un `ARQUITECTURA_FRONTEND.md` para estandarizar cómo se desarrollan las nuevas vistas DAMS, previniendo regresiones tecnológicas.
