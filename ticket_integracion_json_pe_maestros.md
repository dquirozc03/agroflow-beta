# 📋 TICKET DE ARQUITECTURA: Integración Crítica (Placas y Licencias - Json.pe)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** ALTA (Foco: Operación Vehicular y Choferes)

---

## 🛑 Objetivo Estructural
Implementar servicios de validación y captura automática para **Vehículos (Placas)** y **Choferes (Licencias)** utilizando la API de `Json.pe`. Se aplica la **Opción A (Población Silenciosa)**: si el dato no existe localmente, se consulta afuera y se persiste de inmediato en la DB de maestros.

---

## 🛠️ Fase 1: Backend (FastAPI)

### 1. Endpoints de Consulta Externa (`app/services/external_apis.py`)
Implementar los métodos de llamada a `api.json.pe` con el Token de autorización Bearer:

*   **POST `/api/placa`**:
    - Input: `{"placa": "string"}`
    - Mapping: `marca`, `modelo`, `color`, `serie`, `motor` -> Guardar en `VehiculoTracto` o `VehiculoCarreta`.
*   **POST `/api/licencia`**:
    - Input: `{"dni": "string"}`
    - Mapping: `nombre_completo` -> `nombre_chofer`, `licencia.categoria` -> `categoria`, `licencia.fecha_vencimiento` -> `vencimiento_licencia`, `licencia.estado` -> `estado_legal`.

### 2. Logica de Persistencia Automática
El resolver debe asegurar que, tras una consulta exitosa a la API, se cree el registro en la tabla maestra correspondiente (Vehículos o Choferes) para evitar consultas redundantes en el futuro.

---

## 🎨 Fase 2: Frontend (Next.js)

### 1. Componentes de Consulta
-   **Vehículos:** En el campo Placa, añadir icono de búsqueda que llame al motor de resolución.
-   **Choferes:** En el campo DNI, añadir icono de consulta que autocompleta el nombre y datos de licencia.

---

## ✅ Criterios de Aceptación
1. [ ] El sistema llena la ficha del vehículo automáticamente al ingresar una placa nueva desde Logicapture o Maestros.
2. [ ] El sistema valida la vigencia de la licencia del chofer usando el DNI y guarda los resultados en la DB.
3. [ ] El Token de API no se expone al cliente (Frontend); todas las peticiones pasan por el Backend.

---
> **Nota para el Coder:** Favor de implementar manejadores de excepciones robustos para casos de "Placa No Encontrada" o "Servicio MTC Caído" para no bloquear el flujo del usuario.
