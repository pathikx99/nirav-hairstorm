"""
UHCR v1.0 — Colour Science Module.

Implements CIELAB/CIELCh colour space conversions and the complete CIEDE2000
colour-difference formula as published in:

    Sharma, G., Wu, W., & Dalal, E. N. (2005).
    "The CIEDE2000 color-difference formula: Implementation notes,
    supplementary test data, and mathematical observations."
    Color Research & Application, 30(1), 21–30.

Also provides Lab value validation and the UHCR neutralisation colour-wheel map.
"""

from __future__ import annotations

import math
from decimal import Decimal

from backend.app.universal_colour.enums import (
    NeutralisationDirectionEnum,
    NeutralisationWarmthEnum,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

#: CIELAB L* valid range
LAB_L_MIN: float = 0.0
LAB_L_MAX: float = 100.0

#: CIELAB a*, b* practical range (not a hard physical limit, but the
#: conventional instrument range)
LAB_AB_MIN: float = -128.0
LAB_AB_MAX: float = 127.0

#: Mathematical constant — 25 ** 7, used in CIEDE2000 chroma weighting
_POW25_7: float = 25.0**7  # 6_103_515_625

# ---------------------------------------------------------------------------
# Neutralisation Map
# ---------------------------------------------------------------------------

NEUTRALISATION_MAP: dict[NeutralisationWarmthEnum, NeutralisationDirectionEnum] = {
    NeutralisationWarmthEnum.RED: NeutralisationDirectionEnum.GREEN,
    NeutralisationWarmthEnum.RED_ORANGE: NeutralisationDirectionEnum.GREEN_BLUE,
    NeutralisationWarmthEnum.ORANGE: NeutralisationDirectionEnum.BLUE,
    NeutralisationWarmthEnum.ORANGE_YELLOW: NeutralisationDirectionEnum.BLUE_VIOLET,
    NeutralisationWarmthEnum.YELLOW: NeutralisationDirectionEnum.VIOLET,
    NeutralisationWarmthEnum.PALE_YELLOW: NeutralisationDirectionEnum.PALE_VIOLET,
}


# ---------------------------------------------------------------------------
# CIELAB → CIELCh conversion
# ---------------------------------------------------------------------------


def cielab_to_cielch(
    l: float,
    a: float,
    b: float,
) -> tuple[float, float, float]:
    """
    Convert CIELAB (L*, a*, b*) coordinates to CIELCh (L*, C*, h°).

    CIELCh is a cylindrical representation of the CIELAB colour space where:
    - **L*** (lightness) is unchanged.
    - **C*** (chroma) is the colourfulness: ``sqrt(a*² + b*²)``.
    - **h°** (hue angle) is in degrees [0, 360): ``atan2(b*, a*)``.

    Parameters
    ----------
    l : float
        CIELAB lightness (L*), typically 0–100.
    a : float
        CIELAB a* component (green–red axis).
    b : float
        CIELAB b* component (blue–yellow axis).

    Returns
    -------
    tuple[float, float, float]
        ``(L*, C*, h°)`` where h° is in the range [0, 360).
    """
    chroma = math.sqrt(a * a + b * b)
    hue_deg = math.degrees(math.atan2(b, a))
    if hue_deg < 0.0:
        hue_deg += 360.0
    return (l, chroma, hue_deg)


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def validate_lab_values(
    l: float | Decimal,
    a: float | Decimal,
    b: float | Decimal,
) -> bool:
    """
    Validate that CIELAB values fall within conventional instrument ranges.

    Parameters
    ----------
    l : float | Decimal
        L* (lightness). Must be in [0, 100].
    a : float | Decimal
        a* component. Must be in [-128, 127].
    b : float | Decimal
        b* component. Must be in [-128, 127].

    Returns
    -------
    bool
        ``True`` if all values are within the accepted ranges.
    """
    l_f = float(l)
    a_f = float(a)
    b_f = float(b)
    return (
        LAB_L_MIN <= l_f <= LAB_L_MAX
        and LAB_AB_MIN <= a_f <= LAB_AB_MAX
        and LAB_AB_MIN <= b_f <= LAB_AB_MAX
    )


def lab_values_complete(
    l: float | Decimal | None,
    a: float | Decimal | None,
    b: float | Decimal | None,
) -> bool:
    """
    Check that Lab values are either all present or all ``None``.

    Partial Lab data is never valid — you must have the full triplet or no
    measurement at all.

    Parameters
    ----------
    l, a, b : Optional[float | Decimal]
        The three CIELAB components.

    Returns
    -------
    bool
        ``True`` if the triplet is complete (all present) or entirely absent
        (all ``None``).
    """
    present = (l is not None, a is not None, b is not None)
    return all(present) or not any(present)


# ---------------------------------------------------------------------------
# CIEDE2000
# ---------------------------------------------------------------------------


def _degrees(rad: float) -> float:
    """Convert radians to degrees."""
    return rad * (180.0 / math.pi)


def _radians(deg: float) -> float:
    """Convert degrees to radians."""
    return deg * (math.pi / 180.0)


def ciede2000(
    l1: float,
    a1: float,
    b1: float,
    l2: float,
    a2: float,
    b2: float,
    kL: float = 1.0,
    kC: float = 1.0,
    kH: float = 1.0,
) -> float:
    """
    Compute the CIEDE2000 colour-difference ΔE₀₀ between two CIELAB colours.

    This is the **full** implementation following Sharma, Wu & Dalal (2005),
    including the rotation term R_T. The parametric factors ``kL``, ``kC``,
    ``kH`` default to 1 (reference conditions).

    Parameters
    ----------
    l1, a1, b1 : float
        CIELAB coordinates of the first colour.
    l2, a2, b2 : float
        CIELAB coordinates of the second colour.
    kL : float, optional
        Lightness parametric factor (default 1.0).
    kC : float, optional
        Chroma parametric factor (default 1.0).
    kH : float, optional
        Hue parametric factor (default 1.0).

    Returns
    -------
    float
        The CIEDE2000 colour difference ΔE₀₀ (non-negative).

    References
    ----------
    Sharma, G., Wu, W., & Dalal, E. N. (2005). The CIEDE2000
    color‐difference formula: Implementation notes, supplementary test
    data, and mathematical observations. *Color Research & Application*,
    30(1), 21–30. https://doi.org/10.1002/col.20070
    """

    # ------------------------------------------------------------------
    # Step 1: Calculate C'_i, h'_i
    # ------------------------------------------------------------------
    c_star_1 = math.sqrt(a1 * a1 + b1 * b1)
    c_star_2 = math.sqrt(a2 * a2 + b2 * b2)
    c_star_mean = (c_star_1 + c_star_2) / 2.0

    c_star_mean_pow7 = c_star_mean**7
    g = 0.5 * (1.0 - math.sqrt(c_star_mean_pow7 / (c_star_mean_pow7 + _POW25_7)))

    a1_prime = a1 * (1.0 + g)
    a2_prime = a2 * (1.0 + g)

    c_prime_1 = math.sqrt(a1_prime * a1_prime + b1 * b1)
    c_prime_2 = math.sqrt(a2_prime * a2_prime + b2 * b2)

    # h'_i — note: if both a'_i and b_i are zero, h' is set to 0
    if a1_prime == 0.0 and b1 == 0.0:
        h_prime_1 = 0.0
    else:
        h_prime_1 = _degrees(math.atan2(b1, a1_prime))
        if h_prime_1 < 0.0:
            h_prime_1 += 360.0

    if a2_prime == 0.0 and b2 == 0.0:
        h_prime_2 = 0.0
    else:
        h_prime_2 = _degrees(math.atan2(b2, a2_prime))
        if h_prime_2 < 0.0:
            h_prime_2 += 360.0

    # ------------------------------------------------------------------
    # Step 2: Calculate ΔL', ΔC', ΔH'
    # ------------------------------------------------------------------
    delta_l_prime = l2 - l1
    delta_c_prime = c_prime_2 - c_prime_1

    if c_prime_1 * c_prime_2 == 0.0:
        delta_h_prime = 0.0
    elif abs(h_prime_2 - h_prime_1) <= 180.0:
        delta_h_prime = h_prime_2 - h_prime_1
    elif h_prime_2 - h_prime_1 > 180.0:
        delta_h_prime = h_prime_2 - h_prime_1 - 360.0
    else:
        delta_h_prime = h_prime_2 - h_prime_1 + 360.0

    delta_H_prime = (
        2.0 * math.sqrt(c_prime_1 * c_prime_2) * math.sin(_radians(delta_h_prime / 2.0))
    )

    # ------------------------------------------------------------------
    # Step 3: Calculate CIEDE2000 ΔE₀₀
    # ------------------------------------------------------------------
    l_prime_mean = (l1 + l2) / 2.0
    c_prime_mean = (c_prime_1 + c_prime_2) / 2.0

    # h̄'
    if c_prime_1 * c_prime_2 == 0.0:
        h_prime_mean = h_prime_1 + h_prime_2
    elif abs(h_prime_1 - h_prime_2) <= 180.0:
        h_prime_mean = (h_prime_1 + h_prime_2) / 2.0
    elif h_prime_1 + h_prime_2 < 360.0:
        h_prime_mean = (h_prime_1 + h_prime_2 + 360.0) / 2.0
    else:
        h_prime_mean = (h_prime_1 + h_prime_2 - 360.0) / 2.0

    # T
    t = (
        1.0
        - 0.17 * math.cos(_radians(h_prime_mean - 30.0))
        + 0.24 * math.cos(_radians(2.0 * h_prime_mean))
        + 0.32 * math.cos(_radians(3.0 * h_prime_mean + 6.0))
        - 0.20 * math.cos(_radians(4.0 * h_prime_mean - 63.0))
    )

    # S_L
    l_prime_mean_minus50_sq = (l_prime_mean - 50.0) ** 2
    s_l = 1.0 + 0.015 * l_prime_mean_minus50_sq / math.sqrt(20.0 + l_prime_mean_minus50_sq)

    # S_C
    s_c = 1.0 + 0.045 * c_prime_mean

    # S_H
    s_h = 1.0 + 0.015 * c_prime_mean * t

    # R_T (rotation term)
    c_prime_mean_pow7 = c_prime_mean**7
    r_c = 2.0 * math.sqrt(c_prime_mean_pow7 / (c_prime_mean_pow7 + _POW25_7))
    delta_theta = 30.0 * math.exp(-(((h_prime_mean - 275.0) / 25.0) ** 2))
    r_t = -math.sin(_radians(2.0 * delta_theta)) * r_c

    # Final ΔE₀₀
    term_l = delta_l_prime / (kL * s_l)
    term_c = delta_c_prime / (kC * s_c)
    term_h = delta_H_prime / (kH * s_h)

    delta_e = math.sqrt(term_l**2 + term_c**2 + term_h**2 + r_t * term_c * term_h)

    return delta_e
