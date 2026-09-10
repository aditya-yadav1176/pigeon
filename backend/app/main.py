import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.rooms import router as rooms_router
from app.cleanup import cleanup_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start periodic background cleanup loop
    cleanup_task = asyncio.create_task(cleanup_loop(interval_seconds=30))
    yield
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="PIGEON API",
    description="Minimalist, no-login, temporary cross-device file transfer backend.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms_router)

@app.get("/health")
def health():
    return {"status": "ok", "app": "PIGEON"}
