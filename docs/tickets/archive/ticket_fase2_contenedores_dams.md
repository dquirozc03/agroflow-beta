# 📋 TICKET DE ARQUITECTURA: Fase 2 - UI "Contenedores y Dam's" (Sanitización y OCR)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** CRÍTICA (Cierre de Módulo de Datos Maestros)

---

## 🛑 Objetivo Estructural
Finalizar la interfaz de usuario para la gestión de embarques, renombrando el módulo a **"Contenedores y Dam's"** y asegurando la integridad de los datos mediante la purga de columnas innecesarias en Supabase.

---

## 🛠️ Fase 0: Saneamiento de Base de Datos (Supabase)
Antes de tocar el frontend, es imperativo purificar la tabla:
- **Acción:** Ejecutar en el SQL Editor de Supabase:
  ```sql
  ALTER TABLE control_embarque DROP COLUMN IF EXISTS cultivo;
  ```

---

## 🛠️ Fase 1: Desarrollo de Interfaz (Next.js)

### 1. Refactor de Navegación (`frontend/components/app-sidebar.tsx`)
- **Nombre:** "Contenedores y Dam's".
- **Icono:** `Package` (Lucide React).
- **Ruta:** `/maestros/contenedores-dams`.

### 2. Página Maestra (`frontend/app/maestros/contenedores-dams/page.tsx`)
Construir la vista principal siguiendo el estándar de Agroflow:
- **Filtro:** Buscador dinámico por Booking o Contenedor.
- **Tabla Semántica:** Encabezados centrados, líneas sutiles (`border-slate-100/50`).
- **Estados:** Manejo de "Cargando..." y "Empty State" (No hay registros).

### 3. Modal Inteligente (`frontend/components/contenedores-modal.tsx`)
- **Sanitización Real-Time:** El input de "Contenedor" debe limpiar espacios y caracteres no alfanuméricos en cada `onChange`.
- **OCR Selectivo:**
  - Botón "Chispas" (Sparkles) en DAM -> Busca patrones tipo `127-202X-...` en PDFs.
  - Botón "Chispas" (Sparkles) en Contenedor -> Busca patrones ISO (4 letras + 7 números).
- **Soporte Clipboard:** Listener de `paste` para capturar imágenes y procesarlas vía backend `/api/v1/maestros/ocr/embarque`.

---

## ✅ Criterios de Aceptación
1. [ ] La tabla en Supabase **NO** tiene la columna `cultivo`.
2. [ ] El UI muestra "Contenedores y Dam's" en el sidebar y el título.
3. [ ] El OCR extrae correctamente DAMs desde PDF de Aduanas.
4. [ ] No se permiten DAMs duplicadas (validación de backend).

---
> **Nota para el Coder:** Favor de asegurar que el ruteo interno apunte a `/maestros/contenedores-dams` para mantener la coherencia con el nombre del módulo.
