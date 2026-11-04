"""
Unit tests for UniversalColourService.

Tests:
- create_uhcr_record factory helper
- calculate_colour_distance between records
- convert_to_cielch helper
- get_neutralisation_direction helper
- validate_uhcr_record rule enforcement
"""

from decimal import Decimal

import pytest

from backend.app.universal_colour.enums import (
    ClassificationStatusEnum,
    ColourFamilyEnum,
    MeasurementStatusEnum,
    NeutralisationDirectionEnum,
    NeutralisationWarmthEnum,
    ToneFamilyEnum,
    ToneIntensityEnum,
    UniversalLevel,
)
from backend.app.universal_colour.service import UniversalColourService


class TestUniversalColourService:
    """Tests for UniversalColourService methods."""

    def test_create_uhcr_record(self):
        rec = UniversalColourService.create_uhcr_record(
            level=7,
            primary_tone="ASH",
            secondary_tone="VIOLET",
            tone_intensity="STANDARD",
            colour_family="FASHION",
            l_star=60.0,
            a_star=-2.0,
            b_star=5.0,
            measurement_status=MeasurementStatusEnum.VALID,
            classification_status=ClassificationStatusEnum.COLOURIST_CONFIRMED,
            mapping_confidence=0.9,
        )
        assert rec.level == UniversalLevel.BLONDE
        assert rec.primary_tone == ToneFamilyEnum.ASH
        assert rec.secondary_tone == ToneFamilyEnum.VIOLET
        assert rec.tone_intensity == ToneIntensityEnum.STANDARD
        assert rec.colour_family == ColourFamilyEnum.FASHION
        assert rec.measurement is not None
        assert rec.measurement.status == MeasurementStatusEnum.VALID
        assert rec.measurement.l_star == Decimal("60.0")
        assert rec.mapping_confidence == Decimal("0.9")

    def test_calculate_colour_distance_both_valid(self):
        r1 = UniversalColourService.create_uhcr_record(
            level=7,
            primary_tone="ASH",
            l_star=50.0,
            a_star=2.6772,
            b_star=-79.7751,
            measurement_status=MeasurementStatusEnum.VALID,
            classification_status=ClassificationStatusEnum.INSTRUMENT_MEASURED,
        )
        r2 = UniversalColourService.create_uhcr_record(
            level=7,
            primary_tone="ASH",
            l_star=50.0,
            a_star=0.0,
            b_star=-82.7485,
            measurement_status=MeasurementStatusEnum.VALID,
            classification_status=ClassificationStatusEnum.INSTRUMENT_MEASURED,
        )
        distance = UniversalColourService.calculate_colour_distance(r1, r2)
        assert distance is not None
        assert distance == pytest.approx(2.0425, abs=0.001)

    def test_calculate_colour_distance_returns_none_when_measurement_missing(self):
        r1 = UniversalColourService.create_uhcr_record(
            level=7,
            primary_tone="ASH",
        )
        r2 = UniversalColourService.create_uhcr_record(
            level=7,
            primary_tone="ASH",
            l_star=50.0,
            a_star=0.0,
            b_star=-82.7485,
            measurement_status=MeasurementStatusEnum.VALID,
        )
        assert UniversalColourService.calculate_colour_distance(r1, r2) is None
        assert UniversalColourService.calculate_colour_distance(r2, r1) is None

    def test_calculate_colour_distance_returns_none_when_status_not_valid(self):
        r1 = UniversalColourService.create_uhcr_record(
            level=7,
            primary_tone="ASH",
            l_star=50.0,
            a_star=0.0,
            b_star=0.0,
            measurement_status=MeasurementStatusEnum.PROVISIONAL,
        )
        r2 = UniversalColourService.create_uhcr_record(
            level=7,
            primary_tone="ASH",
            l_star=50.0,
            a_star=0.0,
            b_star=0.0,
            measurement_status=MeasurementStatusEnum.VALID,
        )
        assert UniversalColourService.calculate_colour_distance(r1, r2) is None

    def test_convert_to_cielch(self):
        rec = UniversalColourService.create_uhcr_record(
            level=7,
            primary_tone="ASH",
            l_star=50.0,
            a_star=3.0,
            b_star=4.0,
            measurement_status=MeasurementStatusEnum.VALID,
        )
        cielch = UniversalColourService.convert_to_cielch(rec)
        assert cielch is not None
        assert cielch.l_star == Decimal("50.0")
        assert cielch.chroma_c == pytest.approx(5.0)
        assert cielch.hue_angle == pytest.approx(53.13, abs=0.01)

    def test_convert_to_cielch_no_measurement(self):
        rec = UniversalColourService.create_uhcr_record(
            level=7,
            primary_tone="ASH",
        )
        assert UniversalColourService.convert_to_cielch(rec) is None

    def test_get_neutralisation_direction(self):
        assert (
            UniversalColourService.get_neutralisation_direction(NeutralisationWarmthEnum.RED)
            == NeutralisationDirectionEnum.GREEN
        )
        assert (
            UniversalColourService.get_neutralisation_direction(NeutralisationWarmthEnum.YELLOW)
            == NeutralisationDirectionEnum.VIOLET
        )

    def test_validate_uhcr_record_success(self):
        rec = UniversalColourService.create_uhcr_record(
            level=6,
            primary_tone="COPPER",
            tone_intensity="INTENSE",
        )
        issues = UniversalColourService.validate_uhcr_record(rec)
        assert issues == []
