import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.db.session import init_db
from src.api.routes import router as api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("buildstack.ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[Startup] Initializing BuildStack AI Service & Vector Schema...")
    init_db()
    yield
    logger.info("[Shutdown] BuildStack AI Service shutting down.")

app = FastAPI(
    title="BuildStack AI Copilot Service",
    description="Domain-accurate RAG, Vector Search, and Technical Copilot for Building Materials",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
