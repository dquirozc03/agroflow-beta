from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/scanner", tags=["Scanner"])

class ConnectionManager:
    def __init__(self):
        # session_id -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_message(self, session_id: str, message: str):
        if session_id in self.active_connections:
            ws = self.active_connections[session_id]
            try:
                await ws.send_text(message)
            except Exception:
                # Si falla, desconectar
                self.disconnect(session_id)

manager = ConnectionManager()

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            # Mantener conexión viva. El PC solo escucha, no suele enviar nada.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(session_id)

class PushPayload(BaseModel):
    data: str

@router.post("/push/{session_id}")
async def push_data(session_id: str, payload: PushPayload):
    """
    Endpoint llamado por el CELULAR al escanear algo.
    Envíale el dato al PC conectado a este session_id.
    """
    await manager.send_message(session_id, payload.data)
    return {"ok": True}
