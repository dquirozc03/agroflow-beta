# 📋 TICKET DE ARQUITECTURA: Solución de Error de Conexión (Carga Masiva)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Aprobado por: Inge Daniel)
**Prioridad:** CRÍTICA (Fallo en funcionalidad principal)

---

## 🛑 Objetivo Estructural
Resolver el error de conexión `ERR_CONNECTION_REFUSED` que ocurre al intentar procesar un archivo Excel en el módulo de Carga Masiva, eliminando direcciones estáticas e integrando la configuración centralizada de la API.

---

## 🛠️ Plan de Ejecución (Hoja de Ruta de Reparación)

### 1. Refactor de `frontend/app/maestros/bulk-upload/page.tsx`
Actualmente, el archivo tiene una URL hardcodeada en la línea 44. Debes realizar los siguientes cambios:
- **Importación:** Añadir `import { API_BASE_URL } from "@/lib/constants";` al inicio del archivo.
- **Cambio de Fetch:** Reemplazar el string estático `"http://localhost:8000/api/v1/maestros/bulk-upload"` por la plantilla literal `${API_BASE_URL}/api/v1/maestros/bulk-upload`.

### 2. Sincronización de Entorno
Asegúrate de que la variable `API_BASE_URL` esté correctamente configurada en `lib/constants.ts` (debería apuntar por defecto a `http://127.0.0.1:8000` o a la variable de entorno procesada).

---

## ✅ Criterios de Aceptación
1. [ ] El botón "Procesar Archivo" ya no intenta conectarse a una dirección fija.
2. [ ] Se muestra el estado de carga (`Loader`) correctamente durante la petición.
3. [ ] El sistema es capaz de recibir y mostrar la respuesta de éxito o error del servidor (siempre que el backend esté encendido).

---
> **Nota para el Coder:** Favor de verificar que no existan otras URLs estáticas de `localhost` en el resto de páginas de maestros recientemente creadas.
