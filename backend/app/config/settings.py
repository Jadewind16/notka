from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    mongo_uri: str = "mongodb://localhost:27017/notka"
    port: int = 8000
    upload_dir: str = "../uploads"

    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # File upload settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: set[str] = {".pdf", ".ppt", ".pptx", ".doc", ".docx"}

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
