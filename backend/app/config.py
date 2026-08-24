from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "SkyGuard AI"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5199",
        "http://127.0.0.1:5199",
        "http://localhost:3000",
    ]
    DATABASE_URL: str = "sqlite+aiosqlite:///./skyguard.db"

    # ML Pipeline defaults
    INFERENCE_WINDOW_SIZE: int = 30
    HEALTH_ROLLING_WINDOW: int = 288
    HEALTH_EMA_ALPHA: float = 0.10
    ANOMALY_THRESHOLD: float = 0.50

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
