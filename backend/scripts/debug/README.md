# scripts/debug/ — Carpeta Reservada

Esta carpeta está **vacía intencionalmente** tras la limpieza de Marzo 2026.

## ¿Por qué se eliminaron los scripts de debug?

Los scripts `debug_*.py` que existían aquí eran herramientas temporales creadas durante el desarrollo para investigar bugs puntuales. En un entorno cloud (Render/Railway/AWS), no tienen utilidad porque:

1. No se puede ejecutar un script puntual en el servidor de producción fácilmente.
2. El proyecto ya tiene logging estructurado (`app/utils/logging.py`) que registra eventos en el panel de logs del servicio cloud.

## Regla del equipo

> **No crear scripts `debug_*.py` en el repositorio.**  
> Si necesitas investigar un bug en cloud, usa `logger.debug(...)` o `logger.error(...)` y revisa los logs en el panel de Render/Railway/CloudWatch.

Si en algún momento se necesita una herramienta de diagnóstico permanente, debe documentarse, versionarse correctamente y moverse a `scripts/checks/`.
