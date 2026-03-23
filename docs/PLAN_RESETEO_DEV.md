# Plan Maestro: Agroflow Zero (Reinicio en Rama dev)

**Estrategia:** Limpieza de Deuda Técnica / Reinicio Selectivo.
**Objetivo:** Dejar solo el módulo de Autenticación funcionando y reconstruir el resto con estándares profesionales.

---

## 1. Fase de Poda (Backend)
1.  **Modelos (`app/models/`):**
    *   **CONSERVAR:** `auth.py`, `auditoria.py`, `__init__.py`.
    *   **ELIMINAR:** `catalogos.py`, `operacion.py`, `ref_*.py`, `packing_*.py`, `factura.py`.
2.  **Routers (`app/routers/`):**
    *   **CONSERVAR:** `auth.py`.
    *   **ELIMINAR:** Todo lo demás.
3.  **Scripts:** Mover todos los scripts de carga de Excel y debug a una carpeta `archive/` o eliminarlos.

---

## 2. Fase de Poda (Frontend)
1.  **Pages (`app/`):**
    *   **CONSERVAR:** `login/`, `(dashboard)/layout.tsx`, `page.tsx` (vaciar Dashboard).
    *   **ELIMINAR:** `scanner/`, `historial/`, `packing/`, `referencias/`.
2.  **Componentes:** Eliminar componentes pesados como `BandejaSap`, `ScannerModal` (se reconstruirán).

---

## 3. Base de Datos (Development DB)
1.  **Purga:** Eliminar todas las tablas de la base de datos de desarrollo.
2.  **Migración Única:** Ejecutar `alembic upgrade head` (solo con los modelos de Auth) para crear la tabla de usuarios limpia.
3.  **Seed:** Inyectar solo el usuario Administrador inicial.

---

## 4. El Siguiente Paso: Módulo 1 (LogiCapture V2)
Una vez el ambiente esté limpio, el orden de reconstrucción será:
1.  **Catálogos Maestros** (Choferes, Vehículos, Transportistas) - *Relacionales*.
2.  **Referencia Maestra Unificada** (Excel de Operación).
3.  **Scanner LogiCapture V2**.

---

> [!CAUTION]
> Asegurarse de estar en la rama **`dev`** antes de ejecutar cualquier borrado masivo. La rama `main` de producción debe permanecer INTACTA.
