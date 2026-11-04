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
