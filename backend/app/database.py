from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.configuracion import settings

# Para Supabase con Session Pooler es óptimo usar el pool por defecto (QueuePool)
# o configurar los pool_size según tus necesidades.
engine = create_engine(
    settings.DATABASE_URL, 
    future=True,
    pool_pre_ping=True  # Verifica que la conexión desde el pool esté viva antes de usarla
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
