from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from simulator import ZebraFX9600Simulator
from pydantic import BaseModel
import asyncio
import json
import httpx  # We use httpx for async POSTs

app = FastAPI()

# WebSocket clients
websocket_clients = set()

# Allow local frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

simulator = ZebraFX9600Simulator()

class TagConfig(BaseModel):
    tag_count: int
    interval: float
    webhook_url: str | None = None  # Optional webhook

async def broadcast_message(message: str):
    """Send message to all connected WebSocket clients."""
    to_remove = set()
    for client in websocket_clients:
        try:
            await client.send_text(message)
        except Exception:
            to_remove.add(client)
    websocket_clients.difference_update(to_remove)

@app.websocket("/ws/tags")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.add(websocket)
    try:
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        websocket_clients.remove(websocket)

@app.post("/api/start_simulation")
async def start_simulation(config: TagConfig):
    """Start simulation and optionally post messages to the webhook URL."""
    # Wrap the broadcast function so it also posts to webhook
    async def combined_broadcast(message: str):
        await broadcast_message(message)
        if config.webhook_url:
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        config.webhook_url,
                        json=json.loads(message),
                        timeout=5
                    )
                    response.raise_for_status()
                except Exception as e:
                    print(f"Error posting to webhook: {e}")

    simulator.start_simulation(config.tag_count, config.interval, combined_broadcast)
    return {"status": "Simulation started"}

@app.post("/api/stop_simulation")
async def stop_simulation():
    simulator.stop_simulation()
    return {"status": "Simulation stopped"}
