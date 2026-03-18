# Propuesta de Requerimientos Técnicos: Ecosistema AgroFlow

**Dirigido a:** Jefatura de TI / Gerencia de Administración
**Proyecto:** Migración de AgroFlow 1.0 a Infraestructura Corporativa
**Objetivo:** Trasladar la herramienta de automatización a un entorno seguro y controlado por la empresa para eliminar el uso de servicios externos.

---

## 1. Naturaleza del Sistema
AgroFlow es un **Software de Automatización Operativa Independiente**. Su propósito es agilizar las tareas de oficina (pre-guías y post-posicionamiento) que actualmente consumen horas-hombre en digitación manual. 

> [!IMPORTANT]
> El sistema es autónomo: **No requiere conexión directa ni acceso a las bases de datos de SAP.** Su función es preparar y estandarizar la información para el flujo comercial.

## 2. Requerimientos Técnicos

### A. Hosting Interno (Seguridad de la Información)
*   **Servicio:** Espacio en el Tenant de Azure (App Service) y una base de datos PostgreSQL.
*   **Justificación:** Garantizar que los registros de embarques y facturaciones residan exclusivamente en la infraestructura de la empresa, cumpliendo con las normas de privacidad.

### B. Control de Acceso Restringido (Seguridad por Área)
*   **Esquema:** Autenticación por **Nombre de Usuario y Contraseña independiente** (No SSO).
*   **Justificación:** Por razones de confidencialidad del área comercial, el acceso debe estar estrictamente limitado a través de una base de datos de usuarios local. Esto evita que personal de otras áreas de la compañía pueda ingresar al sistema.

## 3. Integración con el Ecosistema Microsoft

Para potenciar la automatización sin incurrir en costos adicionales de licencias Premium, solicitamos acceso a:

### A. SharePoint (Repositorio de Datos)
*   **Permiso Requerido:** Creación de una biblioteca de documentos específica para el área comercial.
*   **Función:** Los operadores subirán los XMLs de facturación aquí. AgroFlow consumirá estos archivos para la extracción de datos inteligente.
*   **Beneficio:** Sustitución definitiva de servicios de terceros (Google Drive).

### B. Power Automate (Notificaciones e Interacción)
*   **Permiso Requerido:** Configuración de un flujo disparado por eventos en SharePoint.
*   **Función:** Envío de alertas automáticas a **Microsoft Teams** o Correo cuando un registro de LogiCapture está listo o requiere corrección.
*   **Beneficio:** Comunicación instantánea del estado de los embarques sin salir del entorno Microsoft.

## 4. Beneficios Operativos
1.  **Reducción de Tiempos:** Automatiza la generación de la IE (Instrucción de Embarque), reduciendo el tiempo de proceso de minutos a segundos.
2.  **Integridad Documentaria:** Actúa como filtro de calidad de datos antes de generar documentos oficiales.
3.  **Trazabilidad:** Proporciona un historial completo de auditoría interna de las operaciones del equipo comercial.

## 5. Conclusión
Este proyecto es una solución autónoma diseñada para maximizar la productividad de la oficina comercial. Solicito a TI el apoyo para el aprovisionamiento de este entorno seguro y los accesos a SharePoint/Power Automate para formalizar esta herramienta dentro del estándar corporativo de la compañía.

---

**Presentado por:** Daniel | Dept. Comercial
**Área:** Operaciones y Logística Comercial
