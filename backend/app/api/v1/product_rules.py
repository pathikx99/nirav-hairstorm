"""
Product Rules API endpoints.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.manufacturers.schemas import ProductRuleRead
from backend.app.models.manufacturers import ProductRule

router = APIRouter(prefix="/product-rules", tags=["rules"])


@router.get("", response_model=list[ProductRuleRead])
async def list_product_rules(
    product_id: UUID | None = Query(None, description="Filter by product UUID"),
    rule_type: str | None = Query(None, description="Filter by rule type"),
    market: str | None = Query(None, description="Filter by market (e.g. IN)"),
    db: AsyncSession = Depends(get_db),
) -> list[ProductRule]:
    """List executable technical rules."""
    stmt = select(ProductRule)
    if product_id:
        stmt = stmt.where(ProductRule.product_id == product_id)
    if rule_type:
        stmt = stmt.where(ProductRule.rule_type == rule_type)
    if market:
        stmt = stmt.where(ProductRule.market == market)

    res = await db.execute(stmt)
    return list(res.scalars().all())
