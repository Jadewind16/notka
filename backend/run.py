"""Entry point for running the FastAPI application."""
import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,  # Enable auto-reload during development
        log_level="info",
    )
