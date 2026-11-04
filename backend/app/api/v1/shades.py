"""
Shade endpoints for querying manufacturer shades and their UHCR mappings.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.manufacturers.schemas import (
    ManufacturerShadeRead,
    ShadeMappingRead,
)
from backend.app.models.manufacturers import (
    ManufacturerShade,
    ShadeMapping,
)

router = APIRouter(prefix="/shades", tags=["shades"])


@router.get("", response_model=list[ManufacturerShadeRead])
async def list_shades(
    product_id: UUID | None = Query(None, description="Filter by product UUID"),
    market: str | None = Query(None, description="Filter by market (e.g. IN)"),
    shade_code: str | None = Query(None, description="Exact shade code (e.g. 7/1)"),
    db: AsyncSession = Depends(get_db),
) -> list[ManufacturerShade]:
    """List manufacturer shades, preserving exact shade notation."""
    stmt = select(ManufacturerShade)
    if product_id:
        stmt = stmt.where(ManufacturerShade.product_id == product_id)
    if market:
        stmt = stmt.where(ManufacturerShade.market == market)
    if shade_code:
        stmt = stmt.where(ManufacturerShade.shade_code == shade_code)

    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/{shade_id}", response_model=ManufacturerShadeRead)
async def get_shade(
    shade_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ManufacturerShade:
    """Retrieve a single manufacturer shade by UUID."""
    stmt = select(ManufacturerShade).where(ManufacturerShade.id == shade_id)
    res = await db.execute(stmt)
    shade = res.scalar_one_or_none()
    if not shade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shade '{shade_id}' not found.",
        )
    return shade


@router.get("/{shade_id}/mapping", response_model=ShadeMappingRead)
async def get_shade_mapping(
    shade_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ShadeMapping:
    """Retrieve the UHCR universal mapping for a specific shade."""
    stmt = select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_id)
    res = await db.execute(stmt)
    mapping = res.scalar_one_or_none()
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"UHCR mapping for shade '{shade_id}' not found.",
        )
    return mapping
