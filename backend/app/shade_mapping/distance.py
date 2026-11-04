"""
Shade Mapping Engine v1.0 — Distance Metrics.

Implements the multi-dimensional shade distance model from Section 4.4:
    D = w_L * D_L + w_T * D_T + w_I * D_I + w_C * D_C
"""

from __future__ import annotations

from backend.app.shade_mapping.tone_matrix import calculate_compound_tone_distance
from backend.app.universal_colour.enums import ToneFamilyEnum, ToneIntensityEnum

# Standard calibrated weights
DEFAULT_WEIGHT_L = 1.0  # Level weight
DEFAULT_WEIGHT_T = 1.2  # Tone weight
DEFAULT_WEIGHT_I = 0.3  # Intensity weight
DEFAULT_WEIGHT_C = 0.1  # Physical colour difference (CIEDE2000) weight

_INTENSITY_VALUES: dict[ToneIntensityEnum, float] = {
    ToneIntensityEnum.SOFT: 1.0,
    ToneIntensityEnum.STANDARD: 2.0,
    ToneIntensityEnum.INTENSE: 3.0,
    ToneIntensityEnum.EXTRA_INTENSE: 4.0,
}


def calculate_level_distance(target_level: int, candidate_level: int) -> float:
    """
    Categorical depth level difference: D_L = |L_target - L_candidate|.
    """
    return float(abs(target_level - candidate_level))


def calculate_intensity_distance(
    target_intensity: ToneIntensityEnum,
    candidate_intensity: ToneIntensityEnum,
) -> float:
    """
    Intensity difference D_I in [0.0, 1.0].
    If either intensity is UNKNOWN, a default penalty (0.4) is applied because
    unknown dimensions must not be assigned zero difference.
    """
    if (
        target_intensity == ToneIntensityEnum.UNKNOWN
        or candidate_intensity == ToneIntensityEnum.UNKNOWN
    ):
        return 0.4

    val_target = _INTENSITY_VALUES.get(target_intensity, 2.0)
    val_cand = _INTENSITY_VALUES.get(candidate_intensity, 2.0)
    # Range is 1 to 4 -> max difference is 3.0
    return abs(val_target - val_cand) / 3.0


def calculate_composite_distance(
    target_level: int,
    target_primary_tone: ToneFamilyEnum,
    target_secondary_tone: ToneFamilyEnum | None,
    target_intensity: ToneIntensityEnum,
    candidate_level: int,
    candidate_primary_tone: ToneFamilyEnum,
    candidate_secondary_tone: ToneFamilyEnum | None,
    candidate_intensity: ToneIntensityEnum,
    delta_e00: float | None = None,
    weight_l: float = DEFAULT_WEIGHT_L,
    weight_t: float = DEFAULT_WEIGHT_T,
    weight_i: float = DEFAULT_WEIGHT_I,
    weight_c: float = DEFAULT_WEIGHT_C,
) -> float:
    """
    Calculate the total composite distance score D.
    Lower score indicates closer match.
    """
    d_l = calculate_level_distance(target_level, candidate_level)
    d_t = calculate_compound_tone_distance(
        target_primary_tone,
        target_secondary_tone,
        candidate_primary_tone,
        candidate_secondary_tone,
    )
    d_i = calculate_intensity_distance(target_intensity, candidate_intensity)

    d_c = delta_e00 if delta_e00 is not None else 0.0

    return (weight_l * d_l) + (weight_t * d_t) + (weight_i * d_i) + (weight_c * d_c)
