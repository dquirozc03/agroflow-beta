# 📋 TICKET DE DESARROLLO: Implementación Módulo Pesos y Medidas (Anexo 1)

**Asignado a:** Equipo Fullstack (Backend PDF + Frontend Modals)
**Estado:** PENDIENTE
**Componente:** LogiCapture / Documentación Legal

---

## 🎯 Objetivo General
Desarrollar la funcionalidad de generación automática del **Anexo 1 (Pesos y Medidas)** para vehículos de carga, integrando datos de maestros de transporte, pesajes dinámicos y la identidad corporativa de Beta.

---

## 🛠️ Tareas Técnicas

### 1. Backend: Servicio de PDF (`ReportLab`)
- **Nuevo Archivo**: `backend/app/services/pesos_medidas_service.py`
- **Requisitos**:
    - Replicar el diseño del archivo `PESOS Y MEDIDAS.pdf`.
    - Datos estáticos: Empresa: Complejo Agroindustrial Beta S.A. / RUC: 20297939131 / Tel: 056-581150.
    - Datos dinámicos (Maestros): Placas, Ejes, Pesos Netos (Vehículo), Dimensiones.
    - Datos dinámicos (Input): Peso Bruto, Peso Tara (Contenedor), Peso Neto (Carga).

### 2. Backend: API Endpoint
- **Archivo**: `backend/app/routers/logicapture.py`
- **Endpoint**: `POST /api/v1/logicapture/registros/{id}/anexo1`
- **Función**: Recibir pesos ingresados por el usuario, buscar data técnica en maestros de vehículos y generar el PDF.

### 3. Frontend: Modal de Pesaje ("Anexo 1 Config")
- **Nuevo Componente**: `frontend/components/pesos-medidas-modal.tsx`
- **Diseño**:
    - Campos pre-llenados con data de maestros.
    - Inputs editables para Pesos (Tara/Bruto).
    - Lógica de suma automática: `Bruto = Tara Vehículo + Tara Contenedor + Neto Carga`.

### 4. Frontend: Integración en Bandeja
- **Archivo**: `frontend/app/logicapture/bandeja/page.tsx`
- **Acción**: Añadir icono de báscula/camión en el menú de cada fila con disparador al nuevo modal.

---

## ✅ Criterios de Aceptación
1. [ ] El PDF generado es idéntico en estructura al de referencia oficial.
2. [ ] Si el vehículo no existe en el maestro, el PDF se genera con los campos técnicos en blanco (sin error 500).
3. [ ] La descarga es instantánea tras confirmar el pesaje en el modal.

---
> **Nota del Arquitecto:** "Este anexo es un documento crítico para evitar multas del MTC. La precisión en los cálculos automáticos es prioridad #1."
