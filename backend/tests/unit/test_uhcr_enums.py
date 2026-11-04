"""Unit tests for UHCR v1.0 enumerations.

Validates that all UHCR enums match the specification exactly: correct
member names, correct values, correct cardinality, and that invalid
values are properly rejected.
"""

from __future__ import annotations

import pytest

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

# ── UniversalLevel ──────────────────────────────────────────────────


class TestUniversalLevel:
    """Tests for the ICC depth-level enum (1–10)."""

    def test_values_are_1_through_10(self) -> None:
        values = sorted(member.value for member in UniversalLevel)
        assert values == list(range(1, 11))

    def test_level_count(self) -> None:
        assert len(UniversalLevel) == 10

    @pytest.mark.parametrize(
        ("name", "expected_value"),
        [
            ("BLACK", 1),
            ("DARKEST_BROWN", 2),
            ("DARK_BROWN", 3),
            ("MEDIUM_BROWN", 4),
            ("LIGHT_BROWN", 5),
            ("DARK_BLONDE", 6),
            ("BLONDE", 7),
            ("LIGHT_BLONDE", 8),
            ("VERY_LIGHT_BLONDE", 9),
            ("EXTRA_LIGHT_BLONDE", 10),
        ],
    )
    def test_each_level_name_and_value(self, name: str, expected_value: int) -> None:
        member = UniversalLevel[name]
        assert member.value == expected_value

    def test_is_int_enum(self) -> None:
        assert isinstance(UniversalLevel.BLACK, int)
        assert UniversalLevel.BLACK + 0 == 1

    def test_invalid_level_zero_raises(self) -> None:
        with pytest.raises(ValueError):
            UniversalLevel(0)

    def test_invalid_level_eleven_raises(self) -> None:
        with pytest.raises(ValueError):
            UniversalLevel(11)

    def test_invalid_level_negative_raises(self) -> None:
        with pytest.raises(ValueError):
            UniversalLevel(-1)

    def test_invalid_level_string_raises(self) -> None:
        with pytest.raises((ValueError, KeyError)):
            UniversalLevel("BLACK")  # type: ignore[arg-type]


# ── ToneFamilyEnum ──────────────────────────────────────────────────


class TestToneFamilyEnum:
    """Tests for tone family classification."""

    EXPECTED_MEMBERS = {
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
    }

    def test_all_16_members_exist(self) -> None:
        member_names = {m.name for m in ToneFamilyEnum}
        assert member_names == self.EXPECTED_MEMBERS

    def test_member_count(self) -> None:
        assert len(ToneFamilyEnum) == 16

    def test_values_are_uppercase_strings(self) -> None:
        for member in ToneFamilyEnum:
            assert member.value == member.name
            assert member.value == member.value.upper()

    def test_is_string_enum(self) -> None:
        assert isinstance(ToneFamilyEnum.NATURAL, str)
        assert ToneFamilyEnum.NATURAL == "NATURAL"

    def test_invalid_tone_raises(self) -> None:
        with pytest.raises(ValueError):
            ToneFamilyEnum("BURGUNDY")

    def test_mixed_tone_exists(self) -> None:
        """MIXED represents deliberate blends of tone families."""
        assert ToneFamilyEnum.MIXED.value == "MIXED"

    def test_unknown_tone_exists(self) -> None:
        """UNKNOWN represents absent tone information."""
        assert ToneFamilyEnum.UNKNOWN.value == "UNKNOWN"


# ── ToneIntensityEnum ───────────────────────────────────────────────


class TestToneIntensityEnum:
    """Tests for tone intensity modifiers."""

    EXPECTED_MEMBERS = {"UNKNOWN", "SOFT", "STANDARD", "INTENSE", "EXTRA_INTENSE"}

    def test_all_members_exist(self) -> None:
        member_names = {m.name for m in ToneIntensityEnum}
        assert member_names == self.EXPECTED_MEMBERS

    def test_member_count(self) -> None:
        assert len(ToneIntensityEnum) == 5

    def test_values_match_names(self) -> None:
        for member in ToneIntensityEnum:
            assert member.value == member.name

    def test_invalid_intensity_raises(self) -> None:
        with pytest.raises(ValueError):
            ToneIntensityEnum("EXTREME")


# ── ColourFamilyEnum ────────────────────────────────────────────────


class TestColourFamilyEnum:
    """Tests for product colour family classification."""

    EXPECTED_MEMBERS = {
        "NATURAL",
        "FASHION",
        "SPECIAL_BLONDE",
        "HIGH_LIFT",
        "PASTEL",
        "TONER",
        "GLOSS",
        "CORRECTOR",
        "SPECIAL_MIX",
        "OTHER",
        "UNKNOWN",
    }

    def test_all_members_exist(self) -> None:
        member_names = {m.name for m in ColourFamilyEnum}
        assert member_names == self.EXPECTED_MEMBERS

    def test_member_count(self) -> None:
        assert len(ColourFamilyEnum) == 11

    def test_values_match_names(self) -> None:
        for member in ColourFamilyEnum:
            assert member.value == member.name

    def test_invalid_family_raises(self) -> None:
        with pytest.raises(ValueError):
            ColourFamilyEnum("METALLIC")


# ── MeasurementStatusEnum ──────────────────────────────────────────


class TestMeasurementStatusEnum:
    """Tests for CIELAB measurement status values."""

    EXPECTED_MEMBERS = {"VALID", "PROVISIONAL", "INVALID", "NOT_AVAILABLE"}

    def test_all_members_exist(self) -> None:
        member_names = {m.name for m in MeasurementStatusEnum}
        assert member_names == self.EXPECTED_MEMBERS

    def test_member_count(self) -> None:
        assert len(MeasurementStatusEnum) == 4

    def test_invalid_status_raises(self) -> None:
        with pytest.raises(ValueError):
            MeasurementStatusEnum("PENDING")

    def test_values_match_names(self) -> None:
        for member in MeasurementStatusEnum:
            assert member.value == member.name


# ── ClassificationStatusEnum ───────────────────────────────────────


class TestClassificationStatusEnum:
    """Tests for UHCR classification provenance."""

    EXPECTED_MEMBERS = {"PREDICTED", "COLOURIST_CONFIRMED", "INSTRUMENT_MEASURED"}

    def test_all_members_exist(self) -> None:
        member_names = {m.name for m in ClassificationStatusEnum}
        assert member_names == self.EXPECTED_MEMBERS

    def test_member_count(self) -> None:
        assert len(ClassificationStatusEnum) == 3

    def test_invalid_status_raises(self) -> None:
        with pytest.raises(ValueError):
            ClassificationStatusEnum("AUTO_GENERATED")

    def test_values_match_names(self) -> None:
        for member in ClassificationStatusEnum:
            assert member.value == member.name


# ── HairRegionEnum ──────────────────────────────────────────────────


class TestHairRegionEnum:
    """Tests for physical hair strand regions."""

    EXPECTED_MEMBERS = {"ROOTS", "MID_LENGTHS", "ENDS", "OTHER"}

    def test_all_members_exist(self) -> None:
        member_names = {m.name for m in HairRegionEnum}
        assert member_names == self.EXPECTED_MEMBERS

    def test_member_count(self) -> None:
        assert len(HairRegionEnum) == 4

    def test_invalid_region_raises(self) -> None:
        with pytest.raises(ValueError):
            HairRegionEnum("SCALP")

    def test_values_match_names(self) -> None:
        for member in HairRegionEnum:
            assert member.value == member.name


# ── AssessmentProvenanceEnum ────────────────────────────────────────


class TestAssessmentProvenanceEnum:
    """Tests for region assessment provenance."""

    EXPECTED_MEMBERS = {"PREDICTED", "COLOURIST_CONFIRMED", "INSTRUMENT_MEASURED"}

    def test_all_members_exist(self) -> None:
        member_names = {m.name for m in AssessmentProvenanceEnum}
        assert member_names == self.EXPECTED_MEMBERS

    def test_member_count(self) -> None:
        assert len(AssessmentProvenanceEnum) == 3

    def test_matches_classification_status_values(self) -> None:
        """Provenance enum should mirror classification status values."""
        provenance_values = {m.value for m in AssessmentProvenanceEnum}
        classification_values = {m.value for m in ClassificationStatusEnum}
        assert provenance_values == classification_values


# ── NeutralisationWarmthEnum ───────────────────────────────────────


class TestNeutralisationWarmthEnum:
    """Tests for warm underlying pigments in the lightening sequence."""

    EXPECTED_MEMBERS = {
        "RED",
        "RED_ORANGE",
        "ORANGE",
        "ORANGE_YELLOW",
        "YELLOW",
        "PALE_YELLOW",
    }

    def test_all_members_exist(self) -> None:
        member_names = {m.name for m in NeutralisationWarmthEnum}
        assert member_names == self.EXPECTED_MEMBERS

    def test_member_count(self) -> None:
        assert len(NeutralisationWarmthEnum) == 6

    def test_invalid_warmth_raises(self) -> None:
        with pytest.raises(ValueError):
            NeutralisationWarmthEnum("BROWN")


# ── NeutralisationDirectionEnum ────────────────────────────────────


class TestNeutralisationDirectionEnum:
    """Tests for cool neutralisation pigment directions."""

    EXPECTED_MEMBERS = {
        "GREEN",
        "GREEN_BLUE",
        "BLUE",
        "BLUE_VIOLET",
        "VIOLET",
        "PALE_VIOLET",
    }

    def test_all_members_exist(self) -> None:
        member_names = {m.name for m in NeutralisationDirectionEnum}
        assert member_names == self.EXPECTED_MEMBERS

    def test_member_count(self) -> None:
        assert len(NeutralisationDirectionEnum) == 6

    def test_invalid_direction_raises(self) -> None:
        with pytest.raises(ValueError):
            NeutralisationDirectionEnum("TURQUOISE")

    def test_warmth_and_direction_same_count(self) -> None:
        """Each warmth has a corresponding neutralisation direction."""
        assert len(NeutralisationWarmthEnum) == len(NeutralisationDirectionEnum)
