"""Validation test suite executing the 10 adversarial/contraindicated benchmark cases."""

from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

from backend.app.formulation.engine import FormulationEngine
from backend.app.formulation.enums import (
    HairConditionEnum,
    SafetyStatusEnum,
    ServiceClassificationEnum,
)
from backend.app.formulation.safety import SafetyValidationService
from backend.app.formulation.schemas import (
    ClientHistoryInput,
    HairAssessmentInput,
    HairRegionInput,
    TargetColourInput,
)
from backend.app.manufacturers.enums import (
    CatalogueStatusEnum,
    ManufacturerStatusEnum,
)
from backend.app.models.manufacturers import (
    CatalogueVersion,
    Manufacturer,
)
from backend.app.universal_colour.enums import HairRegionEnum, ToneFamilyEnum, UniversalLevel

BENCHMARK_PATH = Path("data/validation/safety_blocked_cases.json")


def _get_benchmark_case(case_id: str) -> dict:
    with open(BENCHMARK_PATH, encoding="utf-8") as f:
        data = json.load(f)
    for c in data["cases"]:
        if c["case_id"] == case_id:
            return c
    raise ValueError(f"Case {case_id} not found in benchmark")


def test_benchmark_suite_integrity():
    """Verify that all 10 benchmark cases exist with proper schema and classification."""
    assert BENCHMARK_PATH.exists()
    with open(BENCHMARK_PATH, encoding="utf-8") as f:
        data = json.load(f)

    assert data["benchmark_metadata"]["total_cases"] == 10
    cases = data["cases"]
    assert len(cases) == 10

    case_ids = [c["case_id"] for c in cases]
    assert len(set(case_ids)) == 10, "Duplicate benchmark case ID found"


def test_case_01_allergy_history_blocks():
    """Case 1: Documented PPD / hair dye allergy history must strictly block formulation."""
    case = _get_benchmark_case("BLOCKED-01-ALLERGY-HISTORY")
    history_in = case["inputs"]["history"]

    history = ClientHistoryInput(
        has_allergy_history=history_in["has_allergy_history"],
        patch_test_completed_48h=history_in["patch_test_completed_48h"],
        scalp_condition=history_in["scalp_condition"],
        has_metallic_salts_or_henna=history_in["has_metallic_salts_or_henna"],
        has_sodium_hydroxide_relaxer=history_in["has_sodium_hydroxide_relaxer"],
    )
    assessment = HairAssessmentInput(
        history=history,
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(4)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(4)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(4)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(case["inputs"]["target_colour"]["universal_level"]),
        primary_tone=ToneFamilyEnum[case["inputs"]["target_colour"]["primary_tone"]],
    )

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIFTING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(c.check_code == case["expected_blocking_code"] and c.status == SafetyStatusEnum.BLOCKED for c in checks)
    assert len(reasons) > 0


def test_case_02_scalp_lesions_blocks():
    """Case 2: Active scalp lesions and broken skin must block formulation."""
    case = _get_benchmark_case("BLOCKED-02-SCALP-LESIONS")
    history_in = case["inputs"]["history"]

    history = ClientHistoryInput(
        has_allergy_history=history_in["has_allergy_history"],
        patch_test_completed_48h=history_in["patch_test_completed_48h"],
        scalp_condition=history_in["scalp_condition"],
    )
    assessment = HairAssessmentInput(
        history=history,
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(5)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(5)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(5)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(case["inputs"]["target_colour"]["universal_level"]),
        primary_tone=ToneFamilyEnum[case["inputs"]["target_colour"]["primary_tone"]],
    )

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIFTING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(c.check_code == case["expected_blocking_code"] and c.status == SafetyStatusEnum.BLOCKED for c in checks)


def test_case_03_henna_metallic_salts_blocks_lightening():
    """Case 3: Henna / metallic salts treated hair + persulfate bleach must strictly block."""
    case = _get_benchmark_case("BLOCKED-03-HENNA-LIGHTENING")
    history_in = case["inputs"]["history"]

    history = ClientHistoryInput(
        has_metallic_salts_or_henna=history_in["has_metallic_salts_or_henna"],
        previous_chemical_services=history_in["previous_chemical_services"],
    )
    assessment = HairAssessmentInput(
        history=history,
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(4)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(4)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(4)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(case["inputs"]["target_colour"]["universal_level"]),
        primary_tone=ToneFamilyEnum[case["inputs"]["target_colour"]["primary_tone"]],
    )

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIGHTENING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(c.check_code == case["expected_blocking_code"] and c.status == SafetyStatusEnum.BLOCKED for c in checks)


def test_case_04_lye_relaxer_blocks_bleach():
    """Case 4: Sodium hydroxide (lye) relaxer + bleach must strictly block."""
    case = _get_benchmark_case("BLOCKED-04-LYE-RELAXER-BLEACH")
    history_in = case["inputs"]["history"]

    history = ClientHistoryInput(
        has_sodium_hydroxide_relaxer=history_in["has_sodium_hydroxide_relaxer"],
        previous_chemical_services=history_in["previous_chemical_services"],
    )
    assessment = HairAssessmentInput(
        history=history,
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(3)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(3)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(3)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(case["inputs"]["target_colour"]["universal_level"]),
        primary_tone=ToneFamilyEnum[case["inputs"]["target_colour"]["primary_tone"]],
    )

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIGHTENING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(c.check_code == case["expected_blocking_code"] and c.status == SafetyStatusEnum.BLOCKED for c in checks)


def test_case_05_severely_damaged_fiber_blocks_lift():
    """Case 5: Severely damaged fiber + oxidative lift must strictly block."""
    case = _get_benchmark_case("BLOCKED-05-SEVERELY-DAMAGED-FIBER")

    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(6), condition=HairConditionEnum.VIRGIN),
        mid_lengths=HairRegionInput(
            region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(6), condition=HairConditionEnum.SEVERELY_DAMAGED
        ),
        ends=HairRegionInput(
            region=HairRegionEnum.ENDS, observed_level=UniversalLevel(6), condition=HairConditionEnum.SEVERELY_DAMAGED
        ),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(case["inputs"]["target_colour"]["universal_level"]),
        primary_tone=ToneFamilyEnum[case["inputs"]["target_colour"]["primary_tone"]],
    )

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIFTING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(c.check_code == case["expected_blocking_code"] and c.status == SafetyStatusEnum.BLOCKED for c in checks)


def test_case_06_blondor_scalp_developer_exceeded():
    """Case 6: Blondor on-scalp with developer > 6% must strictly block."""
    case = _get_benchmark_case("BLOCKED-06-BLONDOR-SCALP-DEVELOPER-EXCEEDED")
    inputs = case["inputs"]

    checks = SafetyValidationService.validate_product_and_application_rules(
        product_family=inputs["product_family"],
        service_type=inputs["service_type"],
        developer_percentage=Decimal(str(inputs["developer_percentage"])),
        is_on_scalp=inputs["is_on_scalp"],
        has_wellaplex=inputs["has_wellaplex"],
    )
    assert any(c.check_code == case["expected_blocking_code"] and c.status == SafetyStatusEnum.BLOCKED for c in checks)


def test_case_07_blondor_base_breaker_with_wellaplex():
    """Case 7: Blondor Base Breaker + WellaPlex contraindication must strictly block."""
    case = _get_benchmark_case("BLOCKED-07-BLONDOR-BASE-BREAKER-WITH-WELLAPLEX")
    inputs = case["inputs"]

    checks = SafetyValidationService.validate_product_and_application_rules(
        product_family=inputs["product_family"],
        service_type=inputs["service_type"],
        developer_percentage=Decimal(str(inputs["developer_percentage"])),
        is_on_scalp=inputs["is_on_scalp"],
        has_wellaplex=inputs["has_wellaplex"],
    )
    assert any(c.check_code == case["expected_blocking_code"] and c.status == SafetyStatusEnum.BLOCKED for c in checks)


def test_case_08_magma_on_scalp_blocks():
    """Case 8: Magma direct on-scalp application must strictly block."""
    case = _get_benchmark_case("BLOCKED-08-MAGMA-DIRECT-ON-SCALP")
    inputs = case["inputs"]

    checks = SafetyValidationService.validate_product_and_application_rules(
        product_family=inputs["product_family"],
        service_type=inputs["service_type"],
        developer_percentage=Decimal(str(inputs["developer_percentage"])),
        is_on_scalp=inputs["is_on_scalp"],
        has_wellaplex=inputs["has_wellaplex"],
    )
    assert any(c.check_code == case["expected_blocking_code"] and c.status == SafetyStatusEnum.BLOCKED for c in checks)


def test_case_09_artificial_colour_lift_requires_multi_stage():
    """Case 9: Artificial colour lift cannot be executed with single-stage permanent tint (Color does not lift color)."""
    case = _get_benchmark_case("BLOCKED-09-ARTIFICIAL-COLOUR-LIFT-BY-TINT")
    inputs = case["inputs"]

    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(3), existing_artificial_colour=True),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(3), existing_artificial_colour=True),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(3), existing_artificial_colour=True),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(inputs["target_colour"]["universal_level"]),
        primary_tone=ToneFamilyEnum[inputs["target_colour"]["primary_tone"]],
    )

    from backend.app.formulation.classifier import FeasibilityClassifier
    classification, _ = FeasibilityClassifier.classify_overall(assessment, target)

    # Must classify as MULTI_STAGE_PROCESS or COLOUR_REMOVAL, NEVER single-stage TINT / LIFT
    assert classification in (ServiceClassificationEnum.MULTI_STAGE_PROCESS, ServiceClassificationEnum.COLOUR_REMOVAL)


def test_case_10_unverified_catalogue_blocks_formulation():
    """Case 10: Principle 6 violation - unverified catalogue cannot produce executable formulation."""
    from backend.app.formulation.enums import FormulationResultStatusEnum

    mfg = Manufacturer(
        id=uuid4(),
        name="Unverified Brand",
        slug="unverified-brand",
        supported_markets=["IN"],
        status=ManufacturerStatusEnum.ACTIVE,
    )
    unverified_cat = CatalogueVersion(
        id=uuid4(),
        manufacturer_id=mfg.id,
        market="IN",
        version="0.1",
        status=CatalogueStatusEnum.DRAFT,
    )

    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(5)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(5)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(5)),
    )
    target = TargetColourInput(universal_level=UniversalLevel(6), primary_tone=ToneFamilyEnum.NATURAL)

    result = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        product_lines=[],
        shades=[],
        developers=[],
        rules=[],
        catalogue_version=unverified_cat,
    )
    assert result.status == FormulationResultStatusEnum.BLOCKED
    assert len(result.stages) == 0
    assert any("Principle 6" in w for w in result.warnings)
