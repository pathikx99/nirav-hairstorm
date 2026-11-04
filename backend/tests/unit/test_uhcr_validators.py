"""
Unit tests for UHCR standalone validators.

Tests:
- validate_uhcr_level (1-10 range)
- validate_tone (ToneFamilyEnum membership)
- validate_confidence (0.0 to 1.0 range)
- validate_lab_completeness (all present or all None)
- validate_measurement_with_metadata (VALID requires metadata)
- validate_photo_prediction_not_instrument (provenance integrity check)
"""

from decimal import Decimal

from backend.app.universal_colour.enums import (
    AssessmentProvenanceEnum,
    MeasurementStatusEnum,
)
from backend.app.universal_colour.validators import (
    validate_confidence,
    validate_lab_completeness,
    validate_measurement_with_metadata,
    validate_photo_prediction_not_instrument,
    validate_tone,
    validate_uhcr_level,
)


class TestValidators:
    """Tests for standalone validator functions."""

    def test_validate_uhcr_level(self):
        for lvl in range(1, 11):
            assert validate_uhcr_level(lvl) is True

        assert validate_uhcr_level(0) is False
        assert validate_uhcr_level(11) is False
        assert validate_uhcr_level(-1) is False
        assert validate_uhcr_level("7") is False  # type: ignore

    def test_validate_tone(self):
        valid_tones = [
            "NATURAL",
            "ASH",
            "BLUE",
            "GREEN",
            "VIOLET",
            "PEARL",
            "BEIGE",
            "GOLD",
            "YELLOW",
            "COPPER",
            "ORANGE",
            "RED",
            "MAHOGANY",
            "PINK",
            "MIXED",
            "UNKNOWN",
        ]
        for t in valid_tones:
            assert validate_tone(t) is True

        assert validate_tone("SPARKLE") is False
        assert validate_tone("ash") is False  # Case-sensitive enum
        assert validate_tone("") is False

    def test_validate_confidence(self):
        assert validate_confidence(0.0) is True
        assert validate_confidence(1.0) is True
        assert validate_confidence(0.75) is True
        assert validate_confidence(Decimal("0.85")) is True
        assert validate_confidence(-0.01) is False
        assert validate_confidence(1.01) is False
        assert validate_confidence("invalid") is False  # type: ignore

    def test_validate_lab_completeness(self):
        assert validate_lab_completeness(50.0, 10.0, -10.0) is True
        assert validate_lab_completeness(None, None, None) is True
        assert validate_lab_completeness(50.0, None, -10.0) is False
        assert validate_lab_completeness(None, 10.0, -10.0) is False
        assert validate_lab_completeness(50.0, 10.0, None) is False

    def test_validate_measurement_with_metadata(self):
        # When status is VALID, metadata must be provided
        class FakeMeasurement:
            def __init__(self, status):
                self.status = status

        valid_m = FakeMeasurement(MeasurementStatusEnum.VALID)
        provisional_m = FakeMeasurement(MeasurementStatusEnum.PROVISIONAL)

        assert validate_measurement_with_metadata(valid_m, {"illuminant": "D65"}) is True
        assert validate_measurement_with_metadata(valid_m, None) is False
        assert validate_measurement_with_metadata(provisional_m, None) is True

    def test_validate_photo_prediction_not_instrument(self):
        # A photo prediction must never be labelled INSTRUMENT_MEASURED
        assert (
            validate_photo_prediction_not_instrument(
                provenance=AssessmentProvenanceEnum.INSTRUMENT_MEASURED,
                source="photo",
            )
            is False
        )
        assert (
            validate_photo_prediction_not_instrument(
                provenance=AssessmentProvenanceEnum.PREDICTED,
                source="photo",
            )
            is True
        )
        assert (
            validate_photo_prediction_not_instrument(
                provenance=AssessmentProvenanceEnum.COLOURIST_CONFIRMED,
                source="photo",
            )
            is True
        )
        assert (
            validate_photo_prediction_not_instrument(
                provenance=AssessmentProvenanceEnum.INSTRUMENT_MEASURED,
                source="spectrophotometer",
            )
            is True
        )
