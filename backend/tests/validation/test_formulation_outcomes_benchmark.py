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


def test_repigmentation_filler_outcomes_chemical_validity():
    """Verify that repigmentation and tint-back benchmark trials obey filler rules."""
    with open(TRIALS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    trials_by_id = {t["trial_id"]: t for t in data["trials"]}

    # 1. Delta = -2 (Trial 006): 25% Gold primer base addition
    trial_6 = trials_by_id["TRIAL-REPIG-2L-006"]
    shades_6 = trial_6["predicted_formulation"]["shades"]
    roles_6 = {s["role"]: s for s in shades_6}
    assert "WARM_GOLD_PRIMER" in roles_6
    assert roles_6["WARM_GOLD_PRIMER"]["parts"] == 0.25
    assert roles_6["TARGET_BASE"]["parts"] == 0.75

    # 2. Delta = -3 (Trial 007): 33% Copper filler addition
    trial_7 = trials_by_id["TRIAL-REPIG-3L-007"]
    shades_7 = trial_7["predicted_formulation"]["shades"]
    roles_7 = {s["role"]: s for s in shades_7}
    assert "COPPER_FILLER" in roles_7
    assert roles_7["COPPER_FILLER"]["parts"] == 0.33
    assert roles_7["TARGET_BASE"]["parts"] == 0.67

    # 3. Delta = -4 (Trial 008): Two-Step Pre-pigmentation mandatory
    trial_8 = trials_by_id["TRIAL-REPIG-4L-TWO-STEP-008"]
    assert trial_8["predicted_formulation"]["process_type"] == "MULTI_STAGE_PROCESS"
    stages_8 = trial_8["predicted_formulation"]["stages"]
    assert len(stages_8) == 2
    assert stages_8[0]["stage_number"] == 1
    assert stages_8[0]["service_type"] == "DEPOSIT"
    assert "Filler" in stages_8[0]["product"]
    assert stages_8[1]["stage_number"] == 2
    assert stages_8[1]["service_type"] == "DARKENING"

    # 4. Delta = -5 (Trial 009): Two-Step Red/Copper Pre-pigmentation
    trial_9 = trials_by_id["TRIAL-REPIG-5L-TWO-STEP-009"]
    assert trial_9["predicted_formulation"]["process_type"] == "MULTI_STAGE_PROCESS"
    stages_9 = trial_9["predicted_formulation"]["stages"]
    assert len(stages_9) == 2
    assert stages_9[0]["stage_number"] == 1
    assert "Filler" in stages_9[0]["product"]


def test_porosity_and_indian_hair_trials_validity():
    """Verify that porosity differential and Indian hair phenotype trials enforce chemical kinetics."""
    with open(TRIALS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    trials_by_id = {t["trial_id"]: t for t in data["trials"]}

    # 1. Porosity differential (Trial 010): Zonal developer compensation
    trial_10 = trials_by_id["TRIAL-POROSITY-DIFFERENTIAL-010"]
    dev_name_10 = trial_10["predicted_formulation"]["developer"]["name"]
    assert "6% roots" in dev_name_10 and "1.9% ends" in dev_name_10

    # 2. High porosity ends toning (Trial 011): 1.9% developer for porous hair
    trial_11 = trials_by_id["TRIAL-HIGH-POROSITY-ENDS-TONING-011"]
    assert trial_11["predicted_formulation"]["developer"]["percentage"] == 1.9

    # 3. Coarse Indian hair lift (Trial 012): 45 min extended processing
    trial_12 = trials_by_id["TRIAL-INDIAN-COARSE-LIFT-012"]
    assert trial_12["predicted_formulation"]["development_time_minutes"] == 45
    assert trial_12["starting_hair"]["hair_texture"] == "COARSE_RESISTANT"

    # 4. Indian Level 3 lift with Special Mix ash neutralisation (Trial 013)
    trial_13 = trials_by_id["TRIAL-INDIAN-RED-ORANGE-WALL-013"]
    stages_13 = trial_13["predicted_formulation"]["stages"]
    assert len(stages_13) == 2
    assert "0/11" in stages_13[1]["product"], "Must include Special Mix cool neutraliser"


def test_hard_water_chelation_pre_treatment_validity():
    """Verify that hard water client trials prepend metal chelation pre-treatment stage."""
    with open(TRIALS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    trials_by_id = {t["trial_id"]: t for t in data["trials"]}
    trial_14 = trials_by_id["TRIAL-HARD-WATER-CHELATION-014"]

    assert trial_14["starting_hair"]["has_hard_water"] is True
    stages_14 = trial_14["predicted_formulation"]["stages"]
    assert len(stages_14) == 2
    assert stages_14[0]["stage_number"] == 1
    assert "Chelating Treatment" in stages_14[0]["product"]
