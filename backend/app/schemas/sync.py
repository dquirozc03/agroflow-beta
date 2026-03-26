from typing import List, Optional
from pydantic import BaseModel

class SyncResponse(BaseModel):
    status: str
    mensaje: str
    procesados: int
    errores: int
