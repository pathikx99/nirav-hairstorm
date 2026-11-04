"""Validation test verifying Principle 10: Catalogue Versioning & Historical Formulation Reproducibility."""

from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from backend.app.formulation.engine import FormulationEngine
from backend.app.formulation.enums import FormulationResultStatusEnum
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


def _setup_versioned_environment():
    mfg = Manufacturer(
        id=uuid4(),
        name="Wella Professionals",
        slug="wella-india",
        supported_markets=["IN"],
        status=ManufacturerStatusEnum.ACTIVE,
    )

    # Version 1.0 (Initial verified release)
    v1_id = uuid4()
    cat_v1 = CatalogueVersion(
        id=v1_id,
        manufacturer_id=mfg.id,
        market="IN",
        version="1.0.0",
        status=CatalogueStatusEnum.PUBLISHED,
    )

    # Version 2.0 (Updated release with revised processing time)
    v2_id = uuid4()
    cat_v2 = CatalogueVersion(
        id=v2_id,
        manufacturer_id=mfg.id,
        market="IN",
        version="2.0.0",
        status=CatalogueStatusEnum.PUBLISHED,
    )

    prod_line = ProductLine(
        id=uuid4(),
        manufacturer_id=mfg.id,
        name="Koleston Perfect ME+",
        service_type=ServiceTypeEnum.PERMANENT_COLOUR,
        market="IN",
        status=ManufacturerStatusEnum.ACTIVE,
        catalogue_version_id=v1_id,
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

    # Shade 7/43
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
        catalogue_version_id=v1_id,
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

    # Pure Natural 7/0
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
        catalogue_version_id=v1_id,
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

    # Developer 9% (30 Vol)
    dev_9 = Developer(
        id=uuid4(),
        manufacturer_id=mfg.id,
        product_id=product.id,
        product_name="Welloxon Perfect 9%",
        concentration_percent=Decimal("9.0"),
        concentration_type="PERCENTAGE",
        intended_use={"volumes": 30},
        market="IN",
        verification_status=VerificationStatusEnum.VERIFIED,
    )

    # Rules for Version 1.0 (Development time: 35 minutes)
    rules_v1 = [
        ProductRule(
            id=uuid4(),
            product_id=product.id,
            market="IN",
            service_type="LIFTING",
            rule_type="APPLICATION_INSTRUCTION",
            conditions={"service": "LIFTING", "developer_percentage": "9.0"},
            actions={
                "mixing_ratio": "1:1",
                "development_time_minutes": 35,
                "heat_allowed": False,
                "notes": "Version 1.0 standard formulation protocol (35 mins)",
            },
            verification_status=VerificationStatusEnum.VERIFIED,
            rule_version="1.0.0",
        )
    ]

    # Rules for Version 2.0 (Development time revised: 40 minutes)
    rules_v2 = [
        ProductRule(
            id=uuid4(),
            product_id=product.id,
            market="IN",
            service_type="LIFTING",
            rule_type="APPLICATION_INSTRUCTION",
            conditions={"service": "LIFTING", "developer_percentage": "9.0"},
            actions={
                "mixing_ratio": "1:1",
                "development_time_minutes": 40,
                "heat_allowed": False,
                "notes": "Version 2.0 updated protocol (40 mins)",
            },
            verification_status=VerificationStatusEnum.VERIFIED,
            rule_version="2.0.0",
        )
    ]

    return mfg, [prod_line], [shade_7_43, shade_7_0], [dev_9], cat_v1, rules_v1, cat_v2, rules_v2


def test_principle_10_exact_historical_reproducibility():
    """
    Principle 10: Every formulation must be reproducible using the exact catalogue,
    rule and engine versions used when it was generated.
    """
    mfg, prod_lines, shades, devs, cat_v1, rules_v1, cat_v2, rules_v2 = _setup_versioned_environment()

    # Virgin Level 5 to Target Level 7 Copper Gold (2 levels lift)
    assessment = HairAssessmentInput(
        history=ClientHistoryInput(has_allergy_history=False, patch_test_completed_48h=True),
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(5)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(5)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(5)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.COPPER,
        secondary_tone=ToneFamilyEnum.GOLD,
    )

    # 1. Generate historical formulation under Version 1.0
    result_v1_original = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        product_lines=prod_lines,
        shades=shades,
        developers=devs,
        rules=rules_v1,
        catalogue_version=cat_v1,
    )
    assert result_v1_original.status == FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW
    assert result_v1_original.catalogue_version_id == cat_v1.id
    assert len(result_v1_original.stages) == 1
    assert result_v1_original.stages[0].development_time_minutes == 35

    # 2. Generate updated formulation under Version 2.0
    result_v2 = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        product_lines=prod_lines,
        shades=shades,
        developers=devs,
        rules=rules_v2,
        catalogue_version=cat_v2,
    )
    assert result_v2.status == FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW
    assert result_v2.catalogue_version_id == cat_v2.id
    assert result_v2.stages[0].development_time_minutes == 40

    # 3. Principle 10 Historical Reproduction:
    # Re-evaluate specifying historical Version 1.0 rules and catalogue
    result_v1_reproduced = FormulationEngine.evaluate(
        assessment=assessment,
        target=target,
        manufacturer=mfg,
        product_lines=prod_lines,
        shades=shades,
        developers=devs,
        rules=rules_v1,
        catalogue_version=cat_v1,
    )

    # Bitwise deterministic equivalence
    assert result_v1_reproduced.catalogue_version_id == result_v1_original.catalogue_version_id
    assert result_v1_reproduced.status == result_v1_original.status
    assert result_v1_reproduced.service_classification == result_v1_original.service_classification
    assert len(result_v1_reproduced.stages) == len(result_v1_original.stages)

    stage_orig = result_v1_original.stages[0]
    stage_repro = result_v1_reproduced.stages[0]
    assert stage_repro.mixing_ratio_text == stage_orig.mixing_ratio_text
    assert stage_repro.development_time_minutes == stage_orig.development_time_minutes == 35
    assert stage_repro.developer.concentration_percent == stage_orig.developer.concentration_percent == Decimal("9.0")
    assert stage_repro.products[0].shade_code == stage_orig.products[0].shade_code == "7/43"
    assert stage_repro.products[0].weight_grams == stage_orig.products[0].weight_grams
