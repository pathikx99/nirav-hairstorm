"""
Pydantic v2 schemas for the Manufacturer domain.

Provides Create / Read / Update schemas for every entity in the manufacturer
data model.  All ``*Read`` schemas use ``model_config = ConfigDict(from_attributes=True)``
for seamless ORM → Pydantic conversion.
"""

from __future__ import annotations

import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.app.manufacturers.enums import (
    CatalogueStatusEnum,
    ConcentrationTypeEnum,
    DocumentTypeEnum,
    ManufacturerStatusEnum,
    MappingMethodEnum,
    PermissionStatusEnum,
    ProductTypeEnum,
    ServiceTypeEnum,
    VerificationStatusEnum,
)

# =====================================================================
# A. Manufacturer
# =====================================================================


class ManufacturerCreate(BaseModel):
    """Schema for creating a new manufacturer."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    country_of_origin: str | None = Field(None, max_length=100)
    supported_markets: dict[str, Any] = Field(default_factory=dict)
    website: str | None = None
    status: ManufacturerStatusEnum = ManufacturerStatusEnum.ACTIVE


class ManufacturerRead(BaseModel):
    """Schema returned when reading a manufacturer."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    country_of_origin: str | None
    supported_markets: dict[str, Any]
    website: str | None
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


class ManufacturerUpdate(BaseModel):
    """Schema for partial updates to a manufacturer."""

    name: str | None = Field(None, min_length=1, max_length=255)
    slug: str | None = Field(None, min_length=1, max_length=255)
    country_of_origin: str | None = Field(None, max_length=100)
    supported_markets: dict[str, Any] | None = None
    website: str | None = None
    status: ManufacturerStatusEnum | None = None


# =====================================================================
# B. ProductLine
# =====================================================================


class ProductLineCreate(BaseModel):
    """Schema for creating a product line under a manufacturer."""

    manufacturer_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    service_type: ServiceTypeEnum
    market: str = Field(..., min_length=1, max_length=100)
    status: ManufacturerStatusEnum = ManufacturerStatusEnum.ACTIVE
    catalogue_version_id: UUID | None = None


class ProductLineRead(BaseModel):
    """Schema returned when reading a product line."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    manufacturer_id: UUID
    name: str
    service_type: str
    market: str
    status: str
    catalogue_version_id: UUID | None
    created_at: datetime.datetime
    updated_at: datetime.datetime


# =====================================================================
# C. ManufacturerProduct
# =====================================================================


class ManufacturerProductCreate(BaseModel):
    """Schema for creating a product within a product line."""

    product_line_id: UUID
    product_name: str = Field(..., min_length=1, max_length=255)
    product_code: str | None = Field(None, max_length=100)
    product_type: ProductTypeEnum
    market: str = Field(..., min_length=1, max_length=100)
    active_status: bool = True
    source_document_id: UUID | None = None
    verification_status: VerificationStatusEnum = VerificationStatusEnum.UNVERIFIED


class ManufacturerProductRead(BaseModel):
    """Schema returned when reading a manufacturer product."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_line_id: UUID
    product_name: str
    product_code: str | None
    product_type: str
    market: str
    active_status: bool
    source_document_id: UUID | None
    verification_status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


# =====================================================================
# D. ManufacturerShade
# =====================================================================


class ManufacturerShadeCreate(BaseModel):
    """Schema for creating a shade entry.

    ``shade_code`` is stored verbatim — manufacturer original notation is
    never normalised.
    """

    product_id: UUID
    shade_code: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Original manufacturer notation (e.g. 7/1, 7.1, 7A) — never normalised.",
    )
    shade_name: str | None = Field(None, max_length=255)
    manufacturer_depth: str | None = Field(None, max_length=50)
    manufacturer_tone_code: str | None = Field(None, max_length=50)
    manufacturer_family: str | None = Field(None, max_length=100)
    original_description: str | None = None
    market: str = Field(..., min_length=1, max_length=100)
    active_status: bool = True
    catalogue_version_id: UUID
    source_document_id: UUID | None = None
    verification_status: VerificationStatusEnum = VerificationStatusEnum.UNVERIFIED


class ManufacturerShadeRead(BaseModel):
    """Schema returned when reading a manufacturer shade."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    shade_code: str
    shade_name: str | None
    manufacturer_depth: str | None
    manufacturer_tone_code: str | None
    manufacturer_family: str | None
    original_description: str | None
    market: str
    active_status: bool
    catalogue_version_id: UUID
    source_document_id: UUID | None
    verification_status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


# =====================================================================
# E. ShadeMapping
# =====================================================================


class ShadeMappingCreate(BaseModel):
    """Schema for creating a shade-to-UHCR mapping.

    Validation enforces:
    - ``uhcr_level`` ∈ [1, 10]
    - ``mapping_confidence`` ∈ [0.0, 1.0] (when provided)
    """

    manufacturer_shade_id: UUID
    uhcr_level: int = Field(..., ge=1, le=10)
    primary_tone: str = Field(..., min_length=1, max_length=50)
    secondary_tone: str | None = Field(None, max_length=50)
    tone_intensity: str = Field(default="UNKNOWN", max_length=30)
    colour_family: str | None = Field(None, max_length=50)
    mapping_method: MappingMethodEnum
    mapping_confidence: Decimal | None = Field(None, ge=0, le=1, decimal_places=4)
    verification_status: VerificationStatusEnum = VerificationStatusEnum.UNVERIFIED
    evidence_reference: UUID | None = None
    reviewer_id: UUID | None = None
    verified_at: datetime.datetime | None = None

    @field_validator("mapping_confidence")
    @classmethod
    def validate_mapping_confidence(cls, v: Decimal | None) -> Decimal | None:
        """Ensure mapping_confidence is between 0 and 1 inclusive."""
        if v is not None and (v < 0 or v > 1):
            raise ValueError("mapping_confidence must be between 0 and 1")
        return v


class ShadeMappingRead(BaseModel):
    """Schema returned when reading a shade mapping."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    manufacturer_shade_id: UUID
    uhcr_level: int
    primary_tone: str
    secondary_tone: str | None
    tone_intensity: str
    colour_family: str | None
    mapping_method: str
    mapping_confidence: Decimal | None
    verification_status: str
    evidence_reference: UUID | None
    reviewer_id: UUID | None
    verified_at: datetime.datetime | None
    created_at: datetime.datetime
    updated_at: datetime.datetime


# =====================================================================
# F. Developer
# =====================================================================


class DeveloperCreate(BaseModel):
    """Schema for creating a developer / oxidant product."""

    manufacturer_id: UUID
    product_id: UUID | None = None
    product_name: str = Field(..., min_length=1, max_length=255)
    concentration_percent: Decimal = Field(..., ge=0)
    concentration_type: ConcentrationTypeEnum
    intended_use: dict[str, Any] | None = None
    market: str = Field(..., min_length=1, max_length=100)
    source_document_id: UUID | None = None
    verification_status: VerificationStatusEnum = VerificationStatusEnum.UNVERIFIED


class DeveloperRead(BaseModel):
    """Schema returned when reading a developer."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    manufacturer_id: UUID
    product_id: UUID | None
    product_name: str
    concentration_percent: Decimal
    concentration_type: str
    intended_use: dict[str, Any] | None
    market: str
    source_document_id: UUID | None
    verification_status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


# =====================================================================
# G. ProductRule
# =====================================================================


class ProductRuleCreate(BaseModel):
    """Schema for creating a product rule."""

    product_id: UUID
    market: str = Field(..., min_length=1, max_length=100)
    service_type: str = Field(..., min_length=1, max_length=50)
    rule_type: str = Field(..., min_length=1, max_length=50)
    conditions: dict[str, Any]
    actions: dict[str, Any]
    priority: int = Field(default=0)
    source_document_id: UUID | None = None
    source_section: str | None = None
    effective_from: datetime.date | None = None
    effective_until: datetime.date | None = None
    verification_status: VerificationStatusEnum = VerificationStatusEnum.UNVERIFIED
    rule_version: str = Field(default="1.0", max_length=20)


class ProductRuleRead(BaseModel):
    """Schema returned when reading a product rule."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    market: str
    service_type: str
    rule_type: str
    conditions: dict[str, Any]
    actions: dict[str, Any]
    priority: int
    source_document_id: UUID | None
    source_section: str | None
    effective_from: datetime.date | None
    effective_until: datetime.date | None
    verification_status: str
    rule_version: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


# =====================================================================
# H. SourceDocument
# =====================================================================


class SourceDocumentCreate(BaseModel):
    """Schema for creating a source document reference."""

    manufacturer_id: UUID
    title: str = Field(..., min_length=1)
    publisher: str | None = None
    document_type: DocumentTypeEnum
    source_url: str | None = None
    market: str | None = Field(None, max_length=100)
    language: str | None = Field(None, max_length=10)
    document_version: str | None = Field(None, max_length=50)
    published_date: datetime.date | None = None
    effective_date: datetime.date | None = None
    retrieved_at: datetime.datetime | None = None
    checksum: str | None = Field(None, max_length=128)
    permission_status: PermissionStatusEnum = PermissionStatusEnum.PENDING
    verification_status: VerificationStatusEnum = VerificationStatusEnum.UNVERIFIED


class SourceDocumentRead(BaseModel):
    """Schema returned when reading a source document."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    manufacturer_id: UUID
    title: str
    publisher: str | None
    document_type: str
    source_url: str | None
    market: str | None
    language: str | None
    document_version: str | None
    published_date: datetime.date | None
    effective_date: datetime.date | None
    retrieved_at: datetime.datetime | None
    checksum: str | None
    permission_status: str
    verification_status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


# =====================================================================
# I. CatalogueVersion
# =====================================================================


class CatalogueVersionCreate(BaseModel):
    """Schema for creating a catalogue version."""

    manufacturer_id: UUID
    market: str = Field(..., min_length=1, max_length=100)
    version: str = Field(..., min_length=1, max_length=50)
    status: CatalogueStatusEnum = CatalogueStatusEnum.DRAFT
    published_at: datetime.datetime | None = None
    supersedes_version_id: UUID | None = None


class CatalogueVersionRead(BaseModel):
    """Schema returned when reading a catalogue version."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    manufacturer_id: UUID
    market: str
    version: str
    status: str
    published_at: datetime.datetime | None
    supersedes_version_id: UUID | None
    created_at: datetime.datetime
    updated_at: datetime.datetime
