from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path

from app.config import settings
from app.services import db
from app.routes import notes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown."""
    # Startup
    await db.connect()

    # Ensure upload directory exists
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    print(f"🚀 Server running on port {settings.port}")

    yield

    # Shutdown
    await db.disconnect()


# Create FastAPI app
app = FastAPI(
    title="Notka API",
    description="Note management system with file reference linking",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving files
# COMMENTED OUT: Using custom Range-supporting endpoint instead
# upload_dir = Path(settings.upload_dir)
# if upload_dir.exists():
#     app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

# Include routers
app.include_router(notes_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Notka API is running"}


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected" if db.database is not None else "disconnected",
    }
