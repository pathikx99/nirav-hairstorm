"""Unit tests for safety and contraindication validator."""

from decimal import Decimal

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
from backend.app.universal_colour.enums import HairRegionEnum, ToneFamilyEnum, UniversalLevel


def _make_base_assessment(history: ClientHistoryInput) -> HairAssessmentInput:
    return HairAssessmentInput(
        history=history,
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(5)),
        mid_lengths=HairRegionInput(
            region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(5)
        ),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(5)),
    )


def test_safety_allergy_history_blocks():
    # Documented history of allergy -> must BLOCK
    assessment = _make_base_assessment(ClientHistoryInput(has_allergy_history=True))
    target = TargetColourInput(universal_level=UniversalLevel(7), primary_tone=ToneFamilyEnum.ASH)

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIFTING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(
        c.check_code == "SAFETY_ALLERGY_KNOWN_HISTORY" and c.status == SafetyStatusEnum.BLOCKED
        for c in checks
    )
    assert len(reasons) > 0


def test_safety_scalp_irritation_blocks():
    assessment = _make_base_assessment(ClientHistoryInput(scalp_condition="irritated"))
    target = TargetColourInput(universal_level=UniversalLevel(7), primary_tone=ToneFamilyEnum.GOLD)

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIFTING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(
        c.check_code == "SAFETY_SCALP_INTEGRITY" and c.status == SafetyStatusEnum.BLOCKED
        for c in checks
    )


def test_safety_henna_with_lightening_blocks():
    assessment = _make_base_assessment(ClientHistoryInput(has_metallic_salts_or_henna=True))
    target = TargetColourInput(
        universal_level=UniversalLevel(9), primary_tone=ToneFamilyEnum.PEARL
    )

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIGHTENING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(
        c.check_code == "SAFETY_HENNA_METALLIC_SALTS" and c.status == SafetyStatusEnum.BLOCKED
        for c in checks
    )


def test_safety_lye_relaxer_with_bleach_blocks():
    assessment = _make_base_assessment(ClientHistoryInput(has_sodium_hydroxide_relaxer=True))
    target = TargetColourInput(
        universal_level=UniversalLevel(10), primary_tone=ToneFamilyEnum.NATURAL
    )

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIGHTENING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(
        c.check_code == "SAFETY_SODIUM_HYDROXIDE_BLEACH" and c.status == SafetyStatusEnum.BLOCKED
        for c in checks
    )


def test_safety_severely_damaged_hair_blocks_lightening():
    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(6)),
        mid_lengths=HairRegionInput(
            region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(6)
        ),
        ends=HairRegionInput(
            region=HairRegionEnum.ENDS,
            observed_level=UniversalLevel(6),
            condition=HairConditionEnum.SEVERELY_DAMAGED,
        ),
    )
    target = TargetColourInput(universal_level=UniversalLevel(9), primary_tone=ToneFamilyEnum.ASH)

    status, checks, reasons = SafetyValidationService.validate_assessment_and_target(
        assessment, target, ServiceClassificationEnum.LIGHTENING
    )
    assert status == SafetyStatusEnum.BLOCKED
    assert any(
        c.check_code == "SAFETY_SEVERELY_DAMAGED_FIBER" and c.status == SafetyStatusEnum.BLOCKED
        for c in checks
    )


def test_safety_blondor_scalp_max_developer_rule():
    # Max developer on scalp for Blondor is 6%
    checks_safe = SafetyValidationService.validate_product_and_application_rules(
        product_family="Blondor",
        service_type="LIGHTENER",
        developer_percentage=Decimal("6.0"),
        is_on_scalp=True,
    )
    assert not any(c.status == SafetyStatusEnum.BLOCKED for c in checks_safe)

    checks_unsafe = SafetyValidationService.validate_product_and_application_rules(
        product_family="Blondor",
        service_type="LIGHTENER",
        developer_percentage=Decimal("9.0"),
        is_on_scalp=True,
    )
    assert any(
        c.check_code == "SAFETY_BLONDOR_SCALP_MAX_6PCT" and c.status == SafetyStatusEnum.BLOCKED
        for c in checks_unsafe
    )


def test_safety_blondor_bb_and_magma_contraindications():
    bb_checks = SafetyValidationService.validate_product_and_application_rules(
        product_family="Blondor Base Breaker",
        service_type="LIGHTENER",
        developer_percentage=Decimal("6.0"),
        is_on_scalp=False,
        has_wellaplex=True,
    )
    assert any(
        c.check_code == "SAFETY_BLONDOR_BB_NO_WELLAPLEX" and c.status == SafetyStatusEnum.BLOCKED
        for c in bb_checks
    )

    magma_checks = SafetyValidationService.validate_product_and_application_rules(
        product_family="Magma",
        service_type="LIGHTENER",
        developer_percentage=Decimal("6.0"),
        is_on_scalp=True,
    )
    assert any(
        c.check_code == "SAFETY_MAGMA_ON_SCALP" and c.status == SafetyStatusEnum.BLOCKED
        for c in magma_checks
    )
