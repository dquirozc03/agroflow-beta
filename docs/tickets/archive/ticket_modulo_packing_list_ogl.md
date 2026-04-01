# 📋 TICKET DE DESARROLLO: Módulo Packing List Customizado (OGL)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Inge Daniel approved)
**Prioridad:** ALTA / OPERATIVA

---

## 🎯 Objetivo
Desarrollar un módulo en "Gestión Operativa" para generar automáticamente el Packing List de OGL, cruzando datos de la base de datos con archivos Excel externos de Confirmación y Termógrafos.

---

## 🛠️ Fase 1: Backend & Motor de Excel

1. **Dependencias:** Instalar `openpyxl` y `pandas`.
2. **Router (`app/routers/packing_list.py`):**
   - **GET `/naves`**: Listar naves únicas. 
     - *REGLA:* Priorizar `reporte_embarques.nave_arribo`. Si es vacío/null, usar `posicionamientos.NAVE`.
     - *FILTRO:* Solo incluir naves con órdenes del cliente "OGL".
   - **POST `/generate/ogl`**:
     - Cargar `backend/assets/templates/FORMATO PL - OGL.xlsx`.
     - Llenar Header (C3-C17) con datos de `PedidoComercial` y `Posicionamiento`.
     - Llenar Grid (Desde Fila 20) con datos de la **Confirmación** (ID Pallet, Calibre, Kilos, Cosecha, Proceso, Lote) y **DB** (Contenedor, Variedad, Cajas).
     - *RESTRICCIÓN:* Usar `openpyxl` para no alterar celdas bloqueadas ni formatos del cliente.

---

## 🎨 Fase 2: Frontend (UI Carlos Style)

1. **Sidebar:** Añadir "Packing List" bajo "Gestión Operativa".
2. **Página:** `/app/operaciones/packing-list/page.tsx`
3. **Componentes:**
   - **Selector de Nave:** Con búsqueda y visualización de la jerarquía aplicada.
   - **Lista de Órdenes:** Mostrar Bookings de OGL detectados para la nave elegida.
   - **Uploaders:** Espacio para subir múltiples archivos de Confirmación y Cuadro de Termógrafos.
   - **Botón Acción:** "Generar Packing List OGL" (Primary Emerald).

---

## 🗄️ Lógica de Mapeo Clave (OGL)
- **C8 (Vessel):** Aplicar jerarquía (Reporte -> Posicionamiento).
- **C12 (Port Origin):** Tomar de `port_id_orig`.
- **C14 (Port Dest):** Tomar de `port_id_dest`.
- **Fila 20+ (Grid):** 
  - `Pallet-ID`: Tomar `ID PALLET (HU)` de la confirmación.
  - `Container No.`: Tomar de `ControlEmbarque` (Formato: "MEDU 9144085").
  - `Net Weight`: Tomar de `TOTAL KILOS` (Confirmación).
  - `Gross Weight`: `TOTAL CAJAS` * 4.2.

---

## ✅ Criterios de Aceptación
1. [ ] El sistema filtra correctamente solo órdenes de OGL.
2. [ ] La nave se toma correctamente según la jerarquía establecida.
3. [ ] El Excel resultante abre sin errores y mantiene los bloqueos de OGL.
4. [ ] La UI permite una gestión fluida de múltiples despachos.

---
> **Nota:** Mantener la estética premium del sistema AgroFlow.
