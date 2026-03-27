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

# CORS dinámico según ticket de arquitectura
_origins = settings.origins_list
_allow_all = "*" in _origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=[] if _allow_all else _origins,
    allow_origin_regex=".*" if _allow_all else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from app.routers import auth, sync, maestros, vehiculos

app.include_router(auth.router)
app.include_router(sync.router)
app.include_router(maestros.router)
app.include_router(vehiculos.router)

@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {"status": "ok", "version": "2.0.0-dev"}

@app.get("/")
def root():
    return {"message": "AgroFlow V2 API is running on DEV branch."}
