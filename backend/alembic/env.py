from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ====== NUEVO: importa settings + Base + modelos ======
from app.configuracion import settings
from app.database import Base

# ====== CRÍTICO: Importar TODOS los módulos de modelos ======
# Alembic necesita que cada clase que hereda de Base esté importada en este
# contexto para que su tabla aparezca en target_metadata y sea incluida
# en el autogenerate. Omitir un módulo = Alembic ignora esas tablas.
from app.models import (
    auth,           # → auth_usuarios, auth_roles
    auditoria,      # → ope_registro_eventos
    maestros,       # → transportistas, vehiculos_tracto, vehiculos_carreta, choferes, clientes_ie, maestro_fitos, plantas
    embarque,       # → control_embarque, reporte_embarques
    logicapture,    # → logicapture_registros, logicapture_detalles
    pedido,         # → pedidos_comerciales
    packing_list,   # → emision_packing_list, detalle_emision_packing_list
    posicionamiento, # → posicionamientos
)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# ====== NUEVO: inyecta la URL desde .env ======
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ====== NUEVO: metadata real de tus modelos ======
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # útil para detectar cambios de tipo
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # útil para detectar cambios de tipo
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
