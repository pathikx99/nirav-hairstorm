"""
Shade Mapping Engine v1.0 — Enumerations.

Defines candidate match classifications, evidence quality categories,
categorical confidence tiers, and chemical equivalence status.
"""

from enum import Enum


class MatchClassificationEnum(str, Enum):
    """
    Classification of candidate shade matches.

    - MEASURED_COLOUR_MATCH: Confirmed by compatible physical spectrophotometric measurement (CIEDE2000).
    - THEORETICAL_SHADE_MATCH: Matched via expert/manufacturer document UHCR classification.
    - INSUFFICIENT_EVIDENCE: Insufficient or provisional mapping evidence.
    """

    MEASURED_COLOUR_MATCH = "MEASURED_COLOUR_MATCH"
    THEORETICAL_SHADE_MATCH = "THEORETICAL_SHADE_MATCH"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class ConfidenceTierEnum(str, Enum):
    """
    Categorical confidence score for shade mapping and candidate ranking.
    Arbitrary percentage similarities are strictly disallowed.
    """

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT = "INSUFFICIENT"


class ChemicalEquivalenceEnum(str, Enum):
    """
    Chemical equivalence declaration.
    Principle 4: Similar visual colour does not establish chemical or formulation equivalence.
    """

    NOT_ESTABLISHED = "NOT_ESTABLISHED"


class EvidenceQualityEnum(str, Enum):
    """Source quality of the shade mapping."""

    MANUFACTURER_DOCUMENT = "MANUFACTURER_DOCUMENT"
    EXPERT_VERIFIED = "EXPERT_VERIFIED"
    PHYSICAL_MEASUREMENT = "PHYSICAL_MEASUREMENT"
    EXPERIMENTAL_VALIDATION = "EXPERIMENTAL_VALIDATION"
    PROVISIONAL_AI_EXTRACTION = "PROVISIONAL_AI_EXTRACTION"
    MANUAL_UNVERIFIED = "MANUAL_UNVERIFIED"
