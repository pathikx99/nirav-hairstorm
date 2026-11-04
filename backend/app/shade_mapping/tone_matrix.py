"""
Shade Mapping Engine v1.0 — Versioned Tone Relationship Matrix.

Provides a calibrated distance metric between hair colour tone families.
Distance is normalized to [0.0, 1.0], where:
- 0.0 = Identical tonal direction
- 0.1 - 0.3 = Subtle / harmonic tonal difference
- 0.4 - 0.6 = Noticeable difference / different temperature
- 0.7 - 1.0 = Opposing / complementary / clashing tones
"""

from __future__ import annotations

from backend.app.universal_colour.enums import ToneFamilyEnum

TONE_MATRIX_VERSION = "1.0"

# Base pairwise distance matrix between all 16 ToneFamilyEnum members.
# Keyed by (frozenset([Tone1, Tone2])) or (Tone1, Tone2) symmetrically.
_BASE_TONE_DISTANCES: dict[tuple[ToneFamilyEnum, ToneFamilyEnum], float] = {
    # Identity
    **{(t, t): 0.0 for t in ToneFamilyEnum},
    # Unknown tone handling (unknown dimensions must never be zero difference)
    **{(ToneFamilyEnum.UNKNOWN, t): 0.6 for t in ToneFamilyEnum if t != ToneFamilyEnum.UNKNOWN},
    **{(t, ToneFamilyEnum.UNKNOWN): 0.6 for t in ToneFamilyEnum if t != ToneFamilyEnum.UNKNOWN},
    # Mixed tone handling
    **{
        (ToneFamilyEnum.MIXED, t): 0.5
        for t in ToneFamilyEnum
        if t not in (ToneFamilyEnum.UNKNOWN, ToneFamilyEnum.MIXED)
    },
    **{
        (t, ToneFamilyEnum.MIXED): 0.5
        for t in ToneFamilyEnum
        if t not in (ToneFamilyEnum.UNKNOWN, ToneFamilyEnum.MIXED)
    },
    # NATURAL (Neutral base)
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.BEIGE): 0.15,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.ASH): 0.35,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.PEARL): 0.35,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.GOLD): 0.35,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.COPPER): 0.45,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.MAHOGANY): 0.45,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.RED): 0.50,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.VIOLET): 0.45,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.BLUE): 0.55,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.GREEN): 0.50,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.YELLOW): 0.40,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.ORANGE): 0.45,
    (ToneFamilyEnum.NATURAL, ToneFamilyEnum.PINK): 0.45,
    # BEIGE (Balanced neutral warm-cool)
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.GOLD): 0.25,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.ASH): 0.30,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.PEARL): 0.30,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.COPPER): 0.40,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.MAHOGANY): 0.40,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.RED): 0.50,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.VIOLET): 0.45,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.YELLOW): 0.30,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.ORANGE): 0.40,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.BLUE): 0.55,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.GREEN): 0.45,
    (ToneFamilyEnum.BEIGE, ToneFamilyEnum.PINK): 0.40,
    # ASH (Cool blue-green reflect)
    (ToneFamilyEnum.ASH, ToneFamilyEnum.PEARL): 0.15,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.BLUE): 0.20,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.GREEN): 0.25,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.VIOLET): 0.35,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.GOLD): 0.80,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.YELLOW): 0.85,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.COPPER): 0.85,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.ORANGE): 0.90,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.RED): 0.90,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.MAHOGANY): 0.70,
    (ToneFamilyEnum.ASH, ToneFamilyEnum.PINK): 0.65,
    # PEARL (Cool iridescent reflect)
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.BLUE): 0.25,
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.VIOLET): 0.25,
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.GREEN): 0.35,
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.GOLD): 0.75,
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.YELLOW): 0.80,
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.COPPER): 0.85,
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.ORANGE): 0.85,
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.RED): 0.80,
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.MAHOGANY): 0.60,
    (ToneFamilyEnum.PEARL, ToneFamilyEnum.PINK): 0.50,
    # BLUE
    (ToneFamilyEnum.BLUE, ToneFamilyEnum.GREEN): 0.25,
    (ToneFamilyEnum.BLUE, ToneFamilyEnum.VIOLET): 0.25,
    (ToneFamilyEnum.BLUE, ToneFamilyEnum.GOLD): 0.85,
    (ToneFamilyEnum.BLUE, ToneFamilyEnum.YELLOW): 0.90,
    (ToneFamilyEnum.BLUE, ToneFamilyEnum.COPPER): 0.95,
    (ToneFamilyEnum.BLUE, ToneFamilyEnum.ORANGE): 0.95,
    (ToneFamilyEnum.BLUE, ToneFamilyEnum.RED): 0.85,
    (ToneFamilyEnum.BLUE, ToneFamilyEnum.MAHOGANY): 0.70,
    (ToneFamilyEnum.BLUE, ToneFamilyEnum.PINK): 0.65,
    # GREEN
    (ToneFamilyEnum.GREEN, ToneFamilyEnum.YELLOW): 0.35,
    (ToneFamilyEnum.GREEN, ToneFamilyEnum.GOLD): 0.40,
    (ToneFamilyEnum.GREEN, ToneFamilyEnum.VIOLET): 0.80,
    (ToneFamilyEnum.GREEN, ToneFamilyEnum.RED): 0.95,
    (ToneFamilyEnum.GREEN, ToneFamilyEnum.MAHOGANY): 0.85,
    (ToneFamilyEnum.GREEN, ToneFamilyEnum.COPPER): 0.75,
    (ToneFamilyEnum.GREEN, ToneFamilyEnum.ORANGE): 0.75,
    (ToneFamilyEnum.GREEN, ToneFamilyEnum.PINK): 0.85,
    # VIOLET (Cool purple)
    (ToneFamilyEnum.VIOLET, ToneFamilyEnum.MAHOGANY): 0.25,
    (ToneFamilyEnum.VIOLET, ToneFamilyEnum.PINK): 0.30,
    (ToneFamilyEnum.VIOLET, ToneFamilyEnum.RED): 0.40,
    (ToneFamilyEnum.VIOLET, ToneFamilyEnum.GOLD): 0.85,
    (ToneFamilyEnum.VIOLET, ToneFamilyEnum.YELLOW): 0.90,
    (ToneFamilyEnum.VIOLET, ToneFamilyEnum.COPPER): 0.75,
    (ToneFamilyEnum.VIOLET, ToneFamilyEnum.ORANGE): 0.80,
    # GOLD & YELLOW (Warm reflects)
    (ToneFamilyEnum.GOLD, ToneFamilyEnum.YELLOW): 0.10,
    (ToneFamilyEnum.GOLD, ToneFamilyEnum.COPPER): 0.30,
    (ToneFamilyEnum.GOLD, ToneFamilyEnum.ORANGE): 0.30,
    (ToneFamilyEnum.GOLD, ToneFamilyEnum.RED): 0.60,
    (ToneFamilyEnum.GOLD, ToneFamilyEnum.MAHOGANY): 0.65,
    (ToneFamilyEnum.GOLD, ToneFamilyEnum.PINK): 0.60,
    (ToneFamilyEnum.YELLOW, ToneFamilyEnum.COPPER): 0.35,
    (ToneFamilyEnum.YELLOW, ToneFamilyEnum.ORANGE): 0.30,
    (ToneFamilyEnum.YELLOW, ToneFamilyEnum.RED): 0.65,
    (ToneFamilyEnum.YELLOW, ToneFamilyEnum.MAHOGANY): 0.70,
    (ToneFamilyEnum.YELLOW, ToneFamilyEnum.PINK): 0.65,
    # COPPER & ORANGE
    (ToneFamilyEnum.COPPER, ToneFamilyEnum.ORANGE): 0.10,
    (ToneFamilyEnum.COPPER, ToneFamilyEnum.RED): 0.25,
    (ToneFamilyEnum.COPPER, ToneFamilyEnum.MAHOGANY): 0.40,
    (ToneFamilyEnum.COPPER, ToneFamilyEnum.PINK): 0.45,
    (ToneFamilyEnum.ORANGE, ToneFamilyEnum.RED): 0.25,
    (ToneFamilyEnum.ORANGE, ToneFamilyEnum.MAHOGANY): 0.40,
    (ToneFamilyEnum.ORANGE, ToneFamilyEnum.PINK): 0.45,
    # RED, MAHOGANY, PINK
    (ToneFamilyEnum.RED, ToneFamilyEnum.MAHOGANY): 0.20,
    (ToneFamilyEnum.RED, ToneFamilyEnum.PINK): 0.25,
    (ToneFamilyEnum.MAHOGANY, ToneFamilyEnum.PINK): 0.30,
}


def get_tone_distance(tone_1: ToneFamilyEnum, tone_2: ToneFamilyEnum) -> float:
    """
    Look up the symmetric tonal difference D_T between two tone families.
    """
    if tone_1 == tone_2:
        return 0.0

    pair = (tone_1, tone_2)
    if pair in _BASE_TONE_DISTANCES:
        return _BASE_TONE_DISTANCES[pair]

    reversed_pair = (tone_2, tone_1)
    if reversed_pair in _BASE_TONE_DISTANCES:
        return _BASE_TONE_DISTANCES[reversed_pair]

    # Default fallback for unlisted pairs
    return 0.5


def calculate_compound_tone_distance(
    target_primary: ToneFamilyEnum,
    target_secondary: ToneFamilyEnum | None,
    candidate_primary: ToneFamilyEnum,
    candidate_secondary: ToneFamilyEnum | None,
) -> float:
    """
    Calculate the total tonal distance accounting for both primary and secondary reflects.

    Primary reflect dominates (weight 0.75-0.80), with secondary reflect providing
    fine nuance modulation.
    """
    d_primary = get_tone_distance(target_primary, candidate_primary)

    # Both have secondary tones
    if target_secondary is not None and candidate_secondary is not None:
        d_secondary = get_tone_distance(target_secondary, candidate_secondary)
        return 0.75 * d_primary + 0.25 * d_secondary

    # Target has secondary, candidate does not
    if target_secondary is not None and candidate_secondary is None:
        # Candidate lacks the modifier reflect
        d_mod = get_tone_distance(target_secondary, candidate_primary)
        return 0.80 * d_primary + 0.20 * min(0.6, d_mod)

    # Candidate has secondary, target does not
    if target_secondary is None and candidate_secondary is not None:
        # Candidate introduces an extra modifier reflect
        d_extra = get_tone_distance(target_primary, candidate_secondary)
        return 0.85 * d_primary + 0.15 * min(0.5, d_extra)

    # Neither has secondary tone
    return d_primary
