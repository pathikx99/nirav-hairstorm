"""
Unit tests for the Versioned Tone Relationship Matrix (D_T).

Tests:
- Symmetry: D_T(t1, t2) == D_T(t2, t1)
- Identity: D_T(t, t) == 0.0
- Range: 0.0 <= D_T <= 1.0
- Unknown penalty: D_T(t, UNKNOWN) > 0.0 (unknown dimensions must not be 0 difference)
- Calibrated tone distance ordering:
    D(Ash, Pearl) < D(Ash, Gold) < D(Ash, Red)
- Compound tone distance with primary and secondary reflects
"""

import pytest

from backend.app.shade_mapping.tone_matrix import (
    calculate_compound_tone_distance,
    get_tone_distance,
)
from backend.app.universal_colour.enums import ToneFamilyEnum


class TestToneMatrix:
    """Validate Tone Relationship Matrix invariants and calibrated values."""

    def test_identity(self):
        for tone in ToneFamilyEnum:
            assert get_tone_distance(tone, tone) == 0.0

    def test_symmetry(self):
        tones = list(ToneFamilyEnum)
        for i in range(len(tones)):
            for j in range(i + 1, len(tones)):
                t1, t2 = tones[i], tones[j]
                d1 = get_tone_distance(t1, t2)
                d2 = get_tone_distance(t2, t1)
                assert d1 == pytest.approx(d2), f"Symmetry failed for {t1} and {t2}"

    def test_normalized_range(self):
        tones = list(ToneFamilyEnum)
        for t1 in tones:
            for t2 in tones:
                d = get_tone_distance(t1, t2)
                assert 0.0 <= d <= 1.0, f"Distance out of bounds for {t1}, {t2}: {d}"

    def test_unknown_tone_never_zero(self):
        """Unknown dimensions must not be assigned zero difference."""
        for tone in ToneFamilyEnum:
            if tone != ToneFamilyEnum.UNKNOWN:
                assert get_tone_distance(tone, ToneFamilyEnum.UNKNOWN) > 0.0
                assert get_tone_distance(ToneFamilyEnum.UNKNOWN, tone) >= 0.5

    def test_calibrated_relationships(self):
        # Ash is closer to Pearl than to Gold or Copper
        d_ash_pearl = get_tone_distance(ToneFamilyEnum.ASH, ToneFamilyEnum.PEARL)
        d_ash_gold = get_tone_distance(ToneFamilyEnum.ASH, ToneFamilyEnum.GOLD)
        d_ash_copper = get_tone_distance(ToneFamilyEnum.ASH, ToneFamilyEnum.COPPER)
        d_ash_red = get_tone_distance(ToneFamilyEnum.ASH, ToneFamilyEnum.RED)

        assert d_ash_pearl < d_ash_gold
        assert d_ash_gold < d_ash_copper
        assert d_ash_copper <= d_ash_red

        # Gold is closer to Yellow and Beige than to Violet
        d_gold_yellow = get_tone_distance(ToneFamilyEnum.GOLD, ToneFamilyEnum.YELLOW)
        d_gold_beige = get_tone_distance(ToneFamilyEnum.GOLD, ToneFamilyEnum.BEIGE)
        d_gold_violet = get_tone_distance(ToneFamilyEnum.GOLD, ToneFamilyEnum.VIOLET)

        assert d_gold_yellow < d_gold_beige
        assert d_gold_beige < d_gold_violet

    def test_compound_tone_distance(self):
        # Identical primary and secondary -> distance 0.0
        d_same = calculate_compound_tone_distance(
            ToneFamilyEnum.ASH,
            ToneFamilyEnum.VIOLET,
            ToneFamilyEnum.ASH,
            ToneFamilyEnum.VIOLET,
        )
        assert d_same == 0.0

        # Same primary (ASH), different secondary (VIOLET vs None) -> small modifier penalty
        d_diff_sec = calculate_compound_tone_distance(
            ToneFamilyEnum.ASH,
            ToneFamilyEnum.VIOLET,
            ToneFamilyEnum.ASH,
            None,
        )
        assert 0.0 < d_diff_sec < 0.25

        # Different primary (ASH vs GOLD) with same secondary -> large primary distance
        d_diff_prim = calculate_compound_tone_distance(
            ToneFamilyEnum.ASH,
            ToneFamilyEnum.VIOLET,
            ToneFamilyEnum.GOLD,
            ToneFamilyEnum.VIOLET,
        )
        assert d_diff_prim > 0.50
