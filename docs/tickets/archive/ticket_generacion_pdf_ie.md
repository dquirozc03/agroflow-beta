# 📋 TICKET DE DESARROLLO: Generación PDF Instrucciones de Embarque

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Inge Daniel approved)
**Prioridad:** ALTA

---

## 🎯 Objetivo General
Crear el motor de generación dinámica del documento "Instrucciones de Embarque" en formato PDF, cruzando datos de Posicionamiento, Cuadro de Pedidos y el Maestro de Clientes IE, y aplicando un lavado de cara estético ("Premium Style") a la plantilla actual.

---

## 🛠️ Fase 1: Backend - Rutas y Extracción de Datos

### 1. Nuevo Endpoint
- **Ruta:** `POST /api/v1/instrucciones/generate-pdf`
- **Body:** `{ "booking": "LIM001", "observaciones": "Texto enviado desde UI..." }`
- **Lógica de Cruce (Referencia: `manual_generacion_pdf_ie.md`):**
    - Obtener Posicionamiento (`booking`).
    - Obtener Clientes_IE usando la lógica de Orden (limpiando "BG") + Cultivo del Cuadro de Pedidos.
    - **Lógica Comercial (Sumas):** Totalizar `Cajas` y `Pallets` iterando el Cuadro de Pedidos asociado a la Orden.
    - **Cálculo de Peso Bruto:** Formular `Peso Bruto = (Total Cajas * Peso Kg) * 1.05` (Aplicando un 5% genérico por tara de caja y esquinero) o la lógica que establezca el sistema.
    - **Condicionales de Granada:** Setear "ATMO. CONTROLADA", "OXIGENO" y "CO2" en "NO APLICA". Fila de descripciones armadas en EN/ES.

---

## 🎨 Fase 2: Motor de PDF y Estética (Premium Upgrade)

### 1. Herramienta Recomendada
Utilizar **Jinja2** para la plantilla HTML base y `pdfkit` (wkhtmltopdf) o `WeasyPrint` para la conversión. Esto garantizará máxima flexibilidad en estilos.

### 2. Estilo Visual (El "Lavado de Cara")
- **Header Intacto:** Mantener Logo de Beta a la izquierda y la imagen del Cultivo a la derecha, título centrado.
- **Tipografía Moderna:** Usar fuentes limpias tipo Arial/Helvetica o Inter para mayor legibilidad comercial.
- **Paleta de Colores:** Los headers separadores (que hoy son un Naranja sólido fuerte) deben pasar a un Naranja/Ocre corporativo más suave y elegante (estéticamente amigable) o fondos grises claros, manteniendo un "Corporate Vibe".
- **Tablas:** Bordes sólidos pero delgados (1px `#CCCCCC`), con buen *padding* interno para respiración.

---

## ✅ Criterios de Aceptación
1. [ ] El botón en la UI llama al backend y descarga el PDF con el nombre `IE_{Booking}.pdf`.
2. [ ] **HOJA ÚNICA ADAPTATIVA:** El documento **se adapta y ocupa SIEMPRE UNA (1) SOLA PÁGINA**. Prohibido que se generen 2 o más páginas. Todo se auto-escala (CSS flex, height 100%, shrink) abarcando todo el largo de la hoja de forma distribuida sin cortarse.
3. [ ] Todas las sumas de cajas, pallets y pesos reflejan la carga consolidada del booking.
4. [ ] El diseño es sustancialmente más moderno pero respeta la distribución estandarizada solicitada.

---
> **Mensaje del Arquitecto:** Apóyate totalmente en el archivo `manual_generacion_pdf_ie.md` creado hoy. Ahí tienes la correspondencia 1:1 de los campos. ¡Mucha suerte Coder!
