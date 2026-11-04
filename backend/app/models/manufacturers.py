"""
SQLAlchemy 2.0 ORM models for the Manufacturer Data Schema.

These models implement the complete manufacturer domain of the Nirav Hairstorm
Universal Hair Colour Intelligence Platform.  Every model uses:

- UUID v7 primary keys  (``UUIDPrimaryKeyMixin``)
- TIMESTAMPTZ columns   (``TimestampMixin``)
- NUMERIC for scientific measurements and concentrations
- JSONB for structured manufacturer-specific metadata
- PostgreSQL-native ENUM types

Manufacturer shade codes are **preserved in their original notation** — the
system never normalises ``7/1`` → ``7.1`` or ``7A`` → ``7-A``.
"""

from __future__ import annotations

import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from backend.app.manufacturers.enums import (
    CatalogueStatusEnum,
    ManufacturerStatusEnum,
    PermissionStatusEnum,
    VerificationStatusEnum,
)

# =====================================================================
# A. Manufacturer
# =====================================================================


class Manufacturer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A hair colour product manufacturer (e.g. Wella, L'Oréal, Schwarzkopf)."""

    __tablename__ = "manufacturers"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    country_of_origin: Mapped[str | None] = mapped_column(String(100), nullable=True)
    supported_markets: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ManufacturerStatusEnum.ACTIVE.value,
        server_default=ManufacturerStatusEnum.ACTIVE.value,
    )

    # ── Relationships ────────────────────────────────────────────────
    product_lines: Mapped[list[ProductLine]] = relationship(
        back_populates="manufacturer",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    source_documents: Mapped[list[SourceDocument]] = relationship(
        back_populates="manufacturer",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    catalogue_versions: Mapped[list[CatalogueVersion]] = relationship(
        back_populates="manufacturer",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    developers: Mapped[list[Developer]] = relationship(
        back_populates="manufacturer",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


# =====================================================================
# B. ProductLine
# =====================================================================


class ProductLine(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A named product line within a manufacturer (e.g. Koleston Perfect)."""

    __tablename__ = "product_lines"

    manufacturer_id: Mapped[UUID] = mapped_column(
        ForeignKey("manufacturers.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    service_type: Mapped[str] = mapped_column(String(50), nullable=False)
    market: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ManufacturerStatusEnum.ACTIVE.value,
        server_default=ManufacturerStatusEnum.ACTIVE.value,
    )
    catalogue_version_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("catalogue_versions.id", ondelete="SET NULL"), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────
    manufacturer: Mapped[Manufacturer] = relationship(
        back_populates="product_lines",
    )
    products: Mapped[list[ManufacturerProduct]] = relationship(
        back_populates="product_line",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    catalogue_version: Mapped[CatalogueVersion | None] = relationship(
        foreign_keys=[catalogue_version_id],
        lazy="joined",
    )


# =====================================================================
# C. ManufacturerProduct
# =====================================================================


class ManufacturerProduct(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """An individual product (colour tube, developer bottle, etc.)."""

    __tablename__ = "manufacturer_products"

    product_line_id: Mapped[UUID] = mapped_column(
        ForeignKey("product_lines.id", ondelete="CASCADE"), nullable=False
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    product_type: Mapped[str] = mapped_column(String(50), nullable=False)
    market: Mapped[str] = mapped_column(String(100), nullable=False)
    active_status: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    source_document_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("source_documents.id", ondelete="SET NULL"), nullable=True
    )
    verification_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=VerificationStatusEnum.UNVERIFIED.value,
        server_default=VerificationStatusEnum.UNVERIFIED.value,
    )

    # ── Relationships ────────────────────────────────────────────────
    product_line: Mapped[ProductLine] = relationship(
        back_populates="products",
    )
    shades: Mapped[list[ManufacturerShade]] = relationship(
        back_populates="product",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    product_rules: Mapped[list[ProductRule]] = relationship(
        back_populates="product",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    source_document: Mapped[SourceDocument | None] = relationship(
        foreign_keys=[source_document_id],
        lazy="joined",
    )


# =====================================================================
# D. ManufacturerShade
# =====================================================================


class ManufacturerShade(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A single shade entry — shade code is preserved in original notation.

    IMPORTANT: ``shade_code`` is stored exactly as the manufacturer writes it
    (e.g. ``7/1``, ``7.1``, ``7A``).  No normalisation is ever applied.
    """

    __tablename__ = "manufacturer_shades"
    __table_args__ = (
        UniqueConstraint(
            "product_id",
            "market",
            "catalogue_version_id",
            "shade_code",
            name="uq_shade_product_market_catalogue_code",
        ),
        Index("idx_shades_product_code", "product_id", "shade_code"),
        Index("idx_shades_market", "market"),
    )

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("manufacturer_products.id", ondelete="CASCADE"), nullable=False
    )
    shade_code: Mapped[str] = mapped_column(String(50), nullable=False)
    shade_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    manufacturer_depth: Mapped[str | None] = mapped_column(String(50), nullable=True)
    manufacturer_tone_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    manufacturer_family: Mapped[str | None] = mapped_column(String(100), nullable=True)
    original_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    market: Mapped[str] = mapped_column(String(100), nullable=False)
    active_status: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    catalogue_version_id: Mapped[UUID] = mapped_column(
        ForeignKey("catalogue_versions.id", ondelete="RESTRICT"), nullable=False
    )
    source_document_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("source_documents.id", ondelete="SET NULL"), nullable=True
    )
    verification_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=VerificationStatusEnum.UNVERIFIED.value,
        server_default=VerificationStatusEnum.UNVERIFIED.value,
    )

    # ── Relationships ────────────────────────────────────────────────
    product: Mapped[ManufacturerProduct] = relationship(
        back_populates="shades",
    )
    shade_mappings: Mapped[list[ShadeMapping]] = relationship(
        back_populates="manufacturer_shade",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    catalogue_version: Mapped[CatalogueVersion] = relationship(
        foreign_keys=[catalogue_version_id],
        lazy="joined",
    )
    source_document: Mapped[SourceDocument | None] = relationship(
        foreign_keys=[source_document_id],
        lazy="joined",
    )


# =====================================================================
# E. ShadeMapping
# =====================================================================


class ShadeMapping(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Maps a manufacturer shade to the UHCR universal classification.

    Every verified mapping must reference supporting evidence
    (``evidence_reference``).
    """

    __tablename__ = "shade_mappings"
    __table_args__ = (
        CheckConstraint(
            "uhcr_level >= 1 AND uhcr_level <= 10",
            name="ck_shade_mapping_uhcr_level_range",
        ),
        CheckConstraint(
            "mapping_confidence >= 0 AND mapping_confidence <= 1",
            name="ck_shade_mapping_confidence_range",
        ),
        Index("idx_shade_mapping_level", "uhcr_level"),
    )

    manufacturer_shade_id: Mapped[UUID] = mapped_column(
        ForeignKey("manufacturer_shades.id", ondelete="CASCADE"), nullable=False
    )
    uhcr_level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    primary_tone: Mapped[str] = mapped_column(String(50), nullable=False)
    secondary_tone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tone_intensity: Mapped[str] = mapped_column(
        String(30), nullable=False, default="UNKNOWN", server_default="UNKNOWN"
    )
    colour_family: Mapped[str | None] = mapped_column(String(50), nullable=True)
    mapping_method: Mapped[str] = mapped_column(String(50), nullable=False)
    mapping_confidence: Mapped[Decimal | None] = mapped_column(Numeric(5, 4), nullable=True)
    verification_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=VerificationStatusEnum.UNVERIFIED.value,
        server_default=VerificationStatusEnum.UNVERIFIED.value,
    )
    evidence_reference: Mapped[UUID | None] = mapped_column(nullable=True)
    reviewer_id: Mapped[UUID | None] = mapped_column(nullable=True)
    verified_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────
    manufacturer_shade: Mapped[ManufacturerShade] = relationship(
        back_populates="shade_mappings",
    )


# =====================================================================
# F. Developer
# =====================================================================


class Developer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """An oxidant / developer product offered by a manufacturer."""

    __tablename__ = "developers"

    manufacturer_id: Mapped[UUID] = mapped_column(
        ForeignKey("manufacturers.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("manufacturer_products.id", ondelete="SET NULL"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    concentration_percent: Mapped[Decimal] = mapped_column(Numeric(6, 3), nullable=False)
    concentration_type: Mapped[str] = mapped_column(String(30), nullable=False)
    intended_use: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    market: Mapped[str] = mapped_column(String(100), nullable=False)
    source_document_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("source_documents.id", ondelete="SET NULL"), nullable=True
    )
    verification_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=VerificationStatusEnum.UNVERIFIED.value,
        server_default=VerificationStatusEnum.UNVERIFIED.value,
    )

    # ── Relationships ────────────────────────────────────────────────
    manufacturer: Mapped[Manufacturer] = relationship(
        back_populates="developers",
    )
    product: Mapped[ManufacturerProduct | None] = relationship(
        foreign_keys=[product_id],
        lazy="joined",
    )
    source_document: Mapped[SourceDocument | None] = relationship(
        foreign_keys=[source_document_id],
        lazy="joined",
    )


# =====================================================================
# G. ProductRule
# =====================================================================


class ProductRule(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Manufacturer-specific application / formulation rules.

    Rules encode mixing ratios, developer compatibility, processing times,
    contraindications, and other guidance extracted from technical documents.
    """

    __tablename__ = "product_rules"
    __table_args__ = (Index("idx_product_rules_product", "product_id"),)

    product_id: Mapped[UUID] = mapped_column(
        ForeignKey("manufacturer_products.id", ondelete="CASCADE"), nullable=False
    )
    market: Mapped[str] = mapped_column(String(100), nullable=False)
    service_type: Mapped[str] = mapped_column(String(50), nullable=False)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=False)
    conditions: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    actions: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    source_document_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("source_documents.id", ondelete="SET NULL"), nullable=True
    )
    source_section: Mapped[str | None] = mapped_column(Text, nullable=True)
    effective_from: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    effective_until: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    verification_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=VerificationStatusEnum.UNVERIFIED.value,
        server_default=VerificationStatusEnum.UNVERIFIED.value,
    )
    rule_version: Mapped[str] = mapped_column(
        String(20), nullable=False, default="1.0", server_default="1.0"
    )

    # ── Relationships ────────────────────────────────────────────────
    product: Mapped[ManufacturerProduct] = relationship(
        back_populates="product_rules",
    )
    source_document: Mapped[SourceDocument | None] = relationship(
        foreign_keys=[source_document_id],
        lazy="joined",
    )


# =====================================================================
# H. SourceDocument
# =====================================================================


class SourceDocument(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A manufacturer-published document from which data is extracted.

    Source documents underpin the evidence chain — every verified shade,
    mapping, and rule must reference the document it was extracted from.
    """

    __tablename__ = "source_documents"

    manufacturer_id: Mapped[UUID] = mapped_column(
        ForeignKey("manufacturers.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    publisher: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    market: Mapped[str | None] = mapped_column(String(100), nullable=True)
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    document_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    published_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    effective_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    retrieved_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    checksum: Mapped[str | None] = mapped_column(String(128), nullable=True)
    permission_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=PermissionStatusEnum.PENDING.value,
        server_default=PermissionStatusEnum.PENDING.value,
    )
    verification_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=VerificationStatusEnum.UNVERIFIED.value,
        server_default=VerificationStatusEnum.UNVERIFIED.value,
    )

    # ── Relationships ────────────────────────────────────────────────
    manufacturer: Mapped[Manufacturer] = relationship(
        back_populates="source_documents",
    )


# =====================================================================
# I. CatalogueVersion
# =====================================================================


class CatalogueVersion(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A versioned snapshot of a manufacturer's shade catalogue for a market.

    Catalogue versions support a self-referencing ``supersedes_version_id``
    so the platform can track the full revision history.
    """

    __tablename__ = "catalogue_versions"
    __table_args__ = (Index("idx_catalogue_version", "manufacturer_id", "market", "status"),)

    manufacturer_id: Mapped[UUID] = mapped_column(
        ForeignKey("manufacturers.id", ondelete="CASCADE"), nullable=False
    )
    market: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default=CatalogueStatusEnum.DRAFT.value,
        server_default=CatalogueStatusEnum.DRAFT.value,
    )
    published_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    supersedes_version_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("catalogue_versions.id", ondelete="SET NULL"), nullable=True
    )

    # ── Relationships ────────────────────────────────────────────────
    manufacturer: Mapped[Manufacturer] = relationship(
        back_populates="catalogue_versions",
    )
    supersedes_version: Mapped[CatalogueVersion | None] = relationship(
        remote_side="CatalogueVersion.id",
        foreign_keys=[supersedes_version_id],
        lazy="joined",
    )
