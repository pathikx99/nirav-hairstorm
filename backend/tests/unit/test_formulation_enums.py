"""Unit tests for formulation enums."""

from backend.app.formulation.enums import (
    ApplicationTechniqueEnum,
    FormulationResultStatusEnum,
    HairConditionEnum,
    PorosityEnum,
    ProcessModeEnum,
    SafetyStatusEnum,
    ServiceClassificationEnum,
)


def test_service_classification_enums():
    expected = {
        "DEPOSIT",
        "DARKENING",
        "SAME_LEVEL_COLOURING",
        "LIFTING",
        "TONING",
        "NEUTRALISATION",
        "COLOUR_REMOVAL",
        "LIGHTENING",
        "MULTI_STAGE_PROCESS",
        "UNSUPPORTED",
        "INSUFFICIENT_INFORMATION",
    }
    actual = {e.value for e in ServiceClassificationEnum}
    assert actual == expected


def test_safety_status_enums():
    expected = {"PASS", "WARNING", "BLOCKED", "NEEDS_ASSESSMENT"}
    actual = {e.value for e in SafetyStatusEnum}
    assert actual == expected


def test_formulation_result_status_enums():
    expected = {
        "DRAFT",
        "INSUFFICIENT_INFORMATION",
        "BLOCKED",
        "REQUIRES_PROFESSIONAL_REVIEW",
        "ELIGIBLE_FOR_REVIEW",
        "APPROVED_BY_COLOURIST",
        "SUPERSEDED",
    }
    actual = {e.value for e in FormulationResultStatusEnum}
    assert actual == expected


def test_process_mode_enums():
    expected = {"PREFERRED_MANUFACTURER", "CROSS_BRAND_COMPARISON"}
    actual = {e.value for e in ProcessModeEnum}
    assert actual == expected


def test_hair_condition_and_porosity_enums():
    assert HairConditionEnum.VIRGIN.value == "VIRGIN"
    assert HairConditionEnum.SEVERELY_DAMAGED.value == "SEVERELY_DAMAGED"
    assert PorosityEnum.NORMAL.value == "NORMAL"
    assert PorosityEnum.EXTREME.value == "EXTREME"
    assert ApplicationTechniqueEnum.REGROWTH_ONLY.value == "REGROWTH_ONLY"
