# 📋 TICKET DE DESARROLLO: Módulo de Gestión de Usuarios Premium (SISTEMA)

**Asignado a:** Equipo de Desarrollo (Coder)
**Emitido por:** Arquitectura de Software (Inge Daniel approved)
**Prioridad:** ALTA / SEGURIDAD

---

## 🎯 Objetivo
Reemplazar el placeholder de "Analítica" por un sistema completo de Gestión de Usuarios con permisos granulares, lógica de bloqueo por intentos y diseño premium "Carlos Style".

---

## 🛠️ Fase 1: Backend & Base de Datos (Refactor)

1. **Modelo `Usuario` (`auth_usuarios`):**
   - Asegurar la existencia de `intentos_fallidos` (int), `bloqueado` (bool) y `requiere_cambio_password` (bool).
   - **NUEVO:** Añadir columna `permisos` de tipo **JSON/JSONB**.
   - Valor defaults sugerido: `{"logicapture": true, "maestros": true, "operaciones": true, "sistema": false}`.

2. **Servicio Auth (`auth_service.py`):**
   - En `autenticar_usuario`: Al llegar al 3er intento fallido, marcar `bloqueado = true` y emitir `CuentaBloqueadaError`.
   - Crear endpoint `PATCH /api/v1/usuarios/{id}/desbloquear` (Solo Admin).
   - Crear endpoint `POST /api/v1/usuarios/{id}/reset-password` (Cargando `123456` y `requiere_cambio_password = true`).

---

## 🎨 Fase 2: Sidebar Dinámico (Frontend)

1. **Sidebar (`app-sidebar.tsx`):**
   - Renombrar "Analítica" -> "Usuarios". Usar icono `UserRound` o `Users`.
   - **Lógica de Filtrado:** Modificar la renderización del sidebar para que solo muestre los items que el usuario tenga como `true` en su campo `permisos`.

---

## 📺 Fase 3: Dashboard de Administración de Usuarios

1. **Nueva Página:** `/frontend/app/configuracion/usuarios/page.tsx`
2. **Componentes:**
   - **Tabla Carlos Style:** Mostrar Nombre, Usuario, Rol, Estado (Badges coloridos) y Botón de Acciones.
   - **Modal de Gestión (Tabs):**
     - **Tab Perfil:** Editar nombre y rol.
     - **Tab Permisos:** Lista de switches para habilitar/deshabilitar módulos.
     - **Tab Seguridad:** Botón para Reset de Password (`123456`) y Desbloqueo de cuenta.

---

## ✅ Criterios de Aceptación
1. [ ] El usuario Admin puede crear, editar e inhabilitar usuarios.
2. [ ] Un usuario bloqueado tras 3 intentos no puede iniciar sesión hasta que se le desbloquee manual.
3. [ ] Los cambios en permisos se reflejan en el Sidebar al recargar el sitio.
4. [ ] Iniciar sesión con `123456` (tras reset) fuerza el cambio de contraseña.

---
> **Nota de Aestethics:** Usar componentes de Radix UI y colores esmeralda/rose según el estado de la cuenta.
