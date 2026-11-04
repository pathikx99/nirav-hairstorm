"""
Unit tests for UHCR Pydantic Schemas.

Tests:
- CIELABMeasurement validation rules (all-or-nothing, VALID status, ranges)
- CIELChValues derived properties (chroma_c, hue_angle)
- UHCRRecord schema contract, versioning, confidence boundaries, unknown tone rules
- PhotoCaptureInfo, PhotoRegionPrediction, PhotoAssessment schemas
- HairRegionAssessment schema
"""

from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from backend.app.universal_colour.enums import (
    AssessmentProvenanceEnum,
    ClassificationStatusEnum,
    ColourFamilyEnum,
    HairRegionEnum,
    MeasurementStatusEnum,
    ToneFamilyEnum,
    ToneIntensityEnum,
    UniversalLevel,
)
from backend.app.universal_colour.schemas import (
    CIELABMeasurement,
    CIELChValues,
    HairRegionAssessment,
    PhotoAssessment,
    PhotoCaptureInfo,
    PhotoRegionPrediction,
    UHCRRecord,
)


class TestCIELABMeasurement:
    """Tests for CIELABMeasurement schema and validators."""

    def test_valid_measurement_complete(self):
        m = CIELABMeasurement(
            l_star=Decimal("50.5"),
            a_star=Decimal("12.3"),
            b_star=Decimal("-4.2"),
            status=MeasurementStatusEnum.VALID,
        )
        assert m.l_star == Decimal("50.5")
        assert m.a_star == Decimal("12.3")
        assert m.b_star == Decimal("-4.2")
        assert m.status == MeasurementStatusEnum.VALID
        assert m.space == "CIELAB"

    def test_valid_measurement_not_available(self):
        m = CIELABMeasurement(
            l_star=None,
            a_star=None,
            b_star=None,
            status=MeasurementStatusEnum.NOT_AVAILABLE,
        )
        assert m.l_star is None
        assert m.status == MeasurementStatusEnum.NOT_AVAILABLE

    def test_partial_lab_values_raises_error(self):
        """Lab values must be all present or all absent."""
        with pytest.raises(ValidationError, match="all present or all absent"):
            CIELABMeasurement(
                l_star=Decimal("50.0"),
                a_star=Decimal("10.0"),
                b_star=None,
                status=MeasurementStatusEnum.PROVISIONAL,
            )

        with pytest.raises(ValidationError, match="all present or all absent"):
            CIELABMeasurement(
                l_star=None,
                a_star=Decimal("10.0"),
                b_star=Decimal("-10.0"),
                status=MeasurementStatusEnum.PROVISIONAL,
            )

    def test_valid_status_requires_lab_values(self):
        """A measurement marked VALID must have actual Lab values."""
        with pytest.raises(ValidationError, match="status=VALID must include"):
            CIELABMeasurement(
                l_star=None,
                a_star=None,
                b_star=None,
                status=MeasurementStatusEnum.VALID,
            )

    def test_lab_value_ranges(self):
        """L* must be 0-100, a* and b* must be -128 to 127."""
        with pytest.raises(ValidationError, match="L\\* must be between 0 and 100"):
            CIELABMeasurement(
                l_star=Decimal("105.0"),
                a_star=Decimal("0.0"),
                b_star=Decimal("0.0"),
                status=MeasurementStatusEnum.PROVISIONAL,
            )

        with pytest.raises(ValidationError, match="a\\* must be between −128 and 127"):
            CIELABMeasurement(
                l_star=Decimal("50.0"),
                a_star=Decimal("130.0"),
                b_star=Decimal("0.0"),
                status=MeasurementStatusEnum.PROVISIONAL,
            )


class TestCIELChValues:
    """Tests for CIELCh computed fields."""

    def test_computed_chroma_and_hue(self):
        ch = CIELChValues(
            l_star=Decimal("50.0"),
            a_star=Decimal("3.0"),
            b_star=Decimal("4.0"),
        )
        assert ch.l_star == Decimal("50.0")
        assert ch.chroma_c == pytest.approx(5.0)
        assert ch.hue_angle == pytest.approx(53.13, abs=0.01)


class TestUHCRRecord:
    """Tests for core UHCRRecord JSON contract."""

    def test_minimal_valid_record(self):
        rec = UHCRRecord(
            level=UniversalLevel.BLONDE,
            primary_tone=ToneFamilyEnum.ASH,
            classification_status=ClassificationStatusEnum.PREDICTED,
        )
        assert rec.schema_version == "1.0"
        assert rec.level == 7
        assert rec.primary_tone == ToneFamilyEnum.ASH
        assert rec.secondary_tone is None
        assert rec.tone_intensity == ToneIntensityEnum.UNKNOWN
        assert rec.classification_status == ClassificationStatusEnum.PREDICTED

    def test_full_valid_record(self):
        ref_id = uuid4()
        rec = UHCRRecord(
            schema_version="1.0",
            level=UniversalLevel.LIGHT_BLONDE,
            primary_tone=ToneFamilyEnum.ASH,
            secondary_tone=ToneFamilyEnum.VIOLET,
            tone_intensity=ToneIntensityEnum.STANDARD,
            colour_family=ColourFamilyEnum.FASHION,
            measurement=CIELABMeasurement(
                l_star=Decimal("65.2"),
                a_star=Decimal("-1.5"),
                b_star=Decimal("8.3"),
                status=MeasurementStatusEnum.VALID,
            ),
            classification_status=ClassificationStatusEnum.COLOURIST_CONFIRMED,
            mapping_confidence=Decimal("0.95"),
            evidence_reference=ref_id,
        )
        assert rec.level == 8
        assert rec.evidence_reference == ref_id
        assert rec.mapping_confidence == Decimal("0.95")

    def test_confidence_range_validation(self):
        """Confidence must be between 0 and 1."""
        with pytest.raises(ValidationError):
            UHCRRecord(
                level=UniversalLevel.BLONDE,
                primary_tone=ToneFamilyEnum.NATURAL,
                classification_status=ClassificationStatusEnum.PREDICTED,
                mapping_confidence=Decimal("1.05"),
            )

        with pytest.raises(ValidationError):
            UHCRRecord(
                level=UniversalLevel.BLONDE,
                primary_tone=ToneFamilyEnum.NATURAL,
                classification_status=ClassificationStatusEnum.PREDICTED,
                mapping_confidence=Decimal("-0.01"),
            )

    def test_unknown_tone_cannot_have_intensity(self):
        """When primary_tone is UNKNOWN, tone_intensity must also be UNKNOWN."""
        with pytest.raises(ValidationError, match="tone_intensity must also be UNKNOWN"):
            UHCRRecord(
                level=UniversalLevel.DARK_BROWN,
                primary_tone=ToneFamilyEnum.UNKNOWN,
                tone_intensity=ToneIntensityEnum.INTENSE,
                classification_status=ClassificationStatusEnum.PREDICTED,
            )

    def test_json_serialization_round_trip(self):
        """Record serializes to JSON matching the specification format."""
        rec = UHCRRecord(
            schema_version="1.0",
            level=UniversalLevel.BLONDE,
            primary_tone=ToneFamilyEnum.ASH,
            secondary_tone=ToneFamilyEnum.VIOLET,
            tone_intensity=ToneIntensityEnum.UNKNOWN,
            colour_family=ColourFamilyEnum.FASHION,
            measurement=CIELABMeasurement(
                space="CIELAB",
                l_star=None,
                a_star=None,
                b_star=None,
                status=MeasurementStatusEnum.NOT_AVAILABLE,
            ),
            classification_status=ClassificationStatusEnum.COLOURIST_CONFIRMED,
            evidence_reference=None,
        )
        data = rec.model_dump()
        assert data["level"] == 7
        assert data["primary_tone"] == "ASH"
        assert data["secondary_tone"] == "VIOLET"
        assert data["measurement"]["status"] == "NOT_AVAILABLE"

        # Roundtrip
        rec2 = UHCRRecord.model_validate(data)
        assert rec2 == rec


class TestPhotoAssessment:
    """Tests for photo assessment schemas."""

    def test_photo_assessment_structure(self):
        capture = PhotoCaptureInfo(
            lighting_type="controlled",
            colour_reference_present=True,
            white_balance_status="calibrated",
            image_quality="acceptable",
        )
        roots = PhotoRegionPrediction(
            predicted_level=UniversalLevel.MEDIUM_BROWN,
            predicted_tone=ToneFamilyEnum.RED,
            confidence=Decimal("0.82"),
            colourist_confirmed=False,
        )
        mid_lengths = PhotoRegionPrediction(
            predicted_level=UniversalLevel.DARK_BLONDE,
            predicted_tone=ToneFamilyEnum.ORANGE,
            confidence=Decimal("0.75"),
            colourist_confirmed=False,
        )
        ends = PhotoRegionPrediction(
            predicted_level=UniversalLevel.LIGHT_BLONDE,
            predicted_tone=ToneFamilyEnum.YELLOW,
            confidence=Decimal("0.88"),
            colourist_confirmed=False,
        )

        assessment = PhotoAssessment(
            capture=capture,
            regions={
                HairRegionEnum.ROOTS.value: roots,
                HairRegionEnum.MID_LENGTHS.value: mid_lengths,
                HairRegionEnum.ENDS.value: ends,
            },
        )
        assert assessment.capture.colour_reference_present is True
        assert assessment.regions["ROOTS"].predicted_level == 4
        assert assessment.regions["MID_LENGTHS"].predicted_level == 6
        assert assessment.regions["ENDS"].predicted_level == 8


class TestHairRegionAssessment:
    """Tests for HairRegionAssessment schema."""

    def test_valid_hair_region_assessment(self):
        reg = HairRegionAssessment(
            observed_level=UniversalLevel.DARKEST_BROWN,
            observed_undertone=ToneFamilyEnum.RED,
            existing_artificial_colour=True,
            porosity_assessment="high",
            condition_assessment="damaged",
            previous_chemical_services=["bleach", "permanent_colour"],
            assessment_confidence=Decimal("0.90"),
            colourist_confirmation=True,
            assessment_provenance=AssessmentProvenanceEnum.COLOURIST_CONFIRMED,
        )
        assert reg.observed_level == 2
        assert reg.existing_artificial_colour is True
        assert reg.colourist_confirmation is True
        assert reg.assessment_provenance == AssessmentProvenanceEnum.COLOURIST_CONFIRMED
