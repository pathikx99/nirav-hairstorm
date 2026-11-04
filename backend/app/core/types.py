"""Shared type aliases used across the Hairstorm platform."""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Any
from uuid import UUID

from pydantic import Field

# ── Primary key ──────────────────────────────────────────────────────
PrimaryKey = UUID

# ── Scientific measurements (always NUMERIC / Decimal) ───────────────
Concentration = Annotated[
    Decimal,
    Field(ge=0, decimal_places=4, description="Concentration in grams or percentage"),
]

CIELabValue = Annotated[
    Decimal,
    Field(decimal_places=4, description="CIE L*a*b* coordinate component"),
]

DeltaE = Annotated[
    Decimal,
    Field(ge=0, decimal_places=4, description="CIEDE2000 colour difference"),
]

# ── Manufacturer metadata (always JSONB) ─────────────────────────────
ManufacturerMetadata = dict[str, Any]
