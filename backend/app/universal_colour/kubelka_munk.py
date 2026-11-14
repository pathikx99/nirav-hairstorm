"""
Kubelka-Munk Radiative Transfer Theory (K/S) & Spectral Modeling Module.

Provides physical modeling of light absorption and scattering in turbid hair media:
    (K/S) = (1 - R_inf)^2 / (2 * R_inf) = sum(c_i * (k_i / s)) + (K/S)_substrate

Also implements CIE Standard Observer spectral integration (XYZ and CIELAB)
under standard illuminants (D65 daylight, Illuminant A 2856K, Salon 4000K LED)
and predicts metamerism indices.
"""

from __future__ import annotations

import math
from collections.abc import Sequence

# ---------------------------------------------------------------------------
# Standard Visible Wavelengths: 380 nm to 750 nm (10 nm intervals, 38 steps)
# ---------------------------------------------------------------------------
WAVELENGTHS: list[int] = [
    380, 390, 400, 410, 420, 430, 440, 450, 460, 470,
    480, 490, 500, 510, 520, 530, 540, 550, 560, 570,
    580, 590, 600, 610, 620, 630, 640, 650, 660, 670,
    680, 690, 700, 710, 720, 730, 740, 750,
]

# ---------------------------------------------------------------------------
# CIE 1964 10-degree Supplementary Standard Colorimetric Observer (x_bar, y_bar, z_bar)
# ---------------------------------------------------------------------------
CIE_10DEG_XBAR: list[float] = [
    0.0002, 0.0024, 0.0191, 0.0847, 0.2045, 0.3147, 0.3837, 0.3707, 0.3023, 0.1956,
    0.0805, 0.0162, 0.0038, 0.0375, 0.1177, 0.2365, 0.3768, 0.5120, 0.6504, 0.7788,
    0.8726, 0.9163, 0.8625, 0.7257, 0.5366, 0.3483, 0.1956, 0.0967, 0.0431, 0.0175,
    0.0064, 0.0022, 0.0007, 0.0002, 0.0001, 0.0000, 0.0000, 0.0000,
]

CIE_10DEG_YBAR: list[float] = [
    0.0000, 0.0003, 0.0020, 0.0088, 0.0214, 0.0387, 0.0621, 0.0895, 0.1282, 0.1852,
    0.2536, 0.3391, 0.4608, 0.6067, 0.7618, 0.8752, 0.9620, 1.0000, 0.9973, 0.9556,
    0.8689, 0.7774, 0.6583, 0.5280, 0.3981, 0.2835, 0.1798, 0.1076, 0.0603, 0.0318,
    0.0159, 0.0077, 0.0035, 0.0015, 0.0006, 0.0002, 0.0001, 0.0000,
]

CIE_10DEG_ZBAR: list[float] = [
    0.0007, 0.0105, 0.0860, 0.3894, 0.9725, 1.5535, 1.9673, 1.9948, 1.7454, 1.3176,
    0.7721, 0.4153, 0.2185, 0.1120, 0.0607, 0.0305, 0.0137, 0.0052, 0.0018, 0.0006,
    0.0001, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
    0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
]

# ---------------------------------------------------------------------------
# Standard Illuminants Spectral Power Distributions S(lambda)
# ---------------------------------------------------------------------------
# CIE D65 (Daylight, 6504 K)
ILLUMINANT_D65: list[float] = [
    50.0, 54.6, 82.8, 91.5, 93.4, 86.7, 104.9, 117.0, 117.8, 114.9,
    115.9, 108.8, 109.4, 107.8, 104.8, 107.7, 104.4, 104.0, 100.0, 96.3,
    95.8, 88.7, 90.0, 89.6, 87.7, 83.3, 83.7, 80.0, 80.2, 82.3,
    78.3, 69.7, 71.6, 74.3, 61.6, 69.9, 75.1, 63.6,
]

# CIE Illuminant A (Incandescent tungsten, 2856 K)
ILLUMINANT_A: list[float] = [
    9.8, 12.1, 14.7, 17.7, 21.0, 24.7, 28.7, 33.1, 37.8, 42.8,
    48.2, 53.9, 59.9, 66.1, 72.5, 79.1, 85.9, 92.9, 100.0, 107.2,
    114.4, 121.7, 129.0, 136.3, 143.6, 150.8, 157.9, 165.0, 171.9, 178.8,
    185.4, 192.0, 198.3, 204.4, 210.4, 216.1, 221.7, 227.0,
]

# Salon 4000K Commercial LED / Fluorescent (CIE F11 / Neutral White)
ILLUMINANT_SALON_LED: list[float] = [
    11.2, 13.5, 18.0, 25.0, 38.0, 85.0, 72.0, 42.0, 35.0, 32.0,
    30.0, 32.0, 45.0, 85.0, 130.0, 120.0, 75.0, 60.0, 100.0, 120.0,
    115.0, 110.0, 105.0, 100.0, 92.0, 85.0, 78.0, 65.0, 58.0, 50.0,
    42.0, 36.0, 30.0, 25.0, 20.0, 16.0, 12.0, 10.0,
]

ILLUMINANTS_MAP: dict[str, list[float]] = {
    "D65": ILLUMINANT_D65,
    "A": ILLUMINANT_A,
    "SALON_LED": ILLUMINANT_SALON_LED,
    "LED": ILLUMINANT_SALON_LED,
}

# ---------------------------------------------------------------------------
# Hair Keratin Substrate Reflectance by Depth Level (1 to 10)
# Derived from spectrophotometric tress data across human hair eumelanin/pheomelanin curves
# ---------------------------------------------------------------------------
SUBSTRATE_REFLECTANCE: dict[int, list[float]] = {
    10: [
        0.42, 0.44, 0.47, 0.50, 0.53, 0.56, 0.59, 0.62, 0.65, 0.68,
        0.70, 0.72, 0.73, 0.75, 0.76, 0.77, 0.78, 0.79, 0.80, 0.81,
        0.81, 0.82, 0.82, 0.83, 0.83, 0.84, 0.84, 0.85, 0.85, 0.85,
        0.86, 0.86, 0.86, 0.87, 0.87, 0.87, 0.88, 0.88,
    ],
    9: [
        0.28, 0.30, 0.33, 0.36, 0.39, 0.43, 0.47, 0.51, 0.55, 0.58,
        0.61, 0.63, 0.65, 0.67, 0.68, 0.70, 0.71, 0.72, 0.73, 0.74,
        0.75, 0.76, 0.77, 0.77, 0.78, 0.79, 0.79, 0.80, 0.80, 0.81,
        0.81, 0.82, 0.82, 0.83, 0.83, 0.84, 0.84, 0.84,
    ],
    8: [
        0.18, 0.20, 0.22, 0.25, 0.28, 0.32, 0.36, 0.40, 0.44, 0.47,
        0.50, 0.52, 0.54, 0.56, 0.58, 0.60, 0.61, 0.63, 0.64, 0.65,
        0.66, 0.67, 0.68, 0.69, 0.70, 0.71, 0.72, 0.73, 0.73, 0.74,
        0.75, 0.75, 0.76, 0.77, 0.77, 0.78, 0.78, 0.79,
    ],
    7: [
        0.11, 0.12, 0.14, 0.16, 0.19, 0.22, 0.25, 0.29, 0.32, 0.35,
        0.38, 0.40, 0.42, 0.44, 0.46, 0.48, 0.50, 0.51, 0.53, 0.54,
        0.56, 0.57, 0.59, 0.60, 0.61, 0.62, 0.64, 0.65, 0.66, 0.67,
        0.68, 0.69, 0.70, 0.71, 0.71, 0.72, 0.73, 0.73,
    ],
    6: [
        0.07, 0.08, 0.09, 0.11, 0.13, 0.15, 0.17, 0.20, 0.23, 0.25,
        0.28, 0.30, 0.32, 0.34, 0.36, 0.38, 0.40, 0.41, 0.43, 0.44,
        0.46, 0.48, 0.49, 0.51, 0.52, 0.54, 0.55, 0.57, 0.58, 0.59,
        0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.67,
    ],
    5: [
        0.045, 0.051, 0.059, 0.068, 0.080, 0.095, 0.112, 0.132, 0.152, 0.172,
        0.193, 0.212, 0.230, 0.248, 0.265, 0.282, 0.300, 0.315, 0.332, 0.348,
        0.365, 0.380, 0.398, 0.412, 0.428, 0.442, 0.458, 0.472, 0.486, 0.500,
        0.512, 0.525, 0.538, 0.550, 0.561, 0.572, 0.582, 0.590,
    ],
    4: [
        0.030, 0.034, 0.039, 0.045, 0.053, 0.063, 0.075, 0.088, 0.102, 0.117,
        0.132, 0.147, 0.162, 0.176, 0.191, 0.205, 0.220, 0.233, 0.247, 0.261,
        0.276, 0.290, 0.305, 0.318, 0.332, 0.346, 0.360, 0.373, 0.386, 0.399,
        0.411, 0.424, 0.436, 0.448, 0.459, 0.470, 0.480, 0.490,
    ],
    3: [
        0.020, 0.022, 0.025, 0.029, 0.034, 0.040, 0.048, 0.056, 0.066, 0.076,
        0.086, 0.096, 0.106, 0.116, 0.126, 0.137, 0.148, 0.158, 0.169, 0.180,
        0.192, 0.203, 0.215, 0.227, 0.239, 0.251, 0.263, 0.275, 0.287, 0.299,
        0.310, 0.321, 0.332, 0.343, 0.354, 0.364, 0.374, 0.384,
    ],
    2: [
        0.015, 0.016, 0.018, 0.020, 0.023, 0.027, 0.032, 0.037, 0.043, 0.049,
        0.056, 0.062, 0.069, 0.076, 0.083, 0.091, 0.099, 0.106, 0.114, 0.122,
        0.131, 0.139, 0.148, 0.157, 0.166, 0.176, 0.185, 0.195, 0.205, 0.215,
        0.224, 0.233, 0.242, 0.251, 0.260, 0.269, 0.278, 0.287,
    ],
    1: [
        0.010, 0.011, 0.012, 0.013, 0.015, 0.017, 0.020, 0.023, 0.027, 0.031,
        0.035, 0.039, 0.043, 0.048, 0.052, 0.057, 0.062, 0.067, 0.072, 0.078,
        0.084, 0.090, 0.096, 0.102, 0.109, 0.116, 0.123, 0.130, 0.137, 0.145,
        0.152, 0.160, 0.167, 0.175, 0.182, 0.190, 0.198, 0.205,
    ],
}

# ---------------------------------------------------------------------------
# Unit Dye (k/s) Spectral Absorption-to-Scattering Profiles
# Normalized relative unit absorption profiles for primary oxidative tones
# ---------------------------------------------------------------------------
DYE_UNIT_KS: dict[str, list[float]] = {
    # Ash / Blue: Strong absorption in yellow-orange-red (580-660 nm)
    "ASH": [
        0.15, 0.18, 0.22, 0.28, 0.35, 0.42, 0.50, 0.62, 0.78, 0.95,
        1.15, 1.40, 1.75, 2.15, 2.60, 3.10, 3.65, 4.15, 4.50, 4.75,
        4.85, 4.80, 4.55, 4.10, 3.55, 2.95, 2.30, 1.70, 1.20, 0.85,
        0.58, 0.38, 0.25, 0.16, 0.11, 0.08, 0.05, 0.03,
    ],
    # Gold / Yellow: Strong absorption in violet-blue (400-470 nm)
    "GOLD": [
        3.80, 4.10, 4.35, 4.50, 4.45, 4.25, 3.85, 3.20, 2.45, 1.65,
        0.95, 0.50, 0.25, 0.12, 0.06, 0.03, 0.02, 0.01, 0.01, 0.01,
        0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
        0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
    ],
    # Copper / Orange: Absorption peak in blue-green (440-520 nm)
    "COPPER": [
        2.50, 2.80, 3.10, 3.40, 3.65, 3.85, 3.90, 3.75, 3.35, 2.70,
        1.95, 1.25, 0.70, 0.35, 0.16, 0.08, 0.04, 0.02, 0.01, 0.01,
        0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
        0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
    ],
    # Red: Absorption peak in blue-green to green (480-550 nm)
    "RED": [
        1.20, 1.45, 1.75, 2.15, 2.65, 3.25, 3.85, 4.35, 4.70, 4.85,
        4.75, 4.40, 3.80, 2.95, 1.95, 1.10, 0.52, 0.22, 0.09, 0.04,
        0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
        0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
    ],
    # Violet: Broad absorption in green-yellow (520-580 nm)
    "VIOLET": [
        0.25, 0.30, 0.38, 0.48, 0.62, 0.82, 1.15, 1.65, 2.35, 3.15,
        3.95, 4.55, 4.85, 4.80, 4.45, 3.75, 2.80, 1.85, 1.05, 0.55,
        0.26, 0.12, 0.06, 0.03, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01,
        0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01,
    ],
    # Natural / Neutral: Broad flat absorption across all visible wavelengths
    "NATURAL": [
        1.80, 1.80, 1.78, 1.75, 1.72, 1.68, 1.65, 1.60, 1.55, 1.50,
        1.45, 1.40, 1.35, 1.30, 1.25, 1.20, 1.15, 1.10, 1.05, 1.00,
        0.96, 0.92, 0.88, 0.84, 0.80, 0.77, 0.74, 0.71, 0.68, 0.65,
        0.62, 0.59, 0.56, 0.53, 0.50, 0.47, 0.45, 0.43,
    ],
}


# ---------------------------------------------------------------------------
# Fundamental Kubelka-Munk Equations
# ---------------------------------------------------------------------------


def reflectance_to_ks(r: float) -> float:
    """
    Computes Kubelka-Munk absorption-to-scattering ratio K/S from reflectance R_inf:
        K/S = (1 - R)^2 / (2 * R)
    """
    # Clamp reflectance to valid physical bounds to avoid numerical singularity
    clamped_r = max(1e-5, min(0.9999, r))
    return ((1.0 - clamped_r) ** 2) / (2.0 * clamped_r)


def ks_to_reflectance(ks: float) -> float:
    """
    Computes reflectance R_inf from Kubelka-Munk K/S ratio:
        R_inf = 1 + (K/S) - sqrt((K/S)^2 + 2 * (K/S))
    """
    if ks <= 0.0:
        return 1.0
    return 1.0 + ks - math.sqrt(ks * ks + 2.0 * ks)


def calculate_spectrum_ks(reflectance_spectrum: Sequence[float]) -> list[float]:
    """Computes K/S for an entire spectral curve."""
    return [reflectance_to_ks(r) for r in reflectance_spectrum]


def calculate_spectrum_reflectance(ks_spectrum: Sequence[float]) -> list[float]:
    """Computes reflectance for an entire K/S spectrum."""
    return [ks_to_reflectance(ks) for ks in ks_spectrum]


# ---------------------------------------------------------------------------
# Multi-Dye Mixture Prediction
# ---------------------------------------------------------------------------


def predict_mixture_reflectance(
    substrate_level: int,
    dye_fractions: dict[str, float],
) -> list[float]:
    """
    Predicts spectral reflectance of a multi-dye mixture on a hair substrate:
        (K/S)_total(lambda) = (K/S)_substrate(lambda) + sum(c_i * (k_i / s)(lambda))

    Parameters:
        substrate_level: Starting hair level (1 to 10).
        dye_fractions: Dictionary mapping tone family (e.g. "ASH", "NATURAL", "COPPER")
                       to dye concentration/fraction c_i (typically 0.0 to 2.0).

    Returns:
        List of 38 spectral reflectance values from 380nm to 750nm.
    """
    level = max(1, min(10, substrate_level))
    sub_r = SUBSTRATE_REFLECTANCE.get(level, SUBSTRATE_REFLECTANCE[5])
    sub_ks = calculate_spectrum_ks(sub_r)

    total_ks: list[float] = list(sub_ks)

    for tone, conc in dye_fractions.items():
        if conc <= 0.0:
            continue
        unit_ks = DYE_UNIT_KS.get(tone.upper(), DYE_UNIT_KS["NATURAL"])
        for idx in range(len(WAVELENGTHS)):
            total_ks[idx] += conc * unit_ks[idx]

    return calculate_spectrum_reflectance(total_ks)


# ---------------------------------------------------------------------------
# Spectral Integration: Reflectance -> CIE XYZ -> CIELAB
# ---------------------------------------------------------------------------


def spectral_to_xyz(
    reflectances: Sequence[float],
    illuminant: str = "D65",
) -> tuple[float, float, float]:
    """
    Converts 380-750nm spectral reflectance to CIE 1964 10-degree XYZ tristimulus values.

    Parameters:
        reflectances: 38 spectral reflectance values.
        illuminant: "D65", "A", or "SALON_LED".

    Returns:
        (X, Y, Z) tristimulus values normalized to Y_white = 100.0.
    """
    ill = ILLUMINANTS_MAP.get(illuminant.upper(), ILLUMINANT_D65)

    sum_x = 0.0
    sum_y = 0.0
    sum_z = 0.0
    k = 0.0

    for idx in range(min(len(reflectances), len(WAVELENGTHS))):
        r = reflectances[idx]
        s = ill[idx]
        x_bar = CIE_10DEG_XBAR[idx]
        y_bar = CIE_10DEG_YBAR[idx]
        z_bar = CIE_10DEG_ZBAR[idx]

        sum_x += r * s * x_bar
        sum_y += r * s * y_bar
        sum_z += r * s * z_bar
        k += s * y_bar

    if k == 0.0:
        return (0.0, 0.0, 0.0)

    scale = 100.0 / k
    return (sum_x * scale, sum_y * scale, sum_z * scale)


_WHITE_POINTS_CACHE: dict[str, tuple[float, float, float]] = {}


def get_white_point(illuminant: str = "D65") -> tuple[float, float, float]:
    """Calculates or retrieves cached reference white point (Xn, Yn, Zn) where R = 1.0 everywhere."""
    key = illuminant.upper()
    if key not in _WHITE_POINTS_CACHE:
        ones = [1.0] * len(WAVELENGTHS)
        _WHITE_POINTS_CACHE[key] = spectral_to_xyz(ones, illuminant=key)
    return _WHITE_POINTS_CACHE[key]


def xyz_to_cielab(
    x: float,
    y: float,
    z: float,
    illuminant: str = "D65",
) -> tuple[float, float, float]:
    """
    Converts CIE XYZ tristimulus values to CIELAB (L*, a*, b*).
    """
    xn, yn, zn = get_white_point(illuminant=illuminant)

    xr = x / xn
    yr = y / yn
    zr = z / zn

    def f(t: float) -> float:
        # CIE standard threshold: (6/29)^3 = 0.008856
        clamped_t = max(0.0, t)
        if clamped_t > 0.008856451679:
            return clamped_t ** (1.0 / 3.0)
        return (7.787037 * clamped_t) + (16.0 / 116.0)

    fx = f(xr)
    fy = f(yr)
    fz = f(zr)

    l_star = max(0.0, min(100.0, (116.0 * fy) - 16.0))
    a_star = 500.0 * (fx - fy)
    b_star = 200.0 * (fy - fz)

    return (l_star, a_star, b_star)


def spectral_to_cielab(
    reflectances: Sequence[float],
    illuminant: str = "D65",
) -> tuple[float, float, float]:
    """Direct conversion from spectral reflectance curve to CIELAB coordinates."""
    x, y, z = spectral_to_xyz(reflectances, illuminant=illuminant)
    return xyz_to_cielab(x, y, z, illuminant=illuminant)


def predict_mixture_cielab(
    substrate_level: int,
    dye_fractions: dict[str, float],
    illuminant: str = "D65",
) -> tuple[float, float, float]:
    """
    Predicts final CIELAB coordinates for a dye mixture directly from Kubelka-Munk theory.
    """
    refl = predict_mixture_reflectance(substrate_level, dye_fractions)
    return spectral_to_cielab(refl, illuminant=illuminant)


# ---------------------------------------------------------------------------
# Metamerism & Illuminant Color Shift Evaluation
# ---------------------------------------------------------------------------


def evaluate_metameric_shift(
    reflectances: Sequence[float],
    primary_illuminant: str = "D65",
    secondary_illuminant: str = "A",
) -> dict[str, float | tuple[float, float, float]]:
    """
    Evaluates colorimetric appearance shift between two standard illuminants
    (e.g., standard D65 daylight vs. incandescent / warm salon lighting A).
    """
    from backend.app.universal_colour.colour_science import ciede2000

    lab_1 = spectral_to_cielab(reflectances, illuminant=primary_illuminant)
    lab_2 = spectral_to_cielab(reflectances, illuminant=secondary_illuminant)

    delta_e = ciede2000(
        lab_1[0], lab_1[1], lab_1[2],
        lab_2[0], lab_2[1], lab_2[2],
    )

    return {
        "primary_illuminant": primary_illuminant,
        "primary_lab": lab_1,
        "secondary_illuminant": secondary_illuminant,
        "secondary_lab": lab_2,
        "delta_e00_metamerism": delta_e,
    }
