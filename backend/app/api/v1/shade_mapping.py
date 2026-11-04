"""
Shade Mapping API endpoints.

Implements Section 4.8 of the Technical Specification:
- POST /api/v1/shade-mapping/resolve
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.database.session import get_db
from backend.app.models.manufacturers import (
    ManufacturerShade,
)
from backend.app.shade_mapping.schemas import (
    CrossBrandCompareRequest,
    CrossBrandCompareResponse,
)
from backend.app.shade_mapping.service import ShadeMappingEngine

router = APIRouter(prefix="/shade-mapping", tags=["shade-mapping"])


class ShadeResolveRequest(BaseModel):
    manufacturer_id: UUID | None = None
    product_id: UUID | None = None
    market: str = Field(..., description="Market code, e.g. 'IN'")
    shade_code: str = Field(
        ..., description="Original manufacturer shade code, e.g. '7/1' or '7.16'"
    )


class ShadeMappingDetails(BaseModel):
    level: int
    primary_tone: str
    secondary_tone: str | None = None
    tone_intensity: str = "UNKNOWN"
    colour_family: str | None = None


class ShadeResolveResponse(BaseModel):
    manufacturer_shade_id: UUID
    original_shade_code: str
    mapping: ShadeMappingDetails
    verification_status: str


@router.post("/resolve", response_model=ShadeResolveResponse)
async def resolve_shade_mapping(
    payload: ShadeResolveRequest,
    db: AsyncSession = Depends(get_db),
) -> ShadeResolveResponse:
    """
    Resolve a manufacturer shade to its UHCR universal colour classification.
    Preserves original shade notation and looks up verified mapping.
    """
    stmt = (
        select(ManufacturerShade)
        .options(selectinload(ManufacturerShade.shade_mappings))
        .where(
            ManufacturerShade.shade_code == payload.shade_code,
            ManufacturerShade.market == payload.market,
        )
    )
    if payload.product_id:
        stmt = stmt.where(ManufacturerShade.product_id == payload.product_id)

    res = await db.execute(stmt)
    shade = res.scalar_one_or_none()

    if not shade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Manufacturer shade '{payload.shade_code}' not found in market '{payload.market}'.",
        )

    if not shade.shade_mappings:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"No UHCR mapping available for shade '{payload.shade_code}'.",
        )

    mapping = shade.shade_mappings[0]

    return ShadeResolveResponse(
        manufacturer_shade_id=shade.id,
        original_shade_code=shade.shade_code,
        mapping=ShadeMappingDetails(
            level=mapping.uhcr_level,
            primary_tone=mapping.primary_tone,
            secondary_tone=mapping.secondary_tone,
            tone_intensity=mapping.tone_intensity,
            colour_family=mapping.colour_family,
        ),
        verification_status=mapping.verification_status,
    )


@router.post("/compare", response_model=CrossBrandCompareResponse)
async def compare_shades_cross_brand(
    payload: CrossBrandCompareRequest,
    db: AsyncSession = Depends(get_db),
) -> CrossBrandCompareResponse:
    """
    Search and rank candidate shades across manufacturers matching a target universal colour.
    Section 4.8 specification compliant.
    """
    return await ShadeMappingEngine.compare_shades(session=db, request=payload)
