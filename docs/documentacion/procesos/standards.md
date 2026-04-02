# Estándares de Código y Git - LogiCapture 1.0

Para asegurar la mantenibilidad a largo plazo de LogiCapture, todos los colaboradores deben seguir estos estándares de desarrollo.

---

## Flujo de Trabajo en Git

1. **Ramas**:
   - `main`: Código estable y listo para producción.
   - `dev`: Rama de integración para desarrollo diario.
   - `feat/nombre-funcionalidad`: Ramas temporales para nuevas características.
   - `fix/nombre-error`: Ramas temporales para correcciones.

2. **Pull Requests (PRs)**: Toda mejora debe integrarse mediante un PR revisado que pase los tests básicos (Lints).

---

## Conventional Commits

Seguimos el estándar internacional de mensajes de commit para generar historiales claros y legibles:

**Formato**: `<tipo>(<alcance>): <descripción>`

### Tipos de Commits permitidos:
- **`feat`**: Implementación de una nueva funcionalidad.
- **`fix`**: Corrección de un error o bug.
- **`docs`**: Cambios exclusivos en la documentación.
- **`style`**: Cambios que no afectan la lógica (formatting, espacios en blanco, etc.).
- **`refactor`**: Cambio en el código que no corrige un error ni añade funcionalidad.
- **`test`**: Añadir o corregir pruebas unitarias/integración.
- **`chore`**: Tareas de mantenimiento (dependencias, configuraciones de CI/CD).

**Ejemplo**: `feat(auth): implementar recuperación de contraseña con envío de Email`

---

## Estándares de Documentación y Comentarios

### Comentarios en el Código
- Los comentarios deben estar en **español**.
- Evite comentar lo que el código hace de forma evidente; explique el **objetivo** o la lógica de negocio detrás.
- Use `docstrings` en Python y bloques `/** ... */` en TypeScript para funciones clave.

### Archivos README
Cada repositorio/módulo debe contener un `README.md` que explique su propósito, instalación y comandos básicos de ejecución.

---

## Calidad de Código

- **Tipado**: En TypeScript, evite el uso de `any`. Defina `interfaces` o `types` precisos.
- **Nombrado**: Use `camelCase` para variables/funciones en JavaScript/TS y `snake_case` en Python.
- **DRY (Don't Repeat Yourself)**: Si la lógica se repite en más de dos sitios, conviértala en un componente de UI o un servicio de backend compartido.
