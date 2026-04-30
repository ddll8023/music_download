"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.song import router as song_router
from app.core.config import settings
from app.utils.logging import configure_logging

configure_logging()

app = FastAPI(title="Music Download Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(song_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
