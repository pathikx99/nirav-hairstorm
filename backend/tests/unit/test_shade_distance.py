"""
Unit tests for Shade Distance metrics.

Tests:
- Level distance D_L
- Intensity distance D_I
- Composite distance D = w_L D_L + w_T D_T + w_I D_I + w_C D_C
"""

import pytest

from backend.app.shade_mapping.distance import (
    calculate_composite_distance,
    calculate_intensity_distance,
    calculate_level_distance,
)
from backend.app.universal_colour.enums import ToneFamilyEnum, ToneIntensityEnum


class TestShadeDistance:
    """Validate distance functions."""

    def test_level_distance(self):
        assert calculate_level_distance(7, 7) == 0.0
        assert calculate_level_distance(7, 8) == 1.0
        assert calculate_level_distance(8, 6) == 2.0
        assert calculate_level_distance(10, 1) == 9.0

    def test_intensity_distance(self):
        # Same intensity
        assert (
            calculate_intensity_distance(ToneIntensityEnum.STANDARD, ToneIntensityEnum.STANDARD)
            == 0.0
        )

        # Step differences
        d_soft_std = calculate_intensity_distance(
            ToneIntensityEnum.SOFT, ToneIntensityEnum.STANDARD
        )
        d_soft_intense = calculate_intensity_distance(
            ToneIntensityEnum.SOFT, ToneIntensityEnum.INTENSE
        )
        d_soft_extra = calculate_intensity_distance(
            ToneIntensityEnum.SOFT, ToneIntensityEnum.EXTRA_INTENSE
        )

        assert d_soft_std < d_soft_intense < d_soft_extra

        # Unknown intensity penalty
        d_unk = calculate_intensity_distance(ToneIntensityEnum.UNKNOWN, ToneIntensityEnum.INTENSE)
        assert d_unk == 0.4
        assert (
            calculate_intensity_distance(ToneIntensityEnum.UNKNOWN, ToneIntensityEnum.UNKNOWN)
            == 0.4
        )

    def test_composite_distance(self):
        # Exact match (same level, same tones, same intensity, no measurement delta)
        d_exact = calculate_composite_distance(
            target_level=7,
            target_primary_tone=ToneFamilyEnum.ASH,
            target_secondary_tone=None,
            target_intensity=ToneIntensityEnum.STANDARD,
            candidate_level=7,
            candidate_primary_tone=ToneFamilyEnum.ASH,
            candidate_secondary_tone=None,
            candidate_intensity=ToneIntensityEnum.STANDARD,
        )
        assert d_exact == 0.0

        # 1 level difference adds w_L * 1.0
        d_1_level = calculate_composite_distance(
            target_level=7,
            target_primary_tone=ToneFamilyEnum.ASH,
            target_secondary_tone=None,
            target_intensity=ToneIntensityEnum.STANDARD,
            candidate_level=8,
            candidate_primary_tone=ToneFamilyEnum.ASH,
            candidate_secondary_tone=None,
            candidate_intensity=ToneIntensityEnum.STANDARD,
        )
        assert d_1_level == pytest.approx(1.0)

        # Level 7 Ash vs Level 7 Gold has tone distance penalty
        d_tone_diff = calculate_composite_distance(
            target_level=7,
            target_primary_tone=ToneFamilyEnum.ASH,
            target_secondary_tone=None,
            target_intensity=ToneIntensityEnum.STANDARD,
            candidate_level=7,
            candidate_primary_tone=ToneFamilyEnum.GOLD,
            candidate_secondary_tone=None,
            candidate_intensity=ToneIntensityEnum.STANDARD,
        )
        assert d_tone_diff > 0.8
