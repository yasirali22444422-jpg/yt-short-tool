import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from cryptography.fernet import Fernet


class Settings(BaseSettings):
    APP_NAME: str = "AI Short Video Reverse Engineer"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "http://localhost:8000/api"

    # Storage paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_TEMP_DIR: Path = DATA_DIR / "uploads"
    PROJECTS_DIR: Path = DATA_DIR / "projects"
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DATA_DIR}/app.db"

    # File constraints (V1 Scope: 1 - 90s, default max 100MB)
    MAX_VIDEO_DURATION_SECONDS: int = 90
    MAX_FILE_SIZE_MB: int = 100
    ALLOWED_EXTENSIONS: set[str] = {".mp4", ".mov", ".webm"}

    # Security
    ENCRYPTION_SECRET: str = ""

    # AI Defaults
    DEFAULT_AI_PROVIDER: str = "gemini"
    DEFAULT_AI_MODEL: str = "gemini-2.5-flash"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def init_directories(self) -> None:
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOAD_TEMP_DIR.mkdir(parents=True, exist_ok=True)
        self.PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

    def get_or_create_encryption_secret(self) -> bytes:
        """Returns the encryption secret key as 32-byte url-safe base64 for Fernet."""
        if self.ENCRYPTION_SECRET:
            try:
                # Validate key length/format
                key = self.ENCRYPTION_SECRET.encode("utf-8")
                Fernet(key)
                return key
            except Exception:
                pass
        
        # Fallback to local persistent keyfile in data directory for seamless dev
        keyfile = self.DATA_DIR / ".secret.key"
        if keyfile.exists():
            return keyfile.read_bytes().strip()
        
        new_key = Fernet.generate_key()
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        keyfile.write_bytes(new_key)
        return new_key


settings = Settings()
settings.init_directories()
