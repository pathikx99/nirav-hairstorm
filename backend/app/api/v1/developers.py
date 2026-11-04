"""
Developer API endpoints.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.manufacturers.schemas import DeveloperRead
from backend.app.models.manufacturers import Developer

router = APIRouter(prefix="/developers", tags=["developers"])


@router.get("", response_model=list[DeveloperRead])
async def list_developers(
    manufacturer_id: UUID | None = Query(None, description="Filter by manufacturer UUID"),
    market: str | None = Query(None, description="Filter by market (e.g. IN)"),
    db: AsyncSession = Depends(get_db),
) -> list[Developer]:
    """List developers/oxidants registered in the platform."""
    stmt = select(Developer)
    if manufacturer_id:
        stmt = stmt.where(Developer.manufacturer_id == manufacturer_id)
    if market:
        stmt = stmt.where(Developer.market == market)

    res = await db.execute(stmt)
    return list(res.scalars().all())
