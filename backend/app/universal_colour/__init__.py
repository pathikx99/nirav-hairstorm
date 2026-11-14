"""
UHCR v1.0 — Universal Hair Colour Representation package.
"""

from backend.app.universal_colour.colour_science import (
    NEUTRALISATION_MAP,
    ciede2000,
    cielab_to_cielch,
    lab_values_complete,
    validate_lab_values,
)
from backend.app.universal_colour.enums import (
    AssessmentProvenanceEnum,
    ClassificationStatusEnum,
    ColourFamilyEnum,
    HairRegionEnum,
    MeasurementStatusEnum,
    NeutralisationDirectionEnum,
    NeutralisationWarmthEnum,
    ToneFamilyEnum,
    ToneIntensityEnum,
    UniversalLevel,
)
from backend.app.universal_colour.kubelka_munk import (
    calculate_spectrum_ks,
    calculate_spectrum_reflectance,
    evaluate_metameric_shift,
    ks_to_reflectance,
    predict_mixture_cielab,
    predict_mixture_reflectance,
    reflectance_to_ks,
    spectral_to_cielab,
    spectral_to_xyz,
    xyz_to_cielab,
)
from backend.app.universal_colour.schemas import (
    CIELABMeasurement,
    CIELChValues,
    HairRegionAssessment,
    MeasurementMetadata,
    PhotoAssessment,
    PhotoCaptureInfo,
    PhotoRegionPrediction,
    UHCRRecord,
)
from backend.app.universal_colour.service import UniversalColourService
from backend.app.universal_colour.validators import (
    validate_confidence,
    validate_lab_completeness,
    validate_measurement_with_metadata,
    validate_photo_prediction_not_instrument,
    validate_tone,
    validate_uhcr_level,
)

__all__ = [
    # Enums
    "UniversalLevel",
    "ToneFamilyEnum",
    "ToneIntensityEnum",
    "ColourFamilyEnum",
    "MeasurementStatusEnum",
    "ClassificationStatusEnum",
    "HairRegionEnum",
    "AssessmentProvenanceEnum",
    "NeutralisationWarmthEnum",
    "NeutralisationDirectionEnum",
    # Colour science
    "cielab_to_cielch",
    "ciede2000",
    "validate_lab_values",
    "lab_values_complete",
    "NEUTRALISATION_MAP",
    # Kubelka-Munk
    "reflectance_to_ks",
    "ks_to_reflectance",
    "calculate_spectrum_ks",
    "calculate_spectrum_reflectance",
    "predict_mixture_reflectance",
    "spectral_to_xyz",
    "xyz_to_cielab",
    "spectral_to_cielab",
    "predict_mixture_cielab",
    "evaluate_metameric_shift",
    # Schemas
    "CIELABMeasurement",
    "CIELChValues",
    "MeasurementMetadata",
    "UHCRRecord",
    "PhotoCaptureInfo",
    "PhotoRegionPrediction",
    "PhotoAssessment",
    "HairRegionAssessment",
    # Validators
    "validate_uhcr_level",
    "validate_tone",
    "validate_confidence",
    "validate_lab_completeness",
    "validate_measurement_with_metadata",
    "validate_photo_prediction_not_instrument",
    # Service
    "UniversalColourService",
]
