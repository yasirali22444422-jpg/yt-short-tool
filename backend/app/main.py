from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.audio import router as audio_router
from app.api.projects import router as projects_router
from app.api.scenes import router as scenes_router
from app.api.upload import router as upload_router
from app.config import settings
from app.database.session import init_db
from app.utils.ffmpeg_check import check_ffmpeg_status


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure directories and DB tables are initialized
    settings.init_directories()
    await init_db()
    yield
    # Shutdown: Clean up resources if necessary


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(upload_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(scenes_router, prefix="/api")
app.include_router(audio_router, prefix="/api")


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


@app.get("/api/system/status", tags=["System"])
async def system_status():
    ffmpeg_info = check_ffmpeg_status()
    return {
        "status": "operational",
        "ffmpeg": ffmpeg_info,
        "max_video_duration_sec": settings.MAX_VIDEO_DURATION_SECONDS,
        "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        "allowed_extensions": list(settings.ALLOWED_EXTENSIONS),
        "default_provider": settings.DEFAULT_AI_PROVIDER,
        "default_model": settings.DEFAULT_AI_MODEL,
    }
