# 📋 TICKET DE ARQUITECTURA: Módulo de Control de Embarque (Sincronización y OCR)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** ALTA (Módulo Logístico Crítico)

---

## 🛑 Objetivo Estructural
Implementar el módulo de gestión de embarques integrado en "Datos Maestros", permitiendo la carga automatizada de Bookings, DAMs y Contenedores desde Excel y la captura rápida vía OCR selectivo.

---

## 🛠️ Fase 1: Backend (Supabase / SQLAlchemy)

### 1. Modelo de Datos (`app.models.embarque.ControlEmbarque`)
Crear la entidad con la siguiente estructura:
- `id`: PK (Entero)
- `booking`: String (Indexado)
- `dam`: String (**UNIQUE Index**) - Identificador unívoco por despacho.
- `contenedor`: String (Identificador físico de unidad).
- Auditoría básica (`fecha_creacion`, `fecha_actualizacion`).

### 2. Lógica de Sanitización (Regla de Oro)
Antes de persistir el dato `contenedor`, el sistema debe **limpiarlo obligatoriamente**:
- Eliminar espacios, guiones, barras y caracteres especiales.
- Convertir a **MAYÚSCULAS**.
- *Ejemplo:* `MEDU 123-456 7` -> `MEDU1234567`.

### 3. API & Bulk Upload
- **Carga Masiva:** Modificar `bulk_upload_transportistas` en `maestros.py` para capturar:
    - Columna B (Index 1) -> `booking`
    - Columna C (Index 2) -> `dam`
    - Columna D (Index 3) -> `contenedor`
- **OCR:** Implementar `POST /api/v1/maestros/ocr/embarque` con lógica selectiva para extraer número de DAM (pattern SUNAT) y Contenedor (ISO 11 chars).

---

## 🎨 Fase 2: Frontend (Next.js / UI Premium)

### 1. Página Maestro (`frontend/app/maestros/control-embarque/page.tsx`)
- Tabla simétrica con encabezados centrados.
- Buscador reactivo por Booking, DAM o Contenedor.
- Botones de acción premium (Edición/Estado).

### 2. Modal de Registro (`EmbarqueModal`)
- Incorporar disparadores inteligentes para OCR en los campos de DAM y Contenedor.
- Soporte para **Pegado Directo (Ctrl+V)** con selector de destino de campo.

---

## ✅ Criterios de Aceptación
1. [ ] El sistema bloquea la carga de DAMs duplicadas (Unicidad en DB).
2. [ ] El dato del contenedor se guarda siempre limpio y en mayúsculas.
3. [ ] El Excel de Asignación puebla correctamente la tabla de embarques.
4. [ ] El OCR extrae correctamente números de DAM desde archivos PDF.

---
> **Nota para el Coder:** Favor de usar una función de utilidad `clean_container_code()` reutilizable para asegurar la consistencia del dato en todo el sistema.
