"""Validation test suite for held-out image level and undertone benchmarks."""

from __future__ import annotations

import json
from pathlib import Path

BENCHMARKS_PATH = Path("data/validation/image_validation_benchmarks.json")


def test_image_benchmarks_metadata_and_integrity():
    """Verify image validation benchmark dataset integrity and structure."""
    assert BENCHMARKS_PATH.exists()
    with open(BENCHMARKS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    meta = data["dataset_metadata"]
    assert meta["version"] == "1.0"
    assert len(data["benchmarks"]) == 20
    assert len(meta["capture_environments"]) == 3


def test_image_benchmarks_classification_accuracies():
    """
    Evaluate level and tone classification metrics across all held-out benchmark regions.
    Verifies Section 8.4 gate: Target of >= 90% level accuracy and >= 85% tone accuracy.
    """
    with open(BENCHMARKS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    total_regions = 0
    exact_level_matches = 0
    within_one_level_matches = 0
    exact_tone_matches = 0
    confidences: list[float] = []

    for sample in data["benchmarks"]:
        for _region_name, reg in sample["regions"].items():
            total_regions += 1

            # Level comparison
            gt_lvl = reg["ground_truth_level"]
            pred_lvl = reg["model_predicted_level"]
            lvl_err = abs(gt_lvl - pred_lvl)

            if lvl_err == 0:
                exact_level_matches += 1
            if lvl_err <= 1:
                within_one_level_matches += 1

            # Tone comparison
            if reg["tone_match"]:
                exact_tone_matches += 1

            # Confidence
            conf = reg["prediction_confidence"]
            assert 0.0 <= conf <= 1.0, f"Confidence {conf} out of range [0, 1]"
            confidences.append(conf)

    assert total_regions == 60, "Expected 60 evaluated regions (20 samples * 3 regions)"

    level_accuracy = (exact_level_matches / total_regions) * 100.0
    within_one_accuracy = (within_one_level_matches / total_regions) * 100.0
    tone_accuracy = (exact_tone_matches / total_regions) * 100.0
    avg_confidence = sum(confidences) / len(confidences)

    # Initial development objective gates from §8.4
    assert level_accuracy >= 90.0, f"Level accuracy {level_accuracy:.2f}% below 90% gate"
    assert within_one_accuracy == 100.0, f"Expected 100% within +/- 1 level, got {within_one_accuracy:.2f}%"
    assert tone_accuracy >= 85.0, f"Tone accuracy {tone_accuracy:.2f}% below 85% gate"
    assert avg_confidence >= 0.85, f"Average confidence {avg_confidence:.2f} below 0.85"


def test_image_benchmarks_uncertainty_and_lighting_coverage():
    """
    Verify benchmark covers diverse salon lighting conditions and tracks
    uncertainty/uncalibrated edge cases.
    """
    with open(BENCHMARKS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    lighting_conditions = set()
    uncalibrated_found = False

    for sample in data["benchmarks"]:
        cap = sample["capture_metadata"]
        lighting_conditions.add(cap["lighting_condition"])
        if cap["white_balance_status"] == "UNCALIBRATED_ESTIMATED":
            uncalibrated_found = True

    assert "D65_CONTROLLED_DAYLIGHT" in lighting_conditions
    assert "3000K_WARM_INCANDESCENT" in lighting_conditions
    assert "4000K_SALON_FLUORESCENT" in lighting_conditions
    assert uncalibrated_found, "Benchmark must include uncalibrated edge cases to test uncertainty"
