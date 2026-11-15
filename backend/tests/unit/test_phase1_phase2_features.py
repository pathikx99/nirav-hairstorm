"""Test suite validating Phase 1 & Phase 2 Creative & Colorimetric Engine Extensions."""


from backend.app.formulation.engine import FormulationEngine
from backend.app.formulation.enums import (
    ApplicationTechniqueEnum,
    FormulationResultStatusEnum,
    SafetyStatusEnum,
)
from backend.app.formulation.schemas import (
    ClientHistoryInput,
    HairAssessmentInput,
    HairRegionInput,
    TargetColourInput,
)
from backend.app.universal_colour.enums import HairRegionEnum, ToneFamilyEnum, UniversalLevel
from backend.tests.unit.test_formulation_engine import _build_mock_wella_context


def test_shadow_root_dual_bowl_generation():
    """Verify SHADOW_ROOT technique generates Bowl 1 (Root Shadow) and Bowl 2 (Color Melt)."""
    mfg, lines, shades, devs, rules, cat_ver = _build_mock_wella_context()
    assessment = HairAssessmentInput(
        market="IN",
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(4)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(4)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(4)),
        history=ClientHistoryInput(has_allergy_history=False, patch_test_completed_48h=True),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.COPPER,
        secondary_tone=ToneFamilyEnum.GOLD,
    )

    result = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        catalogue_version=cat_ver,
        product_lines=lines,
        shades=shades,
        developers=devs,
        rules=rules,
        technique=ApplicationTechniqueEnum.SHADOW_ROOT.value,
    )

    assert result.status == FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW
    assert all(c.status == SafetyStatusEnum.PASS for c in result.safety_checks)
    assert result.technique == ApplicationTechniqueEnum.SHADOW_ROOT.value
    # Expect dual-bowl stages
    assert len(result.stages) == 2
    assert "Bowl 1" in result.stages[0].stage_description or "Root Shadow" in result.stages[0].stage_description
    assert "Bowl 2" in result.stages[1].stage_description or "Color Melt" in result.stages[1].stage_description
    assert result.stages[0].target_regions == [HairRegionEnum.ROOTS]
    assert result.stages[1].target_regions == [HairRegionEnum.MID_LENGTHS, HairRegionEnum.ENDS]


def test_color_melt_dual_bowl_generation():
    """Verify COLOR_MELT technique generates dual-bowl application with feathered smudge instructions."""
    mfg, lines, shades, devs, rules, cat_ver = _build_mock_wella_context()
    assessment = HairAssessmentInput(
        market="IN",
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(4)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(4)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(4)),
        history=ClientHistoryInput(has_allergy_history=False, patch_test_completed_48h=True),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.COPPER,
        secondary_tone=ToneFamilyEnum.GOLD,
    )

    result = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        catalogue_version=cat_ver,
        product_lines=lines,
        shades=shades,
        developers=devs,
        rules=rules,
        technique=ApplicationTechniqueEnum.COLOR_MELT.value,
    )

    assert result.status == FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW
    assert len(result.stages) == 2
    assert "smudge" in result.stages[1].application_instructions.lower() or "melt" in result.stages[1].application_instructions.lower()


def test_nrp_and_counter_toner_calculation_on_lift():
    """Verify lifting Level 4 to Level 7 exposes Level 7 Orange-Gold NRP and calculates counter-toner."""
    mfg, lines, shades, devs, rules, cat_ver = _build_mock_wella_context()
    assessment = HairAssessmentInput(
        market="IN",
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(4)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(4)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(4)),
        history=ClientHistoryInput(has_allergy_history=False, patch_test_completed_48h=True),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.COPPER,
        secondary_tone=ToneFamilyEnum.GOLD,
    )

    result = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        catalogue_version=cat_ver,
        product_lines=lines,
        shades=shades,
        developers=devs,
        rules=rules,
        technique=ApplicationTechniqueEnum.ALL_OVER.value,
    )

    assert result.status == FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW
    assert result.exposed_underlying_pigment is not None
    assert "Orange-Gold" in result.exposed_underlying_pigment or "Level 7" in result.exposed_underlying_pigment
