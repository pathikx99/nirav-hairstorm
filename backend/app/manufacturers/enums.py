"""
Manufacturer domain enumerations for the Nirav Hairstorm platform.

All enums follow the UHCR v1 specification and use Python ``str, Enum`` so
their values serialise cleanly into PostgreSQL native ENUMs and JSON.
"""

from enum import Enum

# ── Manufacturer lifecycle ───────────────────────────────────────────


class ManufacturerStatusEnum(str, Enum):
    """Operational status of a manufacturer entity."""

    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


# ── Service / product classification ────────────────────────────────


class ServiceTypeEnum(str, Enum):
    """Hair colour service categories offered by a product line."""

    PERMANENT_COLOUR = "PERMANENT_COLOUR"
    DEMI_PERMANENT_COLOUR = "DEMI_PERMANENT_COLOUR"
    SEMI_PERMANENT_COLOUR = "SEMI_PERMANENT_COLOUR"
    DIRECT_DYE = "DIRECT_DYE"
    TONER = "TONER"
    LIGHTENER = "LIGHTENER"
    BLEACH = "BLEACH"
    COLOUR_REMOVER = "COLOUR_REMOVER"
    GLOSS = "GLOSS"
    OTHER = "OTHER"


class ProductTypeEnum(str, Enum):
    """Physical product type within a product line."""

    COLOUR = "COLOUR"
    DEVELOPER = "DEVELOPER"
    LIGHTENER = "LIGHTENER"
    ADDITIVE = "ADDITIVE"
    TONER = "TONER"
    OTHER = "OTHER"


# ── Verification & review ───────────────────────────────────────────


class VerificationStatusEnum(str, Enum):
    """Data verification lifecycle status.

    Unverified data must *never* generate executable formulations.
    """

    UNVERIFIED = "UNVERIFIED"
    EXTRACTED = "EXTRACTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUPERSEDED = "SUPERSEDED"


class CatalogueStatusEnum(str, Enum):
    """Publication status of a catalogue version."""

    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    PUBLISHED = "PUBLISHED"
    RETIRED = "RETIRED"


class CatalogueCompletenessEnum(str, Enum):
    """Tracks overall catalogue data-pipeline completeness."""

    NOT_STARTED = "NOT_STARTED"
    DOCUMENTS_COLLECTED = "DOCUMENTS_COLLECTED"
    SHADE_DATA_EXTRACTED = "SHADE_DATA_EXTRACTED"
    SHADE_DATA_VERIFIED = "SHADE_DATA_VERIFIED"
    TECHNICAL_RULES_EXTRACTED = "TECHNICAL_RULES_EXTRACTED"
    TECHNICAL_RULES_VERIFIED = "TECHNICAL_RULES_VERIFIED"
    READY_FOR_TESTING = "READY_FOR_TESTING"
    APPROVED_FOR_PRODUCTION = "APPROVED_FOR_PRODUCTION"


# ── Shade mapping provenance ────────────────────────────────────────


class MappingMethodEnum(str, Enum):
    """How a shade-to-UHCR mapping was established."""

    MANUFACTURER_DOCUMENT = "MANUFACTURER_DOCUMENT"
    EXPERT_VERIFIED = "EXPERT_VERIFIED"
    PHYSICAL_MEASUREMENT = "PHYSICAL_MEASUREMENT"
    EXPERIMENTAL_VALIDATION = "EXPERIMENTAL_VALIDATION"
    PROVISIONAL_AI_EXTRACTION = "PROVISIONAL_AI_EXTRACTION"
    MANUAL_UNVERIFIED = "MANUAL_UNVERIFIED"


# ── Source documents ─────────────────────────────────────────────────


class DocumentTypeEnum(str, Enum):
    """Classification of manufacturer source documents."""

    SHADE_CHART = "SHADE_CHART"
    TECHNICAL_MANUAL = "TECHNICAL_MANUAL"
    DEVELOPER_GUIDE = "DEVELOPER_GUIDE"
    LIGHTENER_GUIDE = "LIGHTENER_GUIDE"
    SAFETY_DOCUMENT = "SAFETY_DOCUMENT"
    PRODUCT_INFORMATION = "PRODUCT_INFORMATION"
    OTHER = "OTHER"


class PermissionStatusEnum(str, Enum):
    """Intellectual-property permission status for a source document."""

    PENDING = "PENDING"
    GRANTED = "GRANTED"
    DENIED = "DENIED"
    NOT_REQUIRED = "NOT_REQUIRED"


# ── Developer / oxidant ─────────────────────────────────────────────


class ConcentrationTypeEnum(str, Enum):
    """How a developer's concentration is expressed."""

    VOLUME = "VOLUME"
    PERCENTAGE = "PERCENTAGE"
    OTHER = "OTHER"


# ── Product rules ───────────────────────────────────────────────────


class RuleCategoryEnum(str, Enum):
    """Category tag for manufacturer-specific product rules."""

    MIXING_RATIO = "MIXING_RATIO"
    DEVELOPER_COMPATIBILITY = "DEVELOPER_COMPATIBILITY"
    PROCESSING_TIME = "PROCESSING_TIME"
    PROCESSING_CONDITIONS = "PROCESSING_CONDITIONS"
    APPLICATION_METHOD = "APPLICATION_METHOD"
    GREY_COVERAGE = "GREY_COVERAGE"
    SPECIAL_MIX = "SPECIAL_MIX"
    LIGHTENING = "LIGHTENING"
    COLOUR_REMOVAL = "COLOUR_REMOVAL"
    CONTRAINDICATION = "CONTRAINDICATION"
    OTHER = "OTHER"
