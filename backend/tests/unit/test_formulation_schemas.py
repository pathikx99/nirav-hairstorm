"""Unit tests for formulation schemas and validators."""

from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from backend.app.formulation.enums import (
    FormulationResultStatusEnum,
    HairConditionEnum,
    PorosityEnum,
    ProcessModeEnum,
    SafetyStatusEnum,
    ServiceClassificationEnum,
)
from backend.app.formulation.schemas import (
    ClientHistoryInput,
    DeveloperComponentFormula,
    FormulationEvaluateRequest,
    FormulationResultResponse,
    FormulationStage,
    HairAssessmentInput,
    HairRegionInput,
    ProductComponentFormula,
    RegionFormulationPlan,
    SafetyCheckResult,
    TargetColourInput,
)
from backend.app.universal_colour.enums import HairRegionEnum, ToneFamilyEnum, UniversalLevel


def test_client_history_defaults():
    hist = ClientHistoryInput()
    assert hist.has_allergy_history is False
    assert hist.patch_test_completed_48h is False
    assert hist.scalp_condition == "normal"
    assert hist.previous_chemical_services == []
    assert hist.has_metallic_salts_or_henna is False
    assert hist.has_sodium_hydroxide_relaxer is False


def test_hair_region_input_validation():
    region = HairRegionInput(
        region=HairRegionEnum.ROOTS,
        observed_level=UniversalLevel(4),
        grey_percentage=Decimal("40.0"),
        porosity=PorosityEnum.NORMAL,
        condition=HairConditionEnum.HEALTHY,
        is_on_scalp=True,
    )
    assert region.region == HairRegionEnum.ROOTS
    assert region.observed_level == UniversalLevel(4)
    assert region.grey_percentage == Decimal("40.0")

    # Invalid grey percentage > 100
    with pytest.raises(ValidationError):
        HairRegionInput(
            region=HairRegionEnum.ROOTS,
            observed_level=UniversalLevel(4),
            grey_percentage=Decimal("150.0"),
        )


def test_formulation_evaluate_request_validation():
    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(5)),
        mid_lengths=HairRegionInput(
            region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(5)
        ),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(5)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.ASH,
    )

    # Valid preferred manufacturer request
    mfg_id = uuid4()
    req = FormulationEvaluateRequest(
        assessment=assessment,
        target_colour=target,
        mode=ProcessModeEnum.PREFERRED_MANUFACTURER,
        manufacturer_id=mfg_id,
    )
    assert req.manufacturer_id == mfg_id

    # Missing manufacturer_id in preferred manufacturer mode
    with pytest.raises(ValidationError):
        FormulationEvaluateRequest(
            assessment=assessment,
            target_colour=target,
            mode=ProcessModeEnum.PREFERRED_MANUFACTURER,
            manufacturer_id=None,
        )

    # Missing inputs entirely
    with pytest.raises(ValidationError):
        FormulationEvaluateRequest(
            assessment=None,
            assessment_id=None,
            target_colour=target,
        )


def test_formulation_stage_and_response_schema():
    prod = ProductComponentFormula(
        product_type="SHADE",
        product_name="Koleston Perfect ME+",
        shade_code="7/1",
        shade_name="Medium Blonde Ash",
        parts=Decimal("1.0"),
        weight_grams=Decimal("60.0"),
    )
    dev = DeveloperComponentFormula(
        developer_name="Welloxon Perfect 6%",
        concentration_percent=Decimal("6.0"),
        volume_in_vol=20,
        parts=Decimal("1.0"),
        weight_grams=Decimal("60.0"),
    )
    stage = FormulationStage(
        stage_number=1,
        service_type=ServiceClassificationEnum.LIFTING,
        stage_description="Full regrowth application",
        target_regions=[HairRegionEnum.ROOTS],
        products=[prod],
        developer=dev,
        mixing_ratio_text="1:1",
        development_time_minutes=35,
        development_time_range="30–40 min",
        application_instructions="Apply to regrowth area",
        rules_applied=["WELLA-KP-MIX-STANDARD"],
    )
    reg_plan = RegionFormulationPlan(
        region=HairRegionEnum.ROOTS,
        initial_level=5,
        target_level=7,
        level_delta=2,
        service_classification=ServiceClassificationEnum.LIFTING,
        stages=[stage],
    )
    safety_check = SafetyCheckResult(
        check_code="SAFETY_ALLERGY_KNOWN_HISTORY",
        status=SafetyStatusEnum.PASS,
        title="Known Allergy Check",
        detail="No allergy history reported.",
    )

    resp = FormulationResultResponse(
        status=FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW,
        service_classification=ServiceClassificationEnum.LIFTING,
        stages=[stage],
        regions=[reg_plan],
        safety_checks=[safety_check],
    )
    assert resp.status == FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW
    assert resp.chemical_equivalence == "NOT_ESTABLISHED"
    assert len(resp.stages) == 1
    assert resp.stages[0].products[0].shade_code == "7/1"
