"""
Hair Analysis & Feasibility Classifier — Version 1.0.

Classifies the formulation service type per region and for the overall process,
strictly obeying the foundational chemical constraint:
'Color does not lift color' (permanent tint cannot lift existing artificial dye).
Conforms to Technical Specification §5.3.
"""

from __future__ import annotations

from backend.app.formulation.enums import ServiceClassificationEnum
from backend.app.formulation.schemas import (
    HairAssessmentInput,
    HairRegionInput,
    TargetColourInput,
)
from backend.app.universal_colour.enums import HairRegionEnum


class FeasibilityClassifier:
    """
    Deterministic feasibility and service classifier.

    Evaluates depth deltas, artificial pigment barriers, cuticle porosity,
    and regional divergence to assign valid service classifications.
    """

    @classmethod
    def classify_region(
        cls,
        region: HairRegionInput,
        target: TargetColourInput,
    ) -> ServiceClassificationEnum:
        """
        Classifies the required service for a single hair region.
        """
        if region.observed_level is None or target.universal_level is None:
            return ServiceClassificationEnum.INSUFFICIENT_INFORMATION

        start_level = int(region.observed_level)
        target_level = int(target.universal_level)
        delta_l = target_level - start_level

        # Case 1: Region contains existing artificial pigment
        if region.existing_artificial_colour:
            if delta_l > 0:
                # Tint cannot lift tint. Lightening or colour removal is mandatory.
                if delta_l >= 3:
                    return ServiceClassificationEnum.LIGHTENING
                return ServiceClassificationEnum.COLOUR_REMOVAL

            if delta_l == 0:
                # Same level over artificial color: toning, neutralisation, or deposit
                if region.observed_undertone and region.observed_undertone != target.primary_tone:
                    return ServiceClassificationEnum.NEUTRALISATION
                return ServiceClassificationEnum.TONING

            # delta_l < 0: darkening artificial hair
            return ServiceClassificationEnum.DARKENING

        # Case 2: Virgin / uncoloured hair
        if delta_l < 0:
            return ServiceClassificationEnum.DARKENING

        if delta_l == 0:
            if region.grey_percentage >= 30:
                return ServiceClassificationEnum.SAME_LEVEL_COLOURING
            if region.observed_undertone and region.observed_undertone != target.primary_tone:
                return ServiceClassificationEnum.NEUTRALISATION
            return ServiceClassificationEnum.SAME_LEVEL_COLOURING

        # delta_l > 0 on virgin hair: natural lift
        if delta_l <= 3:
            return ServiceClassificationEnum.LIFTING

        if delta_l <= 5:
            # 4-5 levels of lift on virgin hair achievable with high-lift / Special Blonde
            return ServiceClassificationEnum.LIFTING

        # delta_l > 5: beyond permanent high-lift capability -> requires bleach/lightener
        return ServiceClassificationEnum.LIGHTENING

    @classmethod
    def classify_overall(
        cls,
        assessment: HairAssessmentInput,
        target: TargetColourInput,
    ) -> tuple[ServiceClassificationEnum, dict[HairRegionEnum, ServiceClassificationEnum]]:
        """
        Classifies all regions and determines overall service classification.

        If regions require materially different chemical approaches (e.g., natural roots
        requiring lift, coloured ends requiring deposit or colour removal), the overall
        service is classified as MULTI_STAGE_PROCESS.
        """
        region_classifications = {
            HairRegionEnum.ROOTS: cls.classify_region(assessment.roots, target),
            HairRegionEnum.MID_LENGTHS: cls.classify_region(assessment.mid_lengths, target),
            HairRegionEnum.ENDS: cls.classify_region(assessment.ends, target),
        }

        # Check for insufficient information
        if any(
            c == ServiceClassificationEnum.INSUFFICIENT_INFORMATION
            for c in region_classifications.values()
        ):
            return ServiceClassificationEnum.INSUFFICIENT_INFORMATION, region_classifications

        distinct_classes = set(region_classifications.values())

        # If any region requires bleaching/colour removal, or if regions have different needs
        needs_lightening_or_removal = any(
            c in (ServiceClassificationEnum.LIGHTENING, ServiceClassificationEnum.COLOUR_REMOVAL)
            for c in distinct_classes
        )

        roots_class = region_classifications[HairRegionEnum.ROOTS]
        lengths_class = region_classifications[HairRegionEnum.MID_LENGTHS]
        ends_class = region_classifications[HairRegionEnum.ENDS]

        # Case: Pre-lightening needed followed by toning/colouring -> MULTI_STAGE_PROCESS
        if needs_lightening_or_removal:
            return ServiceClassificationEnum.MULTI_STAGE_PROCESS, region_classifications

        # Case: Divergent regional needs (e.g., roots lift while ends darken or tone)
        if roots_class != lengths_class or lengths_class != ends_class:
            return ServiceClassificationEnum.MULTI_STAGE_PROCESS, region_classifications

        # If all regions are identical
        unified_class = roots_class
        return unified_class, region_classifications
