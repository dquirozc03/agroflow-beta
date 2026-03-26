from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.configuracion import settings
from app.routers import auth
from app.utils.logging import logger

app = FastAPI(
    title="AgroFlow V2 - Dev",
    version="2.0.0",
    description="Reinicio de AgroFlow con estándares profesionales. Rama DEV."
)

# CORS
_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_cors_origins = [
    o.strip() for o in (settings.CORS_ORIGINS or "").split(",") if o.strip()
] or _default_origins

# Configuración inteligente de CORS
_allow_all = "*" in _cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=[] if _allow_all else _cors_origins,
    allow_origin_regex=".*" if _allow_all else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from app.routers import auth, sync

app.include_router(auth.router)
app.include_router(sync.router)

@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {"status": "ok", "version": "2.0.0-dev"}

@app.get("/")
def root():
    return {"message": "AgroFlow V2 API is running on DEV branch."}
