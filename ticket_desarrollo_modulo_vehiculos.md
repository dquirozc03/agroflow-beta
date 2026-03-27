# 📋 TICKET DE ARQUITECTURA: Módulo de Gestión de Vehículos (Tractos y Carretas)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** ALTA (Módulo Operativo Crítico)

---

## 🛑 Objetivo Estructural
Construir la capa de gestión de unidades de transporte vinculadas a los datos maestros de transportistas. El sistema debe permitir el registro, edición y control de estado de Tractos (Power Units) y Carretas (Trailers).

---

## 🛠️ Fase 1: Backend (FastAPI / SQLAlchemy)

### 1. Modelos de Datos (Confirmación)
Utilizar los modelos ya existentes en `app.models.maestros`: `VehiculoTracto` y `VehiculoCarreta`.

### 2. Endpoints Críticos (Router: `/api/v1/maestros/vehiculos`)
Implementar los siguientes controladores CRUD:
- `GET /tractos`: Listado completo con filtrado por placa o transportista.
- `GET /carretas`: Listado completo de remolques.
- `POST /tractos` / `POST /carretas`: Creación validada (Placa única y obligatoria).
- `PUT /vehiculos/{id}`: Edición de ficha técnica (Marca, Modelo, Ejes, Pesos).
- `PATCH /vehiculos/{id}/estado`: Cambio de estado (ACTIVO / INACTIVO).

### 3. Servicio de OCR: Parser de TIV
En `ocr_service.py`, añade la función `parse_tiv_data(text)` especializada en Tarjetas de Identificación Vehicular (MTC/SUNARP).
- **Target Fields:** PLACA (regex estricto), MARCA, MODELO, EJES, PESO NETO.
- **Endpoint:** `POST /api/v1/maestros/ocr/tiv`.

---

## 🎨 Fase 2: Frontend (Next.js / Radix UI)

### 1. Estructura de Página (`frontend/app/maestros/vehiculos/page.tsx`)
-   **Layout:** Usar el tema Emerald de Agroflow.
-   **Pestañas (Tabs):** [TRACTOS] [CARRETAS] para separar la visualización de la flota.
-   **Tabla:** Buscador reactivo por placa y nombre de la empresa.

### 2. Componente `VehiculoModal`
-   Formulario dinámico que sirva tanto para Tractos como para Carretas.
-   **Relación:** Selector (Select/Combobox) para elegir el Transportista dueño de la unidad.
-   **Inteligencia:** Incorporar el componente de OCR diseñado hoy (con selector de modo) para facilitar el llenado de la ficha técnica desde la foto de la TIV.

---

## ✅ Criterios de Aceptación
1. [ ] El usuario puede registrar un Tracto vinculándolo a un Transportista existente.
2. [ ] El sistema bloquea el registro de placas ya existentes (Validación de Backend).
3. [ ] El OCR extrae correctamente la placa de una imagen de TIV.
4. [ ] El diseño visual es consistente con el módulo de Transportistas (Premium UI).

---
> **Nota para el Coder:** Favor de revisar `maestros.py` antes de empezar; el modelo SQLAlchemy especifica relaciones de 1 a muchos (Transportista -> Tractos/Carretas). Asegura la integridad referencial.
