# 📋 TICKET DE DESARROLLO: Optimización Cronológica y Paginación (Contenedores y DAM)

**Asignado a:** Desarrollador Senior / Fullstack
**Estado:** PENDIENTE
**Prioridad:** ALTA / PERFORMANCE

---

## 🎯 Objetivo General
Transformar el listado de maestros de "Contenedores y DAM" en un módulo de alto rendimiento mediante la implementación de paginación eficiente en backend y frontend, asegurando que la información más reciente siempre aparezca primero y eliminando el ruido visual de filtrados manuales innecesarios.

---

## 🛠️ Tareas de Backend (FastAPI / SQLAlchemy)

### 1. Implementar Paginación Estructural
- **Archivo:** `backend/app/routers/maestros.py`
- **Cambio en Endpoint `GET /api/v1/maestros/embarques`**:
    - Agregar parámetros de consulta: `page: int = 1` y `size: int = 20`.
    - **Lógica de Orden**: El query **DEBE** incluir obligatoriamente `.order_by(ControlEmbarque.fecha_creacion.desc())` para que los registros más recientes estén arriba (Requerimiento Crítico).
    - **Cálculo de Offset**: `(page - 1) * size`.
    - **Respuesta Enriquecida**: Ya no devolver una lista simple. Devolver un objeto estructurado que incluya `items`, `total_records`, `page` y `total_pages`.

---

## 🛠️ Tareas de Frontend (Next.js)

### 1. Sistema de Paginación y Limpieza de UI
- **Archivo:** `frontend/app/maestros/contenedores-dams/page.tsx`
- **Control de Estado**: Implementar estados para `currentPage` y `totalPages` para gestionar la navegación.
- **Fetch Paginado**: Ajustar la función `fetchEmbarques` para pasar el `page` y `size` en la petición.
- **Limpieza de Interfaz**: Eliminar botones o interruptores de ordenamiento manual (sort). El usuario no los necesita, ya que el sistema viene ordenado por fecha de creación descendentemente por defecto.
- **Componente de Navegación**: Añadir botones de "Anterior" y "Siguiente" al final de la tabla con un diseño que combine con el ambiente oscuro y elegante (ej: `hover:bg-emerald-500`).

---

## ✅ Criterios de Aceptación
1. [ ] Al cargar la página, se muestran los 20 registros más recientes (orden cronológico reversivo).
2. [ ] Se puede navegar a la página 2 y posteriores correctamente.
3. [ ] No hay botones de "ordenar por" que distraigan o rompan el diseño cronológico solicitado.
4. [ ] La barra de búsqueda maestra sigue funcionando, reiniciando la paginación a la página 1 cuando se realiza una consulta.

---
> **Nota de Arquitectura:** Esta mejora es fundamental para la escalabilidad del sistema una vez alcancemos miles de despachos registrados.
