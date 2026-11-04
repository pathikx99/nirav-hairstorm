"""
Shade Mapping Engine v1.0 — Pydantic Schemas.

Defines request/response contracts for cross-brand shade candidate search,
theoretical matching, and physical colour comparison.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from backend.app.shade_mapping.enums import (
    ChemicalEquivalenceEnum,
    ConfidenceTierEnum,
    MatchClassificationEnum,
)
from backend.app.universal_colour.enums import (
    ColourFamilyEnum,
    ToneFamilyEnum,
    ToneIntensityEnum,
    UniversalLevel,
)
from backend.app.universal_colour.schemas import CIELABMeasurement


class TargetColourInput(BaseModel):
    """Universal target colour definition."""

    model_config = ConfigDict(frozen=True)

    level: UniversalLevel = Field(..., description="Target ICC depth level 1-10")
    primary_tone: ToneFamilyEnum = Field(..., description="Target primary chromatic tone")
    secondary_tone: ToneFamilyEnum | None = Field(
        None, description="Target secondary tone reflect"
    )
    tone_intensity: ToneIntensityEnum = Field(
        default=ToneIntensityEnum.UNKNOWN,
        description="Target reflect intensity",
    )
    colour_family: ColourFamilyEnum | None = Field(
        default=None,
        description="Target functional colour family",
    )
    measurement: CIELABMeasurement | None = Field(
        default=None,
        description="Optional measured CIELAB colour coordinate of target swatch",
    )


class CrossBrandCompareRequest(BaseModel):
    """Request payload for finding cross-brand candidate shades."""

    market: str = Field(default="IN", description="Market code (e.g. IN)")
    target: TargetColourInput = Field(..., description="Desired universal target colour")
    manufacturer_ids: list[UUID] | None = Field(
        default=None,
        description="Optional subset of manufacturer UUIDs to search within",
    )
    product_categories: list[str] | None = Field(
        default=["PERMANENT_COLOUR"],
        description="List of product service categories (e.g. PERMANENT_COLOUR, DEMI_PERMANENT_COLOUR)",
    )
    require_verified_mapping: bool = Field(
        default=True,
        description="Whether to restrict candidates to verified UHCR mappings",
    )
    include_physical_measurements: bool = Field(
        default=True,
        description="Whether to calculate CIEDE2000 distance when measurements exist",
    )
    max_level_difference: int = Field(
        default=1,
        ge=0,
        le=3,
        description="Maximum depth level difference allowed (|L_target - L_cand|)",
    )
    limit: int = Field(default=20, ge=1, le=100, description="Max candidates to return")


class CandidateShadeResult(BaseModel):
    """A single candidate shade match across brands."""

    model_config = ConfigDict(from_attributes=True)

    manufacturer: str
    manufacturer_id: UUID
    product_line: str
    product_line_id: UUID
    product_name: str
    product_id: UUID
    shade_id: UUID
    shade_code: str = Field(description="Original manufacturer shade code preserved verbatim")
    shade_name: str | None = None
    universal_mapping: dict[str, Any]
    match_classification: MatchClassificationEnum
    measured_delta_e00: float | None = None
    evidence_quality: str
    mapping_status: str
    chemical_equivalence: ChemicalEquivalenceEnum = ChemicalEquivalenceEnum.NOT_ESTABLISHED
    confidence: ConfidenceTierEnum
    composite_distance: float
    level_distance: float
    tone_distance: float


class CrossBrandCompareResponse(BaseModel):
    """Response payload for cross-brand candidate search."""

    results: list[CandidateShadeResult]
    total: int
    catalogue_versions: list[dict[str, Any]]
    mapping_engine_version: str = "1.0"
