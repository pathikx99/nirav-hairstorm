"""Application configuration via Pydantic Settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for Nirav Hairstorm.

    Values are loaded from environment variables (case-insensitive) and
    an optional `.env` file at the project root.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────
    APP_NAME: str = "Nirav Hairstorm"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Database ─────────────────────────────────────────────────────
    # Default to local zero-config SQLite; PostgreSQL can be configured via environment
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/hairstorm.db"

    # ── CORS ─────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3050",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3050",
        "http://192.168.29.223:3000",
        "http://192.168.29.223:3001",
        "http://192.168.29.223:3050",
    ]

    # ── Derived helpers ──────────────────────────────────────────────
    @property
    def async_database_url(self) -> str:
        """Ensure the URL uses the appropriate async driver."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
            url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return url


def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()
