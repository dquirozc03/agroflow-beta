# Guía de Desarrollo Frontend - LogiCapture 1.0

El frontend de LogiCapture está construido sobre **Next.js 14** siguiendo las mejores prácticas de React y TypeScript para ofrecer una interfaz fluida (UX) y una estética premium.

---

## Estructura de Proyecto

Utilizamos el **App Router** de Next.js para la gestión de rutas y layouts:

- **`app/`**: Contiene las páginas y sub-módulos del sistema.
  - `(login)/`: Ruta de autenticación desacoplada.
  - `(maestros)/`: Gestión de catálogos (Choferes, Transportistas, etc.).
  - `(logicapture)/`: Módulo principal de registro y bandeja de operaciones.
- **`components/`**: Componentes React de lógica de negocio (Modales, Formularios, Sidebar).
- **`components/ui/`**: Componentes base de [Shadcn/UI](https://ui.shadcn.com/) (Botones, Inputs, Tablas).
- **`lib/`**: Utilidades compartidas, definiciones de tipos y el cliente API.

---

## Estándares de Diseño y UI

Para mantener una estética profesional y consistente:

1. **Shadcn/UI**: No reinvente componentes básicos. Use los que residen en `components/ui/`.
2. **Iconografía**: Utilice exclusivamente `lucide-react`.
3. **Colores**: Siga el esquema de colores definido en `globals.css` (CSS Variables). El sistema soporta Modo Claro y Oscuro.
4. **Resposividad**: Todos los layouts deben ser *Mobile-Friendly* usando utilidades de Tailwind (Prefixes `sm:`, `md:`, `lg:`).

---

## Gestión de Datos y API

La comunicación con el backend se realiza a través de `lib/api.ts`.

### Realizar una petición
Utilice la función `apiRequest<T>` para obtener tipado estático y manejo automático de errores.

```typescript
const data = await apiRequest<Transportista[]>("/maestros/transportistas");
```

### Formularios
Implemente formularios usando `react-hook-form` y valide los datos con esquemas de `zod` para detectar errores antes de enviarlos al servidor.

---

## Autenticación y Seguridad

- **Token**: El JWT se almacena en `localStorage` bajo la clave `nexo-token`.
- **Protección de Rutas**: Use el componente `AuthGuard` para envolver secciones que requieran inicio de sesión.
- **Sesión**: Existe un monitor de inactividad (`session-timeout.tsx`) que cierra la sesión automáticamente tras un periodo definido.

---

## Flujo para Crear una Nueva Página

1. Cree una carpeta en `app/` con el nombre de la ruta (ej. `mis-reportes`).
2. Añada un archivo `page.tsx`.
3. Si requiere formularios complejos, cree un componente en `components/` (ej. `reporte-form.tsx`).
4. Añada el enlace correspondiente en el `Sidebar` (`components/app-sidebar.tsx`).
