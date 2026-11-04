"""Unit tests for the Deterministic Formulation Engine."""

from decimal import Decimal
from uuid import uuid4

from backend.app.formulation.engine import FormulationEngine
from backend.app.formulation.enums import (
    FormulationResultStatusEnum,
    SafetyStatusEnum,
    ServiceClassificationEnum,
)
from backend.app.formulation.schemas import (
    ClientHistoryInput,
    HairAssessmentInput,
    HairRegionInput,
    TargetColourInput,
)
from backend.app.manufacturers.enums import (
    CatalogueStatusEnum,
    ManufacturerStatusEnum,
    ProductTypeEnum,
    ServiceTypeEnum,
    VerificationStatusEnum,
)
from backend.app.models.manufacturers import (
    CatalogueVersion,
    Developer,
    Manufacturer,
    ManufacturerProduct,
    ManufacturerShade,
    ProductLine,
    ProductRule,
    ShadeMapping,
)
from backend.app.universal_colour.enums import HairRegionEnum, ToneFamilyEnum, UniversalLevel


def _build_mock_wella_context():
    mfg = Manufacturer(
        id=uuid4(),
        name="Wella Professionals",
        slug="wella-professionals-test",
        supported_markets=["IN"],
        status=ManufacturerStatusEnum.ACTIVE,
    )
    cat_ver = CatalogueVersion(
        id=uuid4(),
        manufacturer_id=mfg.id,
        market="IN",
        version="1.0",
        status=CatalogueStatusEnum.PUBLISHED,
    )
    prod_line = ProductLine(
        id=uuid4(),
        manufacturer_id=mfg.id,
        name="Koleston Perfect ME+",
        service_type=ServiceTypeEnum.PERMANENT_COLOUR,
        market="IN",
        status=ManufacturerStatusEnum.ACTIVE,
        catalogue_version_id=cat_ver.id,
    )
    product = ManufacturerProduct(
        id=uuid4(),
        product_line_id=prod_line.id,
        product_name="Koleston Perfect ME+ Crème",
        product_code="KP-ME-PLUS",
        product_type=ProductTypeEnum.COLOUR,
        market="IN",
        active_status=True,
        verification_status=VerificationStatusEnum.VERIFIED,
    )

    # Shades
    # 7/0 Pure Natural
    shade_7_0 = ManufacturerShade(
        id=uuid4(),
        product_id=product.id,
        shade_code="7/0",
        shade_name="Medium Blonde Pure Natural",
        manufacturer_depth="7",
        manufacturer_tone_code="0",
        manufacturer_family="Pure Naturals",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED,
    )
    shade_7_0.shade_mappings = [
        ShadeMapping(
            id=uuid4(),
            manufacturer_shade_id=shade_7_0.id,
            uhcr_level=7,
            primary_tone="NATURAL",
            secondary_tone=None,
            tone_intensity="STANDARD",
            mapping_confidence=Decimal("1.0"),
            verification_status=VerificationStatusEnum.VERIFIED,
        )
    ]

    # 7/43 Vibrant Reds / Copper Gold
    shade_7_43 = ManufacturerShade(
        id=uuid4(),
        product_id=product.id,
        shade_code="7/43",
        shade_name="Medium Blonde Red Gold",
        manufacturer_depth="7",
        manufacturer_tone_code="43",
        manufacturer_family="Vibrant Reds",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED,
    )
    shade_7_43.shade_mappings = [
        ShadeMapping(
            id=uuid4(),
            manufacturer_shade_id=shade_7_43.id,
            uhcr_level=7,
            primary_tone="COPPER",
            secondary_tone="GOLD",
            tone_intensity="STANDARD",
            mapping_confidence=Decimal("1.0"),
            verification_status=VerificationStatusEnum.VERIFIED,
        )
    ]

    # Special Mix 0/43
    shade_0_43 = ManufacturerShade(
        id=uuid4(),
        product_id=product.id,
        shade_code="0/43",
        shade_name="Special Mix Red Gold",
        manufacturer_depth="0",
        manufacturer_tone_code="43",
        manufacturer_family="Special Mix",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED,
    )
    shade_0_43.shade_mappings = [
        ShadeMapping(
            id=uuid4(),
            manufacturer_shade_id=shade_0_43.id,
            uhcr_level=0,
            primary_tone="COPPER",
            secondary_tone="GOLD",
            tone_intensity="EXTRA_INTENSE",
            mapping_confidence=Decimal("1.0"),
            verification_status=VerificationStatusEnum.VERIFIED,
        )
    ]

    # Lightener (Blondor)
    blondor_shade = ManufacturerShade(
        id=uuid4(),
        product_id=product.id,
        shade_code="BLONDOR-MBP",
        shade_name="Blondor Multi-Blonde Powder",
        manufacturer_depth="",
        manufacturer_tone_code="",
        manufacturer_family="Blondor",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED,
    )
    blondor_shade.shade_mappings = []

    shades = [shade_7_0, shade_7_43, shade_0_43, blondor_shade]

    # Developers
    devs = [
        Developer(
            id=uuid4(),
            manufacturer_id=mfg.id,
            product_id=product.id,
            product_name="Welloxon Perfect 1.9%",
            concentration_percent=Decimal("1.9"),
            intended_use={"volumes": 6},
            market="IN",
            verification_status=VerificationStatusEnum.VERIFIED,
        ),
        Developer(
            id=uuid4(),
            manufacturer_id=mfg.id,
            product_id=product.id,
            product_name="Welloxon Perfect 6%",
            concentration_percent=Decimal("6.0"),
            intended_use={"volumes": 20},
            market="IN",
            verification_status=VerificationStatusEnum.VERIFIED,
        ),
        Developer(
            id=uuid4(),
            manufacturer_id=mfg.id,
            product_id=product.id,
            product_name="Welloxon Perfect 9%",
            concentration_percent=Decimal("9.0"),
            intended_use={"volumes": 30},
            market="IN",
            verification_status=VerificationStatusEnum.VERIFIED,
        ),
        Developer(
            id=uuid4(),
            manufacturer_id=mfg.id,
            product_id=product.id,
            product_name="Welloxon Perfect 12%",
            concentration_percent=Decimal("12.0"),
            intended_use={"volumes": 40},
            market="IN",
            verification_status=VerificationStatusEnum.VERIFIED,
        ),
    ]

    rules = [
        ProductRule(
            id=uuid4(),
            product_id=product.id,
            market="IN",
            service_type="PERMANENT_COLOUR",
            rule_type="MIXING_RATIO",
            conditions={},
            actions={"mixing_ratio": {"colour_parts": 1.0, "developer_parts": 1.0}},
            verification_status=VerificationStatusEnum.VERIFIED,
            rule_version="1.0",
        )
    ]

    return mfg, [prod_line], shades, devs, rules, cat_ver


def test_formulation_engine_blocked_by_allergy():
    mfg, lines, shades, devs, rules, cat_ver = _build_mock_wella_context()

    assessment = HairAssessmentInput(
        history=ClientHistoryInput(has_allergy_history=True),  # Allergy reported!
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(5)),
        mid_lengths=HairRegionInput(
            region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(5)
        ),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(5)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.COPPER,
        secondary_tone=ToneFamilyEnum.GOLD,
    )

    res = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        product_lines=lines,
        shades=shades,
        developers=devs,
        rules=rules,
        catalogue_version=cat_ver,
    )

    assert res.status == FormulationResultStatusEnum.BLOCKED
    assert len(res.stages) == 0  # Principle 6: Zero executable stages when blocked!
    assert any(c.status == SafetyStatusEnum.BLOCKED for c in res.safety_checks)


def test_formulation_engine_virgin_hair_lifting():
    mfg, lines, shades, devs, rules, cat_ver = _build_mock_wella_context()

    # Virgin level 4 targeting level 7 Copper Gold (3 levels of lift)
    assessment = HairAssessmentInput(
        history=ClientHistoryInput(patch_test_completed_48h=True),
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(4)),
        mid_lengths=HairRegionInput(
            region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(4)
        ),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(4)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.COPPER,
        secondary_tone=ToneFamilyEnum.GOLD,
    )

    res = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        product_lines=lines,
        shades=shades,
        developers=devs,
        rules=rules,
        catalogue_version=cat_ver,
    )

    assert res.status == FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW
    assert res.service_classification == ServiceClassificationEnum.LIFTING
    assert len(res.stages) == 1
    st = res.stages[0]
    # 3 levels of lift requires 12% (40 Vol) developer
    assert st.developer.concentration_percent == Decimal("12.0")
    assert st.mixing_ratio_text == "1:1"
    # Target shade 7/43 was matched
    assert st.products[0].shade_code == "7/43"


def test_formulation_engine_grey_coverage_50_percent():
    mfg, lines, shades, devs, rules, cat_ver = _build_mock_wella_context()

    # Level 7 target with 50% grey hair at roots
    assessment = HairAssessmentInput(
        history=ClientHistoryInput(patch_test_completed_48h=True),
        roots=HairRegionInput(
            region=HairRegionEnum.ROOTS,
            observed_level=UniversalLevel(6),
            grey_percentage=Decimal("50.0"),  # 50% white hair
        ),
        mid_lengths=HairRegionInput(
            region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(6)
        ),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(6)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.COPPER,
        secondary_tone=ToneFamilyEnum.GOLD,
    )

    res = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        product_lines=lines,
        shades=shades,
        developers=devs,
        rules=rules,
        catalogue_version=cat_ver,
    )

    assert res.status == FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW
    st = res.stages[0]
    # Should contain BOTH Pure Natural (7/0) and Fashion Shade (7/43) in 1:1 proportion (30g each)
    prod_codes = {p.shade_code for p in st.products}
    assert "7/0" in prod_codes
    assert "7/43" in prod_codes
    pure_nat_comp = [p for p in st.products if p.shade_code == "7/0"][0]
    assert pure_nat_comp.is_pure_natural is True
    assert pure_nat_comp.parts == Decimal("0.5")


def test_formulation_engine_multi_stage_for_precoloured_hair():
    mfg, lines, shades, devs, rules, cat_ver = _build_mock_wella_context()

    # Previously coloured hair at level 5 targeting level 7
    # "Color does not lift color" -> requires multi-stage (lightener stage 1 + toner stage 2)
    assessment = HairAssessmentInput(
        history=ClientHistoryInput(patch_test_completed_48h=True),
        roots=HairRegionInput(
            region=HairRegionEnum.ROOTS,
            observed_level=UniversalLevel(5),
            existing_artificial_colour=True,
        ),
        mid_lengths=HairRegionInput(
            region=HairRegionEnum.MID_LENGTHS,
            observed_level=UniversalLevel(5),
            existing_artificial_colour=True,
        ),
        ends=HairRegionInput(
            region=HairRegionEnum.ENDS,
            observed_level=UniversalLevel(5),
            existing_artificial_colour=True,
        ),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.COPPER,
        secondary_tone=ToneFamilyEnum.GOLD,
    )

    res = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        product_lines=lines,
        shades=shades,
        developers=devs,
        rules=rules,
        catalogue_version=cat_ver,
    )

    assert res.service_classification == ServiceClassificationEnum.MULTI_STAGE_PROCESS
    assert len(res.stages) == 2
    assert res.stages[0].service_type == ServiceClassificationEnum.LIGHTENING
    assert res.stages[0].developer.concentration_percent == Decimal("6.0")  # max 6% on scalp
    assert res.stages[1].service_type == ServiceClassificationEnum.TONING
    assert res.stages[1].products[0].shade_code == "7/43"
