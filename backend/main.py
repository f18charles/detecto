from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.record import init_db
from routes import detect, history
from routes.detect import get_model

app = FastAPI(title="Detecto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detect.router)
app.include_router(history.router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    # Load + warm up the model here, not on first request — otherwise the
    # one-time load/warmup cost gets baked into that request's inference_time_ms.
    get_model()


@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "ok"}
