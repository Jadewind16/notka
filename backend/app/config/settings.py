from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    mongo_uri: str = "mongodb://localhost:27017/notka"
    port: int = 8000
    upload_dir: str = "../uploads"

    # CORS settings
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174"
    ]

    # File upload settings
    max_file_size: int = 100 * 1024 * 1024  # 100MB (increased for video files)
    allowed_extensions: set[str] = {
        # Documents
        ".pdf", ".ppt", ".pptx", ".doc", ".docx",
        # Images
        ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp",
        # Videos
        ".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".m4v"
    }

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
