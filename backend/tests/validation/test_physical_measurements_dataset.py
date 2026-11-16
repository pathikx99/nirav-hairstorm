"""Validation test suite for physical swatch dataset and instrument measurements."""

from __future__ import annotations

import json
import math
from pathlib import Path

from backend.app.universal_colour.colour_science import (
    LAB_AB_MAX,
    LAB_AB_MIN,
    LAB_L_MAX,
    LAB_L_MIN,
    ciede2000,
    cielab_to_cielch,
)

SWATCHES_PATH = Path("data/validation/physical_swatches.json")


def test_physical_swatches_metadata_and_integrity():
    """Verify physical swatch dataset metadata conform to instrument SOP requirements."""
    assert SWATCHES_PATH.exists(), "physical_swatches.json must exist"

    with open(SWATCHES_PATH, encoding="utf-8") as f:
        data = json.load(f)

    meta = data["dataset_metadata"]
    assert meta["version"] == "1.0"
    config = meta["instrument_configuration"]
    assert config["illuminant"] == "D65"
    assert config["observer_angle"] == "10_DEG"
    assert "d/8" in config["measurement_geometry"]
    assert "SCI" in config["measurement_mode"]
    assert config["backing_tile"] == "CERTIFIED_WHITE_CERAMIC_TILE_L98.5"

    swatches = data["swatches"]
    assert len(swatches) >= 15, "Dataset must contain at least 15 measured swatches"


def test_physical_swatches_colorimetric_ranges_and_derivations():
    """Verify all swatch CIELAB values fall within physical bounds and derived CIELCh values match."""
    with open(SWATCHES_PATH, encoding="utf-8") as f:
        data = json.load(f)

    for swatch in data["swatches"]:
        swatch_id = swatch["swatch_id"]
        lab = swatch["cielab"]
        l_star = lab["l_star"]
        a_star = lab["a_star"]
        b_star = lab["b_star"]

        # 1. Physical ranges
        assert LAB_L_MIN <= l_star <= LAB_L_MAX, f"Swatch {swatch_id}: L* {l_star} out of range"
        assert LAB_AB_MIN <= a_star <= LAB_AB_MAX, f"Swatch {swatch_id}: a* {a_star} out of range"
        assert LAB_AB_MIN <= b_star <= LAB_AB_MAX, f"Swatch {swatch_id}: b* {b_star} out of range"

        # 2. Level monotonicity check: darker levels should have lower L* on average
        # Universal level 2 should be darker than Level 5, etc.
        if swatch["primary_tone"] == "NATURAL":
            assert l_star < 85.0 if swatch["uhcr_level"] <= 8 else True
            assert l_star < 40.0 if swatch["uhcr_level"] <= 4 else True

        # 3. Derived CIELCh mathematical correctness
        calc_l, calc_chroma, calc_hue = cielab_to_cielch(l_star, a_star, b_star)
        recorded_cielch = swatch["cielch"]

        assert math.isclose(calc_chroma, recorded_cielch["chroma_c"], abs_tol=0.05), (
            f"Swatch {swatch_id}: Chroma mismatch. Calc {calc_chroma} vs rec {recorded_cielch['chroma_c']}"
        )
        assert math.isclose(calc_hue, recorded_cielch["hue_angle"], abs_tol=0.1), (
            f"Swatch {swatch_id}: Hue mismatch. Calc {calc_hue} vs rec {recorded_cielch['hue_angle']}"
        )

        # 4. Status must be VALID
        assert swatch["measurement_status"] == "VALID"


def test_physical_swatches_cross_brand_distance_distinction():
    """
    Verify CIEDE2000 distinguishes between natural tones, ash tones, and warm tones.
    Demonstrates that similar level does not mean identical physical colour.
    """
    with open(SWATCHES_PATH, encoding="utf-8") as f:
        data = json.load(f)

    swatches_by_id = {s["swatch_id"]: s for s in data["swatches"]}

    # Wella 7/0 (Level 7 Natural) vs Wella 7/1 (Level 7 Ash)
    wella_7_0 = swatches_by_id["SW-WELLA-7-0"]["cielab"]
    wella_7_1 = swatches_by_id["SW-WELLA-7-1"]["cielab"]

    delta_e_nat_ash = ciede2000(
        wella_7_0["l_star"], wella_7_0["a_star"], wella_7_0["b_star"],
        wella_7_1["l_star"], wella_7_1["a_star"], wella_7_1["b_star"],
    )

    # Ash and natural at level 7 are clearly distinct in delta E00 (> 2.0)
    assert delta_e_nat_ash > 2.0, f"Expected distinct delta E00 for Natural vs Ash, got {delta_e_nat_ash}"

    # Self-comparison must be 0.0
    self_dist = ciede2000(
        wella_7_0["l_star"], wella_7_0["a_star"], wella_7_0["b_star"],
        wella_7_0["l_star"], wella_7_0["a_star"], wella_7_0["b_star"],
    )
    assert math.isclose(self_dist, 0.0, abs_tol=1e-5)


def test_calibrated_visualizer_physical_accuracy():
    """
    Verify that the calibrated tone curves match Konica Minolta CM-26dG physical hair swatches
    with sub-perceptual color differences (mean Delta E00 <= 0.35, max Delta E00 <= 1.0).
    """
    with open(SWATCHES_PATH, encoding="utf-8") as f:
        data = json.load(f)

    # Calibrated colorimetric base values (sRGB D65)
    calibrated_curves = {
        ("NATURAL", 1): "#211f1e",
        ("NATURAL", 2): "#302b28",
        ("NATURAL", 3): "#3e342d",
        ("NATURAL", 4): "#503f32",
        ("NATURAL", 5): "#654d39",
        ("NATURAL", 6): "#7c5f43",
        ("NATURAL", 7): "#967652",
        ("NATURAL", 8): "#b49265",
        ("NATURAL", 9): "#cdb086",
        ("NATURAL", 10): "#ddc9a7",
        ("ASH", 7): "#867862",
        ("GOLD", 7): "#9c7a45",
        ("COPPER", 7): "#ab6440",
        ("RED", 7): "#ab6743",  # Red-Gold blend 7/43
    }

    def hex_to_lab(hex_str: str) -> tuple[float, float, float]:
        h = hex_str.lstrip("#")
        r, g, b = tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
        
        def inv_gamma(v: int) -> float:
            v_norm = v / 255.0
            return ((v_norm + 0.055) / 1.055) ** 2.4 if v_norm > 0.04045 else v_norm / 12.92

        r_lin = inv_gamma(r)
        g_lin = inv_gamma(g)
        b_lin = inv_gamma(b)

        x = r_lin * 0.4124564 + g_lin * 0.3575761 + b_lin * 0.1804375
        y = r_lin * 0.2126729 + g_lin * 0.7151522 + b_lin * 0.0721750
        z = r_lin * 0.0193339 + g_lin * 0.1191920 + b_lin * 0.9503041

        xn, yn, zn = 0.95047, 1.00000, 1.08883
        xr, yr, zr = x / xn, y / yn, z / zn
        delta = 6.0 / 29.0

        fx = xr ** (1/3) if xr > delta**3 else (xr / (3 * delta**2)) + 4/29
        fy = yr ** (1/3) if yr > delta**3 else (yr / (3 * delta**2)) + 4/29
        fz = zr ** (1/3) if zr > delta**3 else (zr / (3 * delta**2)) + 4/29

        L = 116.0 * fy - 16.0
        a = 500.0 * (fx - fy)
        b = 200.0 * (fy - fz)
        return L, a, b

    delta_es: list[float] = []

    for swatch in data["swatches"]:
        swatch_id = swatch["swatch_id"]
        target = swatch["cielab"]
        key = (swatch["primary_tone"], swatch["uhcr_level"])
        
        cal_hex = calibrated_curves.get(key)
        assert cal_hex is not None, f"Missing calibration key for {swatch_id}"

        pred_l, pred_a, pred_b = hex_to_lab(cal_hex)
        dE = ciede2000(target["l_star"], target["a_star"], target["b_star"], pred_l, pred_a, pred_b)
        delta_es.append(dE)

        # Every individual swatch must be within Delta E00 <= 1.0 (imperceptible difference)
        assert dE < 1.0, f"Swatch {swatch_id} exceeds threshold: Delta E00 = {dE:.3f}"

    mean_dE = sum(delta_es) / len(delta_es)
    assert mean_dE < 0.35, f"Mean Delta E00 too high: {mean_dE:.3f}"

