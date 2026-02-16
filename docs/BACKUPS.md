# Copias de seguridad (backups) de la base de datos

La aplicación usa **PostgreSQL**. Para no perder datos, conviene hacer copias periódicas.

## Copia manual (una vez)

Desde la línea de comandos, con la base de datos en marcha:

```bash
# Formato: pg_dump -h HOST -U USUARIO -d NOMBRE_BD -F c -f archivo.dump
# Ejemplo con conexión local y usuario por defecto:
pg_dump -h localhost -U postgres -d nombre_de_tu_bd -F c -f backup_$(date +%Y%m%d_%H%M).dump
```

- `-F c`: formato custom (comprimido, restaurable con `pg_restore`).
- Para solo SQL plano (legible): quitar `-F c` y usar `-f backup.sql`.

## Restaurar desde un backup

```bash
# Con formato custom (.dump):
pg_restore -h localhost -U postgres -d nombre_bd_nueva --clean --if-exists archivo.dump

# Si es .sql:
psql -h localhost -U postgres -d nombre_bd < backup.sql
```

## Automatizar (cron / tareas programadas)

1. Crear un script que ejecute `pg_dump` con la misma cadena de conexión que usa la app (ver `DATABASE_URL` en `.env`).
2. Programar el script para que se ejecute cada día (o cada hora, según necesidad) con cron (Linux/mac) o Programador de tareas (Windows).
3. Guardar los archivos en una carpeta o servicio externo (otro disco, nube) y definir una política de retención (ej. conservar 7 días).

## Variables de entorno

La URL de conexión suele estar en `backend/.env` como `DATABASE_URL`, por ejemplo:

- `postgresql://usuario:password@localhost:5432/nombre_bd`

Extrae host, usuario, nombre de BD y contraseña para usarlos en `pg_dump`/`pg_restore`, o usa la URL en herramientas que la acepten.
