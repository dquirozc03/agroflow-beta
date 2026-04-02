from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.configuracion import settings
from app.utils.logging import logger

app = FastAPI(
    title="AgroFlow V2 - Dev",
    version="2.0.0",
    description="Reinicio de AgroFlow con estándares profesionales. Rama DEV."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Importar routers después de configurar la app
from app.routers import auth, sync, maestros, vehiculos, logicapture, clientes_ie, instrucciones, packing_list

app.include_router(auth.router)
app.include_router(sync.router)
app.include_router(maestros.router)
app.include_router(vehiculos.router)
app.include_router(logicapture.router)

app.include_router(clientes_ie.router)
app.include_router(instrucciones.router)
app.include_router(packing_list.router)

@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {"status": "ok", "version": "2.0.4-dev"}

@app.get("/")
def root():
    return {"message": "AgroFlow V2 API is running on DEV branch."}
