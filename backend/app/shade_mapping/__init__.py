"""
Shade Mapping Engine package.
"""

from backend.app.shade_mapping.distance import (
    calculate_composite_distance,
    calculate_intensity_distance,
    calculate_level_distance,
)
from backend.app.shade_mapping.enums import (
    ChemicalEquivalenceEnum,
    ConfidenceTierEnum,
    EvidenceQualityEnum,
    MatchClassificationEnum,
)
from backend.app.shade_mapping.schemas import (
    CandidateShadeResult,
    CrossBrandCompareRequest,
    CrossBrandCompareResponse,
    TargetColourInput,
)
from backend.app.shade_mapping.service import ShadeMappingEngine
from backend.app.shade_mapping.tone_matrix import (
    calculate_compound_tone_distance,
    get_tone_distance,
)

__all__ = [
    # Enums
    "MatchClassificationEnum",
    "ConfidenceTierEnum",
    "ChemicalEquivalenceEnum",
    "EvidenceQualityEnum",
    # Schemas
    "TargetColourInput",
    "CrossBrandCompareRequest",
    "CandidateShadeResult",
    "CrossBrandCompareResponse",
    # Service & engine
    "ShadeMappingEngine",
    # Distance & Matrix
    "get_tone_distance",
    "calculate_compound_tone_distance",
    "calculate_level_distance",
    "calculate_intensity_distance",
    "calculate_composite_distance",
]
