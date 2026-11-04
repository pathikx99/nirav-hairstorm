"""Validation test suite for empirical formulation outcomes against physical laboratory tress trials."""

from __future__ import annotations

import json
from pathlib import Path

from backend.app.universal_colour.colour_science import ciede2000

TRIALS_PATH = Path("data/validation/formulation_outcomes.json")


def test_formulation_outcomes_metadata_and_thresholds():
    """Verify trial metadata conforms to laboratory SOP standards."""
    assert TRIALS_PATH.exists()
    with open(TRIALS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    meta = data["dataset_metadata"]
    assert meta["version"] == "1.0"
    assert meta["acceptance_threshold"] == 3.5
    assert len(data["trials"]) >= 5


def test_formulation_empirical_trials_delta_e00_within_tolerance():
    """
    Verify all recorded empirical tress trials achieve CIEDE2000 Delta E00 <= 3.5
    from target specification, passing release criteria.
    """
    with open(TRIALS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    threshold = data["dataset_metadata"]["acceptance_threshold"]

    for trial in data["trials"]:
        trial_id = trial["trial_id"]
        target_lab = trial["target_colour"]["target_cielab"]
        measured_lab = trial["empirical_result"]["measured_cielab"]

        calculated_delta_e = ciede2000(
            target_lab["l_star"], target_lab["a_star"], target_lab["b_star"],
            measured_lab["l_star"], measured_lab["a_star"], measured_lab["b_star"],
        )

        recorded_delta_e = trial["empirical_result"]["delta_e00_from_target"]

        # Delta E00 must be within 0.1 of recorded value
        assert abs(calculated_delta_e - recorded_delta_e) <= 0.1, (
            f"Trial {trial_id}: Delta E00 mismatch. Calculated {calculated_delta_e:.3f} vs recorded {recorded_delta_e:.3f}"
        )

        # Must meet the professional salon acceptance gate of Delta E00 <= 3.5
        assert calculated_delta_e <= threshold, (
            f"Trial {trial_id} exceeded acceptance threshold {threshold}: Delta E00 = {calculated_delta_e:.3f}"
        )
        assert trial["empirical_result"]["outcome_status"] == "PASSED_VALIDATION"


def test_formulation_outcomes_service_chemical_validity():
    """Verify that lifting and grey coverage trials obey manufacturer chemical principles."""
    with open(TRIALS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    trials_by_id = {t["trial_id"]: t for t in data["trials"]}

    # 1. 2-level lift (Trial 001) uses 9% (30 Vol) developer
    trial_1 = trials_by_id["TRIAL-KP-LIFT-2L-001"]
    assert trial_1["predicted_formulation"]["developer"]["percentage"] == 9.0

    # 2. 3-level lift (Trial 002) uses 12% (40 Vol) developer
    trial_2 = trials_by_id["TRIAL-KP-LIFT-3L-002"]
    assert trial_2["predicted_formulation"]["developer"]["percentage"] == 12.0

    # 3. 50% Grey Coverage (Trial 003) incorporates Pure Natural 1:1 ratio
    trial_3 = trials_by_id["TRIAL-KP-GREY-50PCT-003"]
    shades = trial_3["predicted_formulation"]["shades"]
    shade_codes = [s["shade_code"] for s in shades]
    assert "7/0" in shade_codes, "Grey coverage trial must incorporate Pure Natural root shade at target level"
    assert len(shades) == 2, "Fashion shade + Natural shade mix required for 50% grey"
