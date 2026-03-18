# Manual Técnico Integral: Ecosistema AgroFlow 1.0

Este documento proporciona una visión profunda y técnica de la arquitectura, tecnologías y lógica de negocio del sistema AgroFlow, diseñado para el Complejo Agroindustrial Beta.

## 1. Arquitectura General
El sistema sigue una arquitectura de **Desacoplamiento Total** entre el cliente y el servidor:

- **Frontend (Cliente):** Aplicación de una sola página (SPA) construida con **Next.js 14** y **React**. Se encarga de la interfaz de usuario, validaciones en el navegador y generación de reportes locales.
- **Backend (Servidor):** API RESTful construida con **FastAPI (Python)**. Se encarga de la lógica de negocio, persistencia de datos y seguridad mediante **Token JWT con acceso por nombre de usuario**.
- **Base de Datos:** Relacional (**PostgreSQL** en producción / SQLite en desarrollo), gestionada mediante el ORM **SQLAlchemy**. Esta base de datos es independiente y autónoma.

---

## 2. Definición del Proyecto
AgroFlow es un **Ecosistema de Automatización Independiente**. 
- **NO reemplaza a SAP.**
- **NO requiere conexión directa (API/DB) con SAP.**
- **Función:** Es una herramienta puente que digitaliza procesos de oficina altamente manuales, reduciendo los tiempos de ejecución y preparando la información para tareas posteriores como la generación de la IE.

### Backend (Python)
- **FastAPI:** Elegido por su altísimo rendimiento y validación automática de datos mediante **Pydantic**.
- **SQLAlchemy:** Mapeo Objeto-Relacional (ORM) que permite interactuar con la base de datos usando objetos Python en lugar de queries SQL manuales.
- **Alembic:** Sistema de migraciones para versionar los cambios en la base de datos.
- **JWT (JSON Web Tokens):** Estándar de seguridad para manejar sesiones de usuario sin estado.

### Frontend (TypeScript / React)
- **Next.js + TailwindCSS:** Para una UI extremadamente rápida y con diseño "Tecnológico/Premium".
- **Lucide React:** Set de iconos minimalistas.
- **ExcelJS:** Librería de alto nivel para generar archivos `.xlsx` reales con formato profesional (colores, bordes, filtros).
- **Zustand / Context API:** Gestión del estado global y autenticación.

---

## 3. Estructura de Datos (Modelos Clave)

### `RegistroOperativo` (`app/models/operacion.py`)
Es el corazón de **LogiCapture**. Almacena:
- Datos de transporte (Placas, Transportista).
- Datos del conductor (DNI, Nombres, Licencia).
- Datos de seguridad específicos de Beta (Precintos, Termógrafos).
- Estado del registro: `PENDIENTE`, `PROCESADO`, `ANULADO`.

### `FacturaLogistica` (`app/models/factura.py`)
Gestiona la información extraída de los XML de proveedores:
- Datos fiscales (RUC, Razón Social, Serie/Correlativo).
- Detalle de servicios y montos.
- **Lógica de Validación:** Compara lo detectado en el XML contra las reglas de Beta para asignar estados de advertencia.

---

## 4. Módulos Técnicos Detallados

### A. Módulo LogiCapture (Captura y Validación)
Ubicación: `frontend/components/cards/card-operacion.tsx` y `backend/app/routers/registros.py`.
- **Funcionamiento:** Envía un objeto JSON al servidor. El servidor valida que campos críticos como placas o conductores existan en los catálogos antes de guardar.
- **Unicidad:** Antes de insertar, el backend consulta si ya existe un registro activo para ese contenedor o reserva, evitando duplicidad.

### B. Generador de Excel Premium
Ubicación: `frontend/components/historial-registros.tsx` (Función `exportHistorial`).
- **Lógica:** No es una simple descarga. La función crea un "Libro de Excel" en memoria, define estilos de celda (Slate 800 para cabeceras, centrado, bordes) y activa propiedades avanzadas como `wrapText` (ajuste de texto) y `autoFilter`.

### C. Sistema de Historial y Auditoría
Ubicación: `backend/app/routers/auditoria.py` y `app/routers/registros.py`.
- **Paginación:** El servidor solo envía de a 10 registros (o lo solicitado) para que la App no sea pesada.
- **Búsqueda Global:** Realiza filtros complejos en SQL usando la cláusula `LIKE` para buscar coincidencias rápidas en múltiples columnas (Booking, Contenedor, Transportista).

---

## 5. Seguridad y Sesiones
- **Encriptación:** Las contraseñas se guardan usando el algoritmo **Passlib (bcrypt)**.
- **Acceso Controlado del Área:** El sistema utiliza un esquema de **Usuario/Contraseña independiente** gestionado localmente. Esto garantiza que el acceso esté estrictamente limitado al personal autorizado del área comercial, evitando que cualquier usuario corporativo pueda ingresar.
- **Middleware:** La API tiene un "Portero" (Middleware de CORS) que solo permite peticiones desde el dominio oficial de la empresa.

---

## 6. Flujo de Información
1. **Input:** El administrativo carga datos en **LogiCapture**.
2. **Procesamiento:** El sistema guarda y marca como "Pendiente".
3. **Validación:** En la **Bandeja SAP**, se revisa la información. Al marcar como "Listo", el estado cambia a "Procesado".
4. **Output:** En el **Historial**, se selecciona el rango de fecha y se genera el Excel.

---

## 7. Mantenimiento y Escalabilidad
- **Nuevos Campos:** Para agregar un campo (ej. "N° de Precinto Extra"), se debe actualizar el Modelo en el Backend y la Interfaz en el Frontend.
- **Integración SAP:** El sistema está preparado para que, en lugar de exportar Excel, se conecte mediante un servicio `requests` (en Python) directamente a un endpoint de SAP.

---
**Desarrollado para:** Complejo Agroindustrial Beta.
**Encargado de Solución:** Daniel.
