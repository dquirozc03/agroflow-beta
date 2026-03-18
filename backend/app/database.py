from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.configuracion import settings

# TAREA-B04: Configurar Pool de Conexiones para Producción
# Para Supabase con Session Pooler en dev es óptimo usar el pool por defecto (QueuePool).
# Pero en producción (AWS RDS), con carga alta, ajustamos explícitamente el pool_size.
engine_kwargs = {
    "future": True,
    "pool_pre_ping": True  # Verifica que la conexión desde el pool esté viva antes de usarla
}

if settings.ENVIRONMENT == "production":
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT

engine = create_engine(
    settings.DATABASE_URL, 
    **engine_kwargs
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
