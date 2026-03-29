# 📋 TICKET DE DESARROLLO: Módulo Clientes IE (Opción Limpia)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Inge Daniel approved)
**Prioridad:** ALTA

---

## 🛑 Objetivo Estructural
Implementar el maestro de Clientes IE con una arquitectura normalizada de dos tablas relacionadas, gestionadas desde un solo formulario frontal con pestañas (Tabs).

---

## 🛠️ Fase 1: Backend (Base de Datos y API)

### 1. Modelos SQLAlchemy (`app/models/maestros.py`)
- **`ClienteIE`:** `id`, `nombre_legal`, `pais`, `destino`, `consignatario_bl`, `direccion_consignatario`, `notify_bl`, `eori_consignatario`, `eori_notify`, `emision_bl`.
- **`ClienteIEFito`:** `id`, `cliente_ie_id` (FK), `consignatario_fito`, `direccion_consignatario_fito`.
- **Relación:** Establecer `relationship` 1:1 entre ambos modelos.

### 2. Router (`app/routers/clientes_ie.py`)
- Implementar CRUD completo para manejar ambas tablas en una sola transacción atómica.

---

## 🎨 Fase 2: Frontend (Interfaz Premium)

### 1. Pantalla Maestra (`/maestros/clientes-ie`)
- **Tabla:** Mostrar columnas principales. En la columna de "Cliente", mostrar los datos concatenados: `{nombre_legal} | {pais} | {destino}` para identificar claramente la ruta.
- **Acciones Especiales:** Implementar botón **Duplicar Cliente** para facilitar la creación de nuevas rutas basadas en datos existentes.

### 2. Formulario en Pestañas (Tabs)
- **Instrucciones BL:** Todos los campos de la tabla principal (aduana/embarque).
- **Fitosanitario:** Campos específicos para el certificado fitosanitario.

---

## ✅ Criterios de Aceptación
1. [ ] Se puede registrar un cliente y sus datos fitosanitarios simultáneamente.
2. [ ] El sistema permite múltiples registros para el mismo cliente diferenciándolos por país/destino.
3. [ ] El listado es claro y permite identificar la configuración específica de cada ruta.

---
> **Nota del Arquitecto:** Favor de sincronizar los modelos usando `sync_db.py` antes de iniciar el desarrollo del frontend.
