"""
Formulation Engine Enums — Version 1.0.

Defines the classification, safety, status, and processing taxonomies
mandated by Section 5 of the Nirav Hairstorm Technical Specification.
"""

from __future__ import annotations

from enum import Enum


class ServiceClassificationEnum(str, Enum):
    """
    Formulation process service classification.

    Categorises the chemical and technical nature of the required service
    based on initial hair condition, artificial pigment status, and target colour.
    """

    DEPOSIT = "DEPOSIT"
    DARKENING = "DARKENING"
    SAME_LEVEL_COLOURING = "SAME_LEVEL_COLOURING"
    LIFTING = "LIFTING"
    TONING = "TONING"
    NEUTRALISATION = "NEUTRALISATION"
    COLOUR_REMOVAL = "COLOUR_REMOVAL"
    LIGHTENING = "LIGHTENING"
    MULTI_STAGE_PROCESS = "MULTI_STAGE_PROCESS"
    UNSUPPORTED = "UNSUPPORTED"
    INSUFFICIENT_INFORMATION = "INSUFFICIENT_INFORMATION"


class SafetyStatusEnum(str, Enum):
    """
    Safety evaluation status.

    Controls whether a formulation is safe to evaluate, requires professional review,
    or is strictly blocked due to hard contraindications.
    """

    PASS = "PASS"
    WARNING = "WARNING"
    BLOCKED = "BLOCKED"
    NEEDS_ASSESSMENT = "NEEDS_ASSESSMENT"


class FormulationResultStatusEnum(str, Enum):
    """
    Execution and review status of a formulation result.

    Conforms to Technical Specification §5.12.
    """

    DRAFT = "DRAFT"
    INSUFFICIENT_INFORMATION = "INSUFFICIENT_INFORMATION"
    BLOCKED = "BLOCKED"
    REQUIRES_PROFESSIONAL_REVIEW = "REQUIRES_PROFESSIONAL_REVIEW"
    ELIGIBLE_FOR_REVIEW = "ELIGIBLE_FOR_REVIEW"
    APPROVED_BY_COLOURIST = "APPROVED_BY_COLOURIST"
    SUPERSEDED = "SUPERSEDED"


class ProcessModeEnum(str, Enum):
    """
    Formulation workflow mode.

    Section 5.2 & 5.13: Preferred manufacturer vs cross-brand comparison.
    """

    PREFERRED_MANUFACTURER = "PREFERRED_MANUFACTURER"
    CROSS_BRAND_COMPARISON = "CROSS_BRAND_COMPARISON"


class ApplicationTechniqueEnum(str, Enum):
    """Application method / placement technique."""

    REGROWTH_ONLY = "REGROWTH_ONLY"
    FULL_HEAD = "FULL_HEAD"
    BALAYAGE_FOIL = "BALAYAGE_FOIL"
    TONING_GLOSS = "TONING_GLOSS"
    DUAL_APPLICATION = "DUAL_APPLICATION"


class HairConditionEnum(str, Enum):
    """Structural condition of hair fibers."""

    VIRGIN = "VIRGIN"
    HEALTHY = "HEALTHY"
    MODERATELY_DAMAGED = "MODERATELY_DAMAGED"
    SEVERELY_DAMAGED = "SEVERELY_DAMAGED"
    UNKNOWN = "UNKNOWN"


class PorosityEnum(str, Enum):
    """Cuticle porosity level."""

    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    EXTREME = "EXTREME"
    UNKNOWN = "UNKNOWN"
