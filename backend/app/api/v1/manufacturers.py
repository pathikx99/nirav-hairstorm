"""
Manufacturer and Product Line API endpoints.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.manufacturers.schemas import (
    ManufacturerCreate,
    ManufacturerProductRead,
    ManufacturerRead,
    ProductLineRead,
)
from backend.app.models.manufacturers import (
    Manufacturer,
    ManufacturerProduct,
    ProductLine,
)

router = APIRouter(prefix="/manufacturers", tags=["manufacturers"])


@router.get("", response_model=list[ManufacturerRead])
async def list_manufacturers(
    market: str | None = Query(None, description="Filter by supported market code (e.g. IN)"),
    db: AsyncSession = Depends(get_db),
) -> list[Manufacturer]:
    """List all manufacturers, optionally filtering by market."""
    stmt = select(Manufacturer)
    res = await db.execute(stmt)
    manufacturers = res.scalars().all()

    if market:
        return [m for m in manufacturers if m.supported_markets.get(market.upper())]
    return list(manufacturers)


@router.get("/{manufacturer_id}", response_model=ManufacturerRead)
async def get_manufacturer(
    manufacturer_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Manufacturer:
    """Retrieve a single manufacturer by UUID."""
    stmt = select(Manufacturer).where(Manufacturer.id == manufacturer_id)
    res = await db.execute(stmt)
    m = res.scalar_one_or_none()
    if not m:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Manufacturer '{manufacturer_id}' not found.",
        )
    return m


@router.post("", response_model=ManufacturerRead, status_code=status.HTTP_201_CREATED)
async def create_manufacturer(
    payload: ManufacturerCreate,
    db: AsyncSession = Depends(get_db),
) -> Manufacturer:
    """Create a new manufacturer."""
    m = Manufacturer(
        name=payload.name,
        slug=payload.slug,
        country_of_origin=payload.country_of_origin,
        supported_markets=payload.supported_markets,
        website=payload.website,
        status=payload.status.value,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


@router.get("/{manufacturer_id}/product-lines", response_model=list[ProductLineRead])
async def list_manufacturer_product_lines(
    manufacturer_id: UUID,
    market: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[ProductLine]:
    """List product lines for a given manufacturer."""
    stmt = select(ProductLine).where(ProductLine.manufacturer_id == manufacturer_id)
    if market:
        stmt = stmt.where(ProductLine.market == market)
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/{manufacturer_id}/products", response_model=list[ManufacturerProductRead])
async def list_manufacturer_products(
    manufacturer_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> list[ManufacturerProduct]:
    """List products belonging to product lines under a manufacturer."""
    stmt = (
        select(ManufacturerProduct)
        .join(ProductLine, ManufacturerProduct.product_line_id == ProductLine.id)
        .where(ProductLine.manufacturer_id == manufacturer_id)
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())
