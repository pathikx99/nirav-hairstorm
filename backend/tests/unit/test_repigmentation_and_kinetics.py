"""Unit tests for Repigmentation, Porosity Kinetics, Indian Phenotype, and Hard Water Chelation."""

from decimal import Decimal
from uuid import uuid4

from backend.app.formulation.engine import FormulationEngine
from backend.app.formulation.enums import (
    HairConditionEnum,
    PorosityEnum,
)
from backend.app.formulation.repigmentation import (
    calculate_repigmentation_strategy,
    get_underlying_pigment,
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


def _build_test_wella_context():
    mfg = Manufacturer(
        id=uuid4(),
        name="Wella Professionals",
        slug="wella-test-repig",
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
    # 5/0 Pure Natural
    shade_5_0 = ManufacturerShade(
        id=uuid4(),
        product_id=product.id,
        shade_code="5/0",
        shade_name="Light Brown Pure Natural",
        manufacturer_depth="5",
        manufacturer_tone_code="0",
        manufacturer_family="Pure Naturals",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED,
    )
    shade_5_0.shade_mappings = [
        ShadeMapping(
            id=uuid4(),
            manufacturer_shade_id=shade_5_0.id,
            uhcr_level=5,
            primary_tone="NATURAL",
            secondary_tone=None,
            tone_intensity="STANDARD",
            mapping_confidence=Decimal("1.0"),
            verification_status=VerificationStatusEnum.VERIFIED,
        )
    ]

    # 6/0 Pure Natural
    shade_6_0 = ManufacturerShade(
        id=uuid4(),
        product_id=product.id,
        shade_code="6/0",
        shade_name="Dark Blonde Pure Natural",
        manufacturer_depth="6",
        manufacturer_tone_code="0",
        manufacturer_family="Pure Naturals",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED,
    )
    shade_6_0.shade_mappings = [
        ShadeMapping(
            id=uuid4(),
            manufacturer_shade_id=shade_6_0.id,
            uhcr_level=6,
            primary_tone="NATURAL",
            secondary_tone=None,
            tone_intensity="STANDARD",
            mapping_confidence=Decimal("1.0"),
            verification_status=VerificationStatusEnum.VERIFIED,
        )
    ]

    # 6/3 Warm Gold Primer
    shade_6_3 = ManufacturerShade(
        id=uuid4(),
        product_id=product.id,
        shade_code="6/3",
        shade_name="Dark Blonde Gold",
        manufacturer_depth="6",
        manufacturer_tone_code="3",
        manufacturer_family="Rich Naturals",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED,
    )
    shade_6_3.shade_mappings = [
        ShadeMapping(
            id=uuid4(),
            manufacturer_shade_id=shade_6_3.id,
            uhcr_level=6,
            primary_tone="GOLD",
            secondary_tone=None,
            tone_intensity="STANDARD",
            mapping_confidence=Decimal("1.0"),
            verification_status=VerificationStatusEnum.VERIFIED,
        )
    ]

    # 6/43 Copper Gold Filler
    shade_6_43 = ManufacturerShade(
        id=uuid4(),
        product_id=product.id,
        shade_code="6/43",
        shade_name="Dark Blonde Copper Gold",
        manufacturer_depth="6",
        manufacturer_tone_code="43",
        manufacturer_family="Vibrant Reds",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED,
    )
    shade_6_43.shade_mappings = [
        ShadeMapping(
            id=uuid4(),
            manufacturer_shade_id=shade_6_43.id,
            uhcr_level=6,
            primary_tone="COPPER",
            secondary_tone="GOLD",
            tone_intensity="STANDARD",
            mapping_confidence=Decimal("1.0"),
            verification_status=VerificationStatusEnum.VERIFIED,
        )
    ]

    # 7/1 Ash Blonde
    shade_7_1 = ManufacturerShade(
        id=uuid4(),
        product_id=product.id,
        shade_code="7/1",
        shade_name="Medium Blonde Ash",
        manufacturer_depth="7",
        manufacturer_tone_code="1",
        manufacturer_family="Cool Naturals",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED,
    )
    shade_7_1.shade_mappings = [
        ShadeMapping(
            id=uuid4(),
            manufacturer_shade_id=shade_7_1.id,
            uhcr_level=7,
            primary_tone="ASH",
            secondary_tone=None,
            tone_intensity="STANDARD",
            mapping_confidence=Decimal("1.0"),
            verification_status=VerificationStatusEnum.VERIFIED,
        )
    ]

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

    shades = [shade_5_0, shade_6_0, shade_6_3, shade_6_43, shade_7_1]
    return mfg, [prod_line], shades, devs, rules, cat_ver


# ---------------------------------------------------------------------------
# Unit Tests for Repigmentation Underlying Warmth Logic
# ---------------------------------------------------------------------------


def test_underlying_pigment_lookups():
    """Verify underlying warmth assignments across universal depths."""
    assert get_underlying_pigment(10)["warmth_name"] == "PALE_YELLOW"
    assert get_underlying_pigment(9)["warmth_name"] == "YELLOW"
    assert get_underlying_pigment(8)["warmth_name"] == "YELLOW_GOLD"
    assert get_underlying_pigment(7)["warmth_name"] == "ORANGE_GOLD"
    assert get_underlying_pigment(6)["warmth_name"] == "ORANGE"
    assert get_underlying_pigment(5)["warmth_name"] == "RED_ORANGE"
    assert get_underlying_pigment(4)["warmth_name"] == "RED"


def test_repigmentation_strategy_rules():
    """Verify strategy calculation based on depth deltas."""
    # Delta = -1 (e.g. 6 to 5): Direct deposit, no filler
    s1 = calculate_repigmentation_strategy(6, 5)
    assert s1["requires_repigmentation"] is False
    assert s1["strategy"] == "DIRECT_DEPOSIT"

    # Delta = -1 on porous hair: Still direct deposit (no 2-step filler)
    s1_porous = calculate_repigmentation_strategy(6, 5, is_porous=True)
    assert s1_porous["requires_repigmentation"] is False
    assert s1_porous["strategy"] == "DIRECT_DEPOSIT"

    # Delta = -2 (e.g. 8 to 6): 25% Gold addition
    s2 = calculate_repigmentation_strategy(8, 6)
    assert s2["requires_repigmentation"] is True
    assert s2["strategy"] == "WARMTH_ADDITION_25PCT"
    assert s2["filler_tone"] == ToneFamilyEnum.GOLD
    assert s2["warm_tone_ratio"] == Decimal("0.25")

    # Delta = -3 (e.g. 8 to 5): 33% Copper filler
    s3 = calculate_repigmentation_strategy(8, 5)
    assert s3["requires_repigmentation"] is True
    assert s3["strategy"] == "COPPER_FILLER_INTEGRATED"
    assert s3["filler_tone"] == ToneFamilyEnum.COPPER

    # Delta = -4 (e.g. 9 to 5): Mandatory Two-Step Pre-pigmentation
    s4 = calculate_repigmentation_strategy(9, 5)
    assert s4["requires_repigmentation"] is True
    assert s4["strategy"] == "TWO_STEP_PREPIGMENTATION"
    assert s4["filler_stage_required"] is True


# ---------------------------------------------------------------------------
# Engine Execution Tests: Repigmentation, Porosity, Hard Water, Indian Hair
# ---------------------------------------------------------------------------


def test_engine_darkening_2_levels_adds_gold_primer():
    """Darkening by 2 levels (Level 8 to Level 6) must include 25% Gold warm base."""
    mfg, lines, shades, devs, rules, cat_ver = _build_test_wella_context()

    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(8)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(8)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(8)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(6),
        primary_tone=ToneFamilyEnum.NATURAL,
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

    assert len(res.stages) == 1
    stage = res.stages[0]
    types = [p.product_type for p in stage.products]
    assert "FILLER" in types, "Must include warm gold filler component"
    filler = next(p for p in stage.products if p.product_type == "FILLER")
    assert filler.parts == Decimal("0.25")
    assert "6/3" in filler.shade_code


def test_engine_darkening_3_levels_adds_copper_filler():
    """Darkening by 3 levels (Level 8 to Level 5) must include 1/3 Copper priming filler."""
    mfg, lines, shades, devs, rules, cat_ver = _build_test_wella_context()

    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(8)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(8)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(8)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(5),
        primary_tone=ToneFamilyEnum.NATURAL,
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

    assert len(res.stages) == 1
    stage = res.stages[0]
    types = [p.product_type for p in stage.products]
    assert "FILLER" in types
    filler = next(p for p in stage.products if p.product_type == "FILLER")
    assert filler.parts == Decimal("0.33")
    assert "6/43" in filler.shade_code


def test_engine_darkening_4_levels_generates_two_step_stages():
    """Darkening by 4 levels (Level 9 to Level 5) must mandate a 2-step repigmentation process."""
    mfg, lines, shades, devs, rules, cat_ver = _build_test_wella_context()

    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(9)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(9)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(9)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(5),
        primary_tone=ToneFamilyEnum.NATURAL,
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

    assert len(res.stages) == 2, "Must produce 2 stages: Pre-pigmentation Filler + Target Deposit"
    assert res.stages[0].stage_number == 1
    assert "Pre-Pigmentation" in res.stages[0].stage_description
    assert res.stages[1].stage_number == 2
    assert "Target Deposit" in res.stages[1].stage_description
    assert res.regions[0].repigmentation_notes is not None


def test_engine_hard_water_prepends_metal_chelation_stage():
    """Hard water detection must prepend Metal Detox Chelation Stage 1."""
    mfg, lines, shades, devs, rules, cat_ver = _build_test_wella_context()

    assessment = HairAssessmentInput(
        history=ClientHistoryInput(has_hard_water=True),
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(5)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(5)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(5)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.ASH,
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

    # Chelation stage prepended as Stage 1, lifting application as Stage 2
    assert len(res.stages) == 2
    assert res.stages[0].stage_number == 1
    assert "Chelation" in res.stages[0].stage_description
    assert res.stages[1].stage_number == 2
    assert any(c.check_code == "SAFETY_HARD_WATER_METAL_DEPOSIT" for c in res.safety_checks)


def test_engine_indian_coarse_hair_extended_processing_time():
    """Coarse Indian hair (Level 2) lifted by 3 levels must extend development time by +10 min."""
    mfg, lines, shades, devs, rules, cat_ver = _build_test_wella_context()

    assessment = HairAssessmentInput(
        market="IN",
        history=ClientHistoryInput(hair_texture="COARSE_RESISTANT"),
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(2)),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(2)),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(2)),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(5),
        primary_tone=ToneFamilyEnum.NATURAL,
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

    stage = res.stages[0]
    # Standard 35 min + 10 min = 45 min
    assert stage.development_time_minutes == 45
    assert any("red-orange wall" in w for w in res.warnings)


def test_engine_high_porosity_notes_and_compensation():
    """High porosity in hair ends must generate porosity compensation notes and equalizer advice."""
    mfg, lines, shades, devs, rules, cat_ver = _build_test_wella_context()

    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(6), porosity=PorosityEnum.NORMAL),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(6), porosity=PorosityEnum.NORMAL),
        ends=HairRegionInput(
            region=HairRegionEnum.ENDS,
            observed_level=UniversalLevel(6),
            porosity=PorosityEnum.HIGH,
            condition=HairConditionEnum.MODERATELY_DAMAGED,
        ),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(7),
        primary_tone=ToneFamilyEnum.ASH,
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

    ends_plan = next(r for r in res.regions if r.region == HairRegionEnum.ENDS)
    assert ends_plan.porosity_compensation_notes is not None
    assert "porosity equalising" in ends_plan.porosity_compensation_notes.lower()


def test_engine_darkening_zonal_roots_at_target_lengths_at_9():
    """Zonal darkening where roots are at target (Level 5) and ends are bleached (Level 9)."""
    mfg, lines, shades, devs, rules, cat_ver = _build_test_wella_context()

    assessment = HairAssessmentInput(
        roots=HairRegionInput(region=HairRegionEnum.ROOTS, observed_level=UniversalLevel(5), porosity=PorosityEnum.NORMAL),
        mid_lengths=HairRegionInput(region=HairRegionEnum.MID_LENGTHS, observed_level=UniversalLevel(9), porosity=PorosityEnum.HIGH),
        ends=HairRegionInput(region=HairRegionEnum.ENDS, observed_level=UniversalLevel(9), porosity=PorosityEnum.HIGH),
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(5),
        primary_tone=ToneFamilyEnum.NATURAL,
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

    # Must produce two-step stages with valid filler shade matching Level 9 -> 5 delta
    assert len(res.stages) == 2
    assert "Pre-Pigmentation" in res.stages[0].stage_description
    assert any("6/43" in p.shade_code for p in res.stages[0].products)
