# 📋 TICKET DE ARQUITECTURA: Módulo de Gestión de Choferes con Identidad Operativa

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** ALTA (Módulo Maestro Crítico)

---

## 🛑 Objetivo Estructural
Construir la capa de gestión de conductores en el módulo de Datos Maestros. El sistema debe ser capaz de procesar nombres completos desde Excel y transformarlos en una **Identidad Operativa** ágil para el uso cotidiano en AGROFLOW.

---

## 🛠️ Fase 1: Backend (FastAPI / SQLAlchemy)

### 1. Modelo de Datos (`app.models.maestros.Chofer`)
Añadir la entidad con la siguiente estructura atómica:
- `id`: PK (Entero)
- `dni`: String (Unique, Indexado)
- `nombres`: String (Ej: "DANIEL LEONEL")
- `apellido_paterno`: String (Ej: "QUIROZ")
- `apellido_materno`: String (Ej: "CARRASCO")
- `licencia`: String (Brevete)
- `estado`: String (Por defecto: "ACTIVO")

### 2. Lógica de "Nombre Operativo"
Implementar una propiedad calculada (hybrid_property o getter) que devuelva el formato:
**`{Primer Nombre} {Apellido Paterno} {Inicial del Materno}.`**
*Ejemplo:* **DANIEL QUIROZ C.**

### 3. Endpoints Maestros
- `GET /choferes`: Listado que incluya el Nombre Operativo.
- `POST /choferes` / `PUT /choferes/{id}`: Manejo de datos atómicos.

---

## 🎨 Fase 2: Frontend (Next.js / UI Premium)

### 1. Interfaz de Usuario (`frontend/app/maestros/choferes/page.tsx`)
-   **Tabla Maestras:** La columna principal debe ser el **Nombre Operativo** para mayor legibilidad.
-   **Buscador:** Debe permitir filtrar por DNI o cualquiera de los nombres/apellidos.

### 2. Modal de Captura Inteligente (`ChoferModal`)
-   Formulario con los campos de nombres y apellidos separados.
-   **OCR de Licencias:** Incorporar el motor de escaneo inteligente para "Brevetes" que extraiga e inyecte los datos automáticamente en los campos correspondientes.

---

## ✅ Criterios de Aceptación
1. [ ] El sistema guarda nombres y apellidos por separado en la DB.
2. [ ] Las tablas muestran el nombre operativo corto (DANIEL QUIROZ C.).
3. [ ] El diseño visual es consistente con el lenguaje Emerald de Agroflow.
4. [ ] Validación de DNI único activa en el servidor.

---
> **Nota para el Coder:** Favor de asegurar que el parser de Excel tome la cadena completa y asuma que los últimos dos términos son los apellidos Paterno y Materno para la carga masiva inicial.
