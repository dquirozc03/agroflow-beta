from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.configuracion import settings
from app.routers import choferes, vehiculos, transportistas, registros, ocr, sync, referencias, health, auth, chat, agroflow, auditoria, scanner, sync_ie, ie
from app.services.sync_service import start_sync_service
import threading
from app.models.ie_models import CatPlanta
from app.database import SessionLocal
import sqlalchemy

# Valor por defecto del JWT (solo desarrollo). En producción debe definirse JWT_SECRET en env.
_DEV_JWT_SECRET = "dev-secret-cambiar-en-produccion"


def _validate_production_config():
    """En producción exige JWT_SECRET seguro."""
    if settings.ENVIRONMENT.lower() != "production":
        return
    secret = (settings.JWT_SECRET or "").strip()
    if not secret or secret == _DEV_JWT_SECRET:
        raise RuntimeError(
            "En producción debe definir JWT_SECRET en el entorno (variable de entorno) "
            "con un valor secreto y aleatorio. No use el valor por defecto."
        )


app = FastAPI(
    title="BETA LogiCapture 1.0",
    version="0.2.0",
    description="Catálogos + control de unicidad + preparación SAP.",
)


@app.on_event("startup")
def startup():
    _validate_production_config()
    # Inicia el servicio de sincronización de Excel en segundo plano
    threading.Thread(target=start_sync_service, daemon=True).start()
    
    # Semillar plantas iniciales (con blindaje ante tablas faltantes)
    db = SessionLocal()
    try:
        planta_ica = db.query(CatPlanta).filter(CatPlanta.nombre == "ICA").first()
        if not planta_ica:
            planta_ica = CatPlanta(
                nombre="ICA", 
                direccion="CARRETERA PANAMERICANA SUR KM 321 - SANTIAGO - ICA - PERU"
            )
            db.add(planta_ica)
            db.commit()
    except sqlalchemy.exc.ProgrammingError:
        print("⚠️ Tabla cat_plantas no existe aún. Omitiendo semillado inicial.")
    except Exception as e:
        print(f"⚠️ Error en semillado: {e}")
    finally:
        db.close()


@app.get("/ping")
def ping():
    return {"ok": True}


# =========================
# CORS (Frontend Next/React)
# =========================
# Por defecto: localhost. En producción definir CORS_ORIGINS en env (URLs separadas por coma).
_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_cors_origins = [
    o.strip() for o in (settings.CORS_ORIGINS or "").split(",") if o.strip()
] or _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Routers
# =========================
app.include_router(choferes.router)
app.include_router(vehiculos.router)
app.include_router(transportistas.router)
app.include_router(registros.router)
app.include_router(ocr.router)
app.include_router(sync.router)
app.include_router(referencias.router)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(agroflow.router)
app.include_router(auditoria.router)
app.include_router(scanner.router)
app.include_router(sync_ie.router)
app.include_router(ie.router)

# =========================
# Health checks
# =========================
@app.get("/salud")
def salud():
    return {"estado": "ok"}

@app.get("/")
def root():
    return {"status": "ok"}
