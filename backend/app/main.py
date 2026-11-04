"""FastAPI application factory for Nirav Hairstorm."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.router import router as v1_router
from backend.app.config import get_settings
from backend.app.database.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown.

    On startup:  verify the database connection is reachable.
    On shutdown: dispose of the connection pool gracefully.
    """
    # Startup — verify connectivity
    async with engine.connect() as conn:
        await conn.execute(__import__("sqlalchemy").text("SELECT 1"))

    yield

    # Shutdown — release all pooled connections
    await engine.dispose()


def create_app() -> FastAPI:
    """Build and return the configured FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="Universal Hair Colour Intelligence Platform",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── Middleware ────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ───────────────────────────────────────────
    _register_exception_handlers(app)

    # ── Routers ──────────────────────────────────────────────────────
    app.include_router(v1_router, prefix="/api/v1")

    # ── Root health check ────────────────────────────────────────────
    @app.get("/health", tags=["health"])
    async def health_check() -> dict[str, str]:
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.VERSION,
        }

    return app


def _register_exception_handlers(app: FastAPI) -> None:
    """Wire domain exceptions to HTTP responses."""
    from fastapi import Request
    from fastapi.responses import JSONResponse

    from backend.app.core.exceptions import (
        CatalogueNotPublishedError,
        HairstormError,
        InsufficientEvidenceError,
        NotFoundError,
        SafetyBlockError,
        ValidationError,
        VerificationError,
    )

    status_map: dict[type[HairstormError], int] = {
        ValidationError: 422,
        NotFoundError: 404,
        VerificationError: 409,
        InsufficientEvidenceError: 422,
        SafetyBlockError: 403,
        CatalogueNotPublishedError: 404,
    }

    @app.exception_handler(HairstormError)
    async def hairstorm_exception_handler(
        _request: Request,
        exc: HairstormError,
    ) -> JSONResponse:
        status_code = status_map.get(type(exc), 500)
        return JSONResponse(
            status_code=status_code,
            content={"error": {"code": exc.code, "detail": exc.detail}},
        )


# Default application instance (used by uvicorn / gunicorn)
app = create_app()
