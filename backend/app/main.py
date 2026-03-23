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

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0-dev"}

@app.get("/")
def root():
    return {"message": "AgroFlow V2 API is running on DEV branch."}
