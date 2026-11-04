"""Unit tests for hair feasibility classification."""

from backend.app.formulation.classifier import FeasibilityClassifier
from backend.app.formulation.enums import ServiceClassificationEnum
from backend.app.formulation.schemas import (
    HairAssessmentInput,
    HairRegionInput,
    TargetColourInput,
)
from backend.app.universal_colour.enums import HairRegionEnum, ToneFamilyEnum, UniversalLevel


def test_virgin_hair_darkening():
    reg = HairRegionInput(
        region=HairRegionEnum.ROOTS,
        observed_level=UniversalLevel(7),
        existing_artificial_colour=False,
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(5),
        primary_tone=ToneFamilyEnum.NATURAL,
    )
    res = FeasibilityClassifier.classify_region(reg, target)
    assert res == ServiceClassificationEnum.DARKENING


def test_virgin_hair_same_level():
    reg = HairRegionInput(
        region=HairRegionEnum.ROOTS,
        observed_level=UniversalLevel(6),
        existing_artificial_colour=False,
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(6),
        primary_tone=ToneFamilyEnum.NATURAL,
    )
    res = FeasibilityClassifier.classify_region(reg, target)
    assert res == ServiceClassificationEnum.SAME_LEVEL_COLOURING


def test_virgin_hair_lifting_moderate():
    reg = HairRegionInput(
        region=HairRegionEnum.ROOTS,
        observed_level=UniversalLevel(5),
        existing_artificial_colour=False,
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(8),  # delta = 3
        primary_tone=ToneFamilyEnum.GOLD,
    )
    res = FeasibilityClassifier.classify_region(reg, target)
    assert res == ServiceClassificationEnum.LIFTING


def test_virgin_hair_high_lift():
    reg = HairRegionInput(
        region=HairRegionEnum.ROOTS,
        observed_level=UniversalLevel(5),
        existing_artificial_colour=False,
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(10),  # delta = 5
        primary_tone=ToneFamilyEnum.ASH,
    )
    res = FeasibilityClassifier.classify_region(reg, target)
    assert res == ServiceClassificationEnum.LIFTING


def test_virgin_hair_extreme_lift_requires_lightening():
    reg = HairRegionInput(
        region=HairRegionEnum.ROOTS,
        observed_level=UniversalLevel(2),
        existing_artificial_colour=False,
    )
    target = TargetColourInput(
        universal_level=UniversalLevel(9),  # delta = 7 (> 5)
        primary_tone=ToneFamilyEnum.PEARL,
    )
    res = FeasibilityClassifier.classify_region(reg, target)
    assert res == ServiceClassificationEnum.LIGHTENING


def test_artificial_pigment_constraint_color_does_not_lift_color():
    # If hair has existing artificial color and target is lighter:
    # Permanent color cannot lift artificial color! Must require COLOUR_REMOVAL or LIGHTENING.
    reg_minor_lift = HairRegionInput(
        region=HairRegionEnum.MID_LENGTHS,
        observed_level=UniversalLevel(5),
        existing_artificial_colour=True,  # Artificially coloured!
    )
    target_minor = TargetColourInput(
        universal_level=UniversalLevel(7),  # delta = 2
        primary_tone=ToneFamilyEnum.COPPER,
    )
    res1 = FeasibilityClassifier.classify_region(reg_minor_lift, target_minor)
    assert res1 == ServiceClassificationEnum.COLOUR_REMOVAL

    reg_major_lift = HairRegionInput(
        region=HairRegionEnum.MID_LENGTHS,
        observed_level=UniversalLevel(4),
        existing_artificial_colour=True,
    )
    target_major = TargetColourInput(
        universal_level=UniversalLevel(8),  # delta = 4
        primary_tone=ToneFamilyEnum.GOLD,
    )
    res2 = FeasibilityClassifier.classify_region(reg_major_lift, target_major)
    assert res2 == ServiceClassificationEnum.LIGHTENING


def test_multi_region_divergence_classifies_overall_as_multi_stage():
    # Roots: virgin level 4 wanting level 7 (lift)
    # Mid-lengths: artificial level 5 wanting level 7 (colour removal)
    # Ends: artificial level 5 wanting level 7 (colour removal)
    assessment = HairAssessmentInput(
        roots=HairRegionInput(
            region=HairRegionEnum.ROOTS,
            observed_level=UniversalLevel(4),
            existing_artificial_colour=False,
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
    )

    overall, per_region = FeasibilityClassifier.classify_overall(assessment, target)
    assert overall == ServiceClassificationEnum.MULTI_STAGE_PROCESS
    assert per_region[HairRegionEnum.ROOTS] == ServiceClassificationEnum.LIFTING
    assert per_region[HairRegionEnum.MID_LENGTHS] == ServiceClassificationEnum.COLOUR_REMOVAL
    assert per_region[HairRegionEnum.ENDS] == ServiceClassificationEnum.COLOUR_REMOVAL
