"""V1 API router — aggregates all domain routers."""

from __future__ import annotations

from fastapi import APIRouter

from backend.app.api.v1.developers import router as developers_router
from backend.app.api.v1.formulation import router as formulation_router
from backend.app.api.v1.manufacturers import router as manufacturers_router
from backend.app.api.v1.product_rules import router as product_rules_router
from backend.app.api.v1.shade_mapping import router as shade_mapping_router
from backend.app.api.v1.shades import router as shades_router

router = APIRouter()

router.include_router(manufacturers_router)
router.include_router(shades_router)
router.include_router(developers_router)
router.include_router(product_rules_router)
router.include_router(shade_mapping_router)
router.include_router(formulation_router)


@router.get("/ping", tags=["health"])
async def ping() -> dict[str, str]:
    """Lightweight liveness probe for the v1 API."""
    return {"status": "ok", "version": "v1"}
