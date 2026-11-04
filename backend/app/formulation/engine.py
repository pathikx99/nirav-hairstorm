"""
Deterministic Formulation Engine — Version 1.0.

Translates starting hair assessment, target colour specification, and verified
manufacturer technical rules into structured, reproducible formulation plans.
Conforms strictly to Technical Specification §5.4, §5.5, §5.6, §5.7, §5.10, §5.11, §5.12.
"""

from __future__ import annotations

from decimal import Decimal

from backend.app.formulation.classifier import FeasibilityClassifier
from backend.app.formulation.enums import (
    FormulationResultStatusEnum,
    SafetyStatusEnum,
    ServiceClassificationEnum,
)
from backend.app.formulation.safety import SafetyValidationService
from backend.app.formulation.schemas import (
    DeveloperComponentFormula,
    FormulationResultResponse,
    FormulationStage,
    HairAssessmentInput,
    PredictedResult,
    ProductComponentFormula,
    RegionFormulationPlan,
    SafetyCheckResult,
    TargetColourInput,
)
from backend.app.manufacturers.enums import CatalogueStatusEnum
from backend.app.models.manufacturers import (
    CatalogueVersion,
    Developer,
    Manufacturer,
    ManufacturerShade,
    ProductLine,
    ProductRule,
)
from backend.app.universal_colour.enums import (
    ColourFamilyEnum,
    HairRegionEnum,
    ToneFamilyEnum,
    ToneIntensityEnum,
)
from backend.app.universal_colour.schemas import UHCRRecord


class FormulationEngine:
    """
    Deterministic, constraint-based formulation engine.
    """

    @classmethod
    def evaluate(
        cls,
        assessment: HairAssessmentInput,
        target: TargetColourInput,
        manufacturer: Manufacturer,
        product_lines: list[ProductLine],
        shades: list[ManufacturerShade],
        developers: list[Developer],
        rules: list[ProductRule],
        catalogue_version: CatalogueVersion,
    ) -> FormulationResultResponse:
        """
        Executes the full formulation evaluation pipeline.
        """
        missing_info: list[str] = []
        warnings: list[str] = []
        source_refs: list[str] = []

        # -------------------------------------------------------------------
        # Step 1: Input & Completeness Validation
        # -------------------------------------------------------------------
        # Principle 6: Unverified data must never generate executable formulations
        if catalogue_version.status not in (CatalogueStatusEnum.APPROVED, CatalogueStatusEnum.PUBLISHED):
            return FormulationResultResponse(
                status=FormulationResultStatusEnum.BLOCKED,
                market=assessment.market,
                manufacturer_id=manufacturer.id,
                manufacturer_name=manufacturer.name,
                catalogue_version_id=catalogue_version.id,
                assessment_id=assessment.assessment_id,
                target_colour_id=target.target_colour_id,
                service_classification=ServiceClassificationEnum.INSUFFICIENT_INFORMATION,
                stages=[],
                regions=[],
                safety_checks=[],
                warnings=[
                    f"Principle 6 Violation: Catalogue version '{catalogue_version.version}' is {catalogue_version.status.value}. Unverified catalogues cannot generate executable formulations."
                ],
                missing_information=["VerifiedCatalogue"],
            )

        if assessment.roots.observed_level is None:
            missing_info.append("Roots observed level is missing.")
        if assessment.mid_lengths.observed_level is None:
            missing_info.append("Mid-lengths observed level is missing.")
        if assessment.ends.observed_level is None:
            missing_info.append("Ends observed level is missing.")
        if target.universal_level is None:
            missing_info.append("Target universal level is missing.")

        if missing_info:
            return FormulationResultResponse(
                status=FormulationResultStatusEnum.INSUFFICIENT_INFORMATION,
                market=assessment.market,
                manufacturer_id=manufacturer.id,
                manufacturer_name=manufacturer.name,
                catalogue_version_id=catalogue_version.id,
                assessment_id=assessment.assessment_id,
                target_colour_id=target.target_colour_id,
                service_classification=ServiceClassificationEnum.INSUFFICIENT_INFORMATION,
                stages=[],
                regions=[],
                safety_checks=[],
                warnings=[
                    "Cannot formulate without complete regional starting level observations."
                ],
                missing_information=missing_info,
            )

        # -------------------------------------------------------------------
        # Step 2: Feasibility & Service Classification
        # -------------------------------------------------------------------
        overall_classification, region_classes = FeasibilityClassifier.classify_overall(
            assessment, target
        )

        # -------------------------------------------------------------------
        # Step 3: Safety & Contraindication Validation
        # -------------------------------------------------------------------
        safety_status, safety_checks, blocking_reasons = (
            SafetyValidationService.validate_assessment_and_target(
                assessment, target, overall_classification
            )
        )

        # Hard constraint: if blocked, STOP immediately. Do NOT generate executable formulas.
        if safety_status == SafetyStatusEnum.BLOCKED:
            return FormulationResultResponse(
                status=FormulationResultStatusEnum.BLOCKED,
                market=assessment.market,
                manufacturer_id=manufacturer.id,
                manufacturer_name=manufacturer.name,
                catalogue_version_id=catalogue_version.id,
                assessment_id=assessment.assessment_id,
                target_colour_id=target.target_colour_id,
                service_classification=overall_classification,
                stages=[],
                regions=[],
                safety_checks=safety_checks,
                warnings=blocking_reasons,
                missing_information=[],
            )

        # -------------------------------------------------------------------
        # Step 4: Resolve Target Shade & Pure Natural Shade
        # -------------------------------------------------------------------
        target_shade, pure_natural_shade, special_mix_shade, lightener_prod = (
            cls._resolve_products(shades, rules, target)
        )

        if target_shade is None and overall_classification not in (
            ServiceClassificationEnum.LIGHTENING,
        ):
            warnings.append(
                f"No verified shade found in {manufacturer.name} catalogue matching "
                f"Level {target.universal_level.value} {target.primary_tone.value}."
            )

        # -------------------------------------------------------------------
        # Step 5: Generate Stages and Regional Plans
        # -------------------------------------------------------------------
        stages, region_plans, shared_reg = cls._generate_stages_and_plans(
            assessment=assessment,
            target=target,
            overall_classification=overall_classification,
            region_classes=region_classes,
            manufacturer=manufacturer,
            target_shade=target_shade,
            pure_natural_shade=pure_natural_shade,
            special_mix_shade=special_mix_shade,
            lightener_prod=lightener_prod,
            developers=developers,
            rules=rules,
            catalogue_version=catalogue_version,
            safety_checks=safety_checks,
            warnings=warnings,
            source_refs=source_refs,
        )

        # Determine final status
        if (
            safety_status == SafetyStatusEnum.NEEDS_ASSESSMENT
            or any(c.status == SafetyStatusEnum.NEEDS_ASSESSMENT for c in safety_checks)
            or safety_status == SafetyStatusEnum.WARNING
        ):
            final_status = FormulationResultStatusEnum.REQUIRES_PROFESSIONAL_REVIEW
        else:
            final_status = FormulationResultStatusEnum.ELIGIBLE_FOR_REVIEW

        # Build predicted result
        predicted_result = PredictedResult(
            universal_colour=UHCRRecord(
                level=target.universal_level,
                primary_tone=target.primary_tone,
                secondary_tone=target.secondary_tone,
                tone_intensity=target.tone_intensity,
                colour_family=ColourFamilyEnum.NATURAL
                if target.primary_tone == ToneFamilyEnum.NATURAL
                else ColourFamilyEnum.FASHION,
                classification_status="PREDICTED",
                mapping_confidence=Decimal("0.90"),
            ),
            confidence="HIGH" if target_shade is not None else "MEDIUM",
        )

        return FormulationResultResponse(
            status=final_status,
            market=assessment.market,
            manufacturer_id=manufacturer.id,
            manufacturer_name=manufacturer.name,
            catalogue_version_id=catalogue_version.id,
            assessment_id=assessment.assessment_id,
            target_colour_id=target.target_colour_id,
            service_classification=overall_classification,
            stages=stages,
            regions=region_plans,
            shared_regional_formulation=shared_reg,
            safety_checks=safety_checks,
            warnings=warnings,
            missing_information=[],
            predicted_result=predicted_result,
            source_references=list(set(source_refs)),
        )

    # -----------------------------------------------------------------------
    # Helper: Product & Shade Resolution
    # -----------------------------------------------------------------------

    @classmethod
    def _resolve_products(
        cls,
        shades: list[ManufacturerShade],
        rules: list[ProductRule],
        target: TargetColourInput,
    ) -> tuple[
        ManufacturerShade | None,
        ManufacturerShade | None,
        ManufacturerShade | None,
        ManufacturerShade | None,
    ]:
        """Resolves target shade, Pure Natural shade for grey coverage, and Special Mix."""
        target_shade: ManufacturerShade | None = None
        pure_natural_shade: ManufacturerShade | None = None
        special_mix_shade: ManufacturerShade | None = None
        lightener_prod: ManufacturerShade | None = None

        target_lvl = int(target.universal_level)

        target_candidates: list[tuple[int, ManufacturerShade]] = []
        special_mix_candidates: list[tuple[int, ManufacturerShade]] = []

        for s in shades:
            # Check for lightener
            if (
                "blondor" in s.shade_name.lower() or "lighten" in s.shade_name.lower()
            ) and lightener_prod is None:
                lightener_prod = s

            if s.shade_mappings:
                m = s.shade_mappings[0]

                # Special Mix matching
                if (
                    s.shade_code.startswith("0/")
                    and s.shade_code != "0/00"
                    and m.primary_tone == target.primary_tone.value
                ):
                    sm_score = 10
                    if (
                        target.secondary_tone is not None
                        and m.secondary_tone == target.secondary_tone.value
                    ):
                        sm_score += 20
                    special_mix_candidates.append((sm_score, s))

                # Pure Natural matching
                if (
                    m.uhcr_level == target_lvl
                    and m.primary_tone == ToneFamilyEnum.NATURAL.value
                    and m.secondary_tone is None
                    and (
                        pure_natural_shade is None
                        or s.shade_code in (f"{target_lvl}/0", f"{target_lvl}.0")
                    )
                ):
                    pure_natural_shade = s

                # Target shade candidate matching
                if m.uhcr_level == target_lvl and m.primary_tone == target.primary_tone.value:
                    score = 10
                    if (target.secondary_tone is None and m.secondary_tone is None) or (
                        target.secondary_tone is not None
                        and m.secondary_tone == target.secondary_tone.value
                    ):
                        score += 20

                    # Match intensity
                    if m.tone_intensity == target.tone_intensity.value:
                        score += 15
                    # Penalize double digit depth (e.g. 77/xx) if standard intensity requested
                    if target.tone_intensity == ToneIntensityEnum.STANDARD and (
                        s.shade_code.startswith(f"{target_lvl}/")
                        or s.shade_code.startswith(f"{target_lvl}.")
                    ):
                        score += 5

                    target_candidates.append((score, s))

        if target_candidates:
            target_candidates.sort(key=lambda x: x[0], reverse=True)
            target_shade = target_candidates[0][1]

        if special_mix_candidates:
            special_mix_candidates.sort(key=lambda x: x[0], reverse=True)
            special_mix_shade = special_mix_candidates[0][1]

        # Fallback for target shade: find any shade with level matching target level and primary tone
        if target_shade is None:
            for s in shades:
                if s.shade_mappings:
                    m = s.shade_mappings[0]
                    if m.uhcr_level == target_lvl and m.primary_tone == target.primary_tone.value:
                        target_shade = s
                        break

        # Fallback for pure natural shade
        if pure_natural_shade is None:
            for s in shades:
                if s.shade_mappings:
                    m = s.shade_mappings[0]
                    if m.uhcr_level == target_lvl and (
                        m.primary_tone == ToneFamilyEnum.NATURAL.value
                        or s.shade_code.endswith("/0")
                        or s.shade_code.endswith(".0")
                    ):
                        pure_natural_shade = s
                        break

        return target_shade, pure_natural_shade, special_mix_shade, lightener_prod

    # -----------------------------------------------------------------------
    # Helper: Developer Resolution
    # -----------------------------------------------------------------------

    @classmethod
    def _resolve_developer(
        cls,
        developers: list[Developer],
        required_pct: Decimal,
        is_freelights: bool = False,
    ) -> Developer | None:
        """Finds developer matching target peroxide concentration."""
        for d in developers:
            if is_freelights:
                if "freelights" in d.product_name.lower() and abs(
                    d.concentration_percent - required_pct
                ) < Decimal("0.2"):
                    return d
            else:
                if "freelights" not in d.product_name.lower() and abs(
                    d.concentration_percent - required_pct
                ) < Decimal("0.2"):
                    return d
        # fallback to any developer close to required percentage
        for d in developers:
            if abs(d.concentration_percent - required_pct) < Decimal("0.2"):
                return d
        return None

    # -----------------------------------------------------------------------
    # Helper: Stage & Plan Generation
    # -----------------------------------------------------------------------

    @classmethod
    def _generate_stages_and_plans(
        cls,
        assessment: HairAssessmentInput,
        target: TargetColourInput,
        overall_classification: ServiceClassificationEnum,
        region_classes: dict[HairRegionEnum, ServiceClassificationEnum],
        manufacturer: Manufacturer,
        target_shade: ManufacturerShade | None,
        pure_natural_shade: ManufacturerShade | None,
        special_mix_shade: ManufacturerShade | None,
        lightener_prod: ManufacturerShade | None,
        developers: list[Developer],
        rules: list[ProductRule],
        catalogue_version: CatalogueVersion,
        safety_checks: list[SafetyCheckResult],
        warnings: list[str],
        source_refs: list[str],
    ) -> tuple[list[FormulationStage], list[RegionFormulationPlan], bool]:
        """Builds ordered stages and per-region plans."""
        stages: list[FormulationStage] = []
        region_plans: list[RegionFormulationPlan] = []

        is_wella = "wella" in manufacturer.name.lower()
        "l'oréal" in manufacturer.name.lower() or "loreal" in manufacturer.name.lower()

        # Check if conditions across regions differ
        roots = assessment.roots
        mid = assessment.mid_lengths
        ends = assessment.ends

        conditions_uniform = (
            roots.observed_level == mid.observed_level == ends.observed_level
            and roots.existing_artificial_colour
            == mid.existing_artificial_colour
            == ends.existing_artificial_colour
            and roots.grey_percentage == mid.grey_percentage == ends.grey_percentage
            and roots.condition == mid.condition == ends.condition
            and roots.porosity == mid.porosity == ends.porosity
        )

        target_lvl = int(target.universal_level)
        roots_lvl = int(roots.observed_level)
        roots_delta = target_lvl - roots_lvl

        # -------------------------------------------------------------------
        # Multi-Stage: Pre-lightening required
        # (e.g. artificial color lift, or delta > 5 on virgin hair)
        # -------------------------------------------------------------------
        if overall_classification in (
            ServiceClassificationEnum.MULTI_STAGE_PROCESS,
            ServiceClassificationEnum.LIGHTENING,
            ServiceClassificationEnum.COLOUR_REMOVAL,
        ) and (any(r.existing_artificial_colour for r in (roots, mid, ends)) or roots_delta > 3):
            # Stage 1: Lightening / Cleansing
            dev_6 = cls._resolve_developer(developers, Decimal("6.0"))
            dev_comp_1 = DeveloperComponentFormula(
                developer_id=dev_6.id if dev_6 else None,
                developer_name=dev_6.product_name if dev_6 else "6% (20 Vol) Developer",
                concentration_percent=Decimal("6.0"),
                volume_in_vol=20,
                parts=Decimal("1.5"),
                weight_grams=Decimal("45.0"),
            )
            lightener_comp = ProductComponentFormula(
                product_type="LIGHTENER",
                product_id=lightener_prod.product_id if lightener_prod else None,
                product_name=lightener_prod.shade_name
                if lightener_prod
                else "Blondor Multi-Blonde Powder",
                shade_id=lightener_prod.id if lightener_prod else None,
                shade_code=lightener_prod.shade_code if lightener_prod else "BLONDOR-MBP",
                shade_name=lightener_prod.shade_name if lightener_prod else "Multi-Blonde Powder",
                parts=Decimal("1.0"),
                weight_grams=Decimal("30.0"),
            )

            stage_1 = FormulationStage(
                stage_number=1,
                service_type=ServiceClassificationEnum.LIGHTENING,
                stage_description="Stage 1: Pre-lightening / Cleansing to expose target depth level.",
                target_regions=[
                    HairRegionEnum.ROOTS,
                    HairRegionEnum.MID_LENGTHS,
                    HairRegionEnum.ENDS,
                ],
                products=[lightener_comp],
                developer=dev_comp_1,
                mixing_ratio_text="1:1.5",
                development_time_minutes=40,
                development_time_range="Up to 50 min (visual control)",
                heat_permitted=False,
                application_instructions=(
                    "Apply to mid-lengths and ends first if artificial colour is present. "
                    "Process under visual inspection. Apply to regrowth roots once mid-lengths reach half-target lift. "
                    "Rinse thoroughly, do not shampoo aggressively."
                ),
                rules_applied=["WELLA-BLONDOR-POWDER-MIX", "WELLA-BLONDOR-SCALP-SAFETY"],
                source_document_references=["Blondor Technical Folder"],
            )
            stages.append(stage_1)
            source_refs.append("Blondor Technical Folder Page 7, 10, 14")

            # Stage 2: Toning & Depositing
            dev_toning = cls._resolve_developer(
                developers, Decimal("1.9")
            ) or cls._resolve_developer(developers, Decimal("4.0"))
            dev_pct_2 = dev_toning.concentration_percent if dev_toning else Decimal("1.9")
            dev_comp_2 = DeveloperComponentFormula(
                developer_id=dev_toning.id if dev_toning else None,
                developer_name=dev_toning.product_name
                if dev_toning
                else "Welloxon Perfect 1.9% (6 Vol)",
                concentration_percent=dev_pct_2,
                volume_in_vol=6 if dev_pct_2 < Decimal("3.0") else 13,
                parts=Decimal("2.0"),
                weight_grams=Decimal("60.0"),
            )

            shade_comp_2 = ProductComponentFormula(
                product_type="SHADE",
                product_id=target_shade.product_id if target_shade else None,
                product_name=target_shade.shade_name
                if target_shade
                else f"Level {target_lvl} {target.primary_tone.value}",
                shade_id=target_shade.id if target_shade else None,
                shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                shade_name=target_shade.shade_name if target_shade else "Target Fashion Shade",
                parts=Decimal("1.0"),
                weight_grams=Decimal("30.0"),
            )

            stage_2 = FormulationStage(
                stage_number=2,
                service_type=ServiceClassificationEnum.TONING,
                stage_description="Stage 2: Tonal Glazing & Neutralisation on pre-lightened hair.",
                target_regions=[
                    HairRegionEnum.ROOTS,
                    HairRegionEnum.MID_LENGTHS,
                    HairRegionEnum.ENDS,
                ],
                products=[shade_comp_2],
                developer=dev_comp_2,
                mixing_ratio_text="1:2",
                development_time_minutes=20,
                development_time_range="15–20 min without heat",
                heat_permitted=False,
                application_instructions=(
                    "Apply evenly from roots to ends on towel-dried, pre-lightened hair. "
                    "Process for 15–20 minutes without heat until desired tone refinement is achieved. Emulsify and rinse."
                ),
                rules_applied=["WELLA-KP-PASTEL-TONING"],
                source_document_references=["Koleston Perfect Usage Guidelines Page 3"],
            )
            stages.append(stage_2)
            source_refs.append("Koleston Perfect Usage Guidelines Page 3 - Pastel Toning")

            # Region plans
            for reg in (roots, mid, ends):
                region_plans.append(
                    RegionFormulationPlan(
                        region=reg.region,
                        initial_level=int(reg.observed_level),
                        target_level=target_lvl,
                        level_delta=target_lvl - int(reg.observed_level),
                        service_classification=region_classes[reg.region],
                        stages=[stage_1, stage_2],
                        grey_coverage_notes=None,
                        special_mix_notes="Glaze tone applied across pre-lightened base.",
                    )
                )

            return stages, region_plans, False

        # -------------------------------------------------------------------
        # Single-Stage / Standard Oxidative Colouring
        # -------------------------------------------------------------------
        # Calculate developer strength based on roots lift
        req_dev_pct = Decimal("6.0")
        dev_vol = 20
        rule_code = "WELLA-KP-DEV-LIFT-STANDARD" if is_wella else "LOREAL-MAJIREL-DEV-LIFT"

        if roots_delta <= 1:
            req_dev_pct = Decimal("6.0")
            dev_vol = 20
        elif roots_delta == 2:
            req_dev_pct = Decimal("9.0")
            dev_vol = 30
        elif roots_delta == 3:
            req_dev_pct = Decimal("12.0")
            dev_vol = 40
        elif 4 <= roots_delta <= 5:
            # Special Blonde
            req_dev_pct = Decimal("12.0")
            dev_vol = 40
            rule_code = "WELLA-KP-DEV-LIFT-SPECIAL-BLONDE"

        resolved_dev = cls._resolve_developer(developers, req_dev_pct)
        ratio_parts = Decimal("1.0") if is_wella else Decimal("1.5")
        if "SPECIAL_BLONDE" in rule_code:
            ratio_parts = Decimal("2.0")

        dev_formula = DeveloperComponentFormula(
            developer_id=resolved_dev.id if resolved_dev else None,
            developer_name=resolved_dev.product_name
            if resolved_dev
            else f"{req_dev_pct}% ({dev_vol} Vol) Developer",
            concentration_percent=req_dev_pct,
            volume_in_vol=dev_vol,
            parts=ratio_parts,
            weight_grams=Decimal("60.0") * ratio_parts,
        )

        # Build product components
        products: list[ProductComponentFormula] = []
        grey_pct = float(roots.grey_percentage)
        grey_notes: str | None = None

        # Check grey coverage rules
        if grey_pct >= 50.0 and pure_natural_shade is not None:
            # 50-100% white hair: 1:1 Pure Natural : Fashion Shade
            grey_notes = (
                f"White hair percentage is {grey_pct:.0f}%. Added 1/2 Pure Naturals ({pure_natural_shade.shade_code}) "
                "to ensure complete 100% opaque grey coverage."
            )
            products.append(
                ProductComponentFormula(
                    product_type="PURE_NATURAL",
                    product_id=pure_natural_shade.product_id,
                    product_name=pure_natural_shade.shade_name,
                    shade_id=pure_natural_shade.id,
                    shade_code=pure_natural_shade.shade_code,
                    shade_name=pure_natural_shade.shade_name,
                    parts=Decimal("0.5"),
                    weight_grams=Decimal("30.0"),
                    is_pure_natural=True,
                    notes="Pure Natural base for grey coverage.",
                )
            )
            products.append(
                ProductComponentFormula(
                    product_type="SHADE",
                    product_id=target_shade.product_id if target_shade else None,
                    product_name=target_shade.shade_name if target_shade else "Target Shade",
                    shade_id=target_shade.id if target_shade else None,
                    shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                    shade_name=target_shade.shade_name if target_shade else "Fashion Shade",
                    parts=Decimal("0.5"),
                    weight_grams=Decimal("30.0"),
                    notes="Fashion reflect component.",
                )
            )
            source_refs.append("Koleston Perfect Usage Guidelines Page 2 - Coloring grey hair")
        elif grey_pct >= 30.0 and pure_natural_shade is not None:
            # 30-50% white hair: 1/3 Pure Natural : 2/3 Fashion Shade
            grey_notes = (
                f"White hair percentage is {grey_pct:.0f}%. Added 1/3 Pure Naturals ({pure_natural_shade.shade_code}) "
                "for reliable grey blending."
            )
            products.append(
                ProductComponentFormula(
                    product_type="PURE_NATURAL",
                    product_id=pure_natural_shade.product_id,
                    product_name=pure_natural_shade.shade_name,
                    shade_id=pure_natural_shade.id,
                    shade_code=pure_natural_shade.shade_code,
                    shade_name=pure_natural_shade.shade_name,
                    parts=Decimal("0.33"),
                    weight_grams=Decimal("20.0"),
                    is_pure_natural=True,
                    notes="Pure Natural component for grey blending.",
                )
            )
            products.append(
                ProductComponentFormula(
                    product_type="SHADE",
                    product_id=target_shade.product_id if target_shade else None,
                    product_name=target_shade.shade_name if target_shade else "Target Shade",
                    shade_id=target_shade.id if target_shade else None,
                    shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                    shade_name=target_shade.shade_name if target_shade else "Fashion Shade",
                    parts=Decimal("0.67"),
                    weight_grams=Decimal("40.0"),
                    notes="Fashion reflect component.",
                )
            )
            source_refs.append("Koleston Perfect Usage Guidelines Page 2 - Coloring grey hair")
        else:
            # <30% grey: Full fashion shade
            products.append(
                ProductComponentFormula(
                    product_type="SHADE",
                    product_id=target_shade.product_id if target_shade else None,
                    product_name=target_shade.shade_name if target_shade else "Target Shade",
                    shade_id=target_shade.id if target_shade else None,
                    shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                    shade_name=target_shade.shade_name if target_shade else "Target Shade",
                    parts=Decimal("1.0"),
                    weight_grams=Decimal("60.0"),
                )
            )

        # Check Special Mix (Rule of 12)
        special_mix_notes: str | None = None
        if (
            is_wella
            and special_mix_shade is not None
            and target.primary_tone
            in (
                ToneFamilyEnum.ASH,
                ToneFamilyEnum.VIOLET,
                ToneFamilyEnum.COPPER,
                ToneFamilyEnum.RED,
            )
        ):
            # Rule of 12: (12 - Level) cm per 30g base
            ribbon_cm = Decimal(12 - target_lvl)
            if ribbon_cm > 0:
                weight_g = ribbon_cm * Decimal("0.5")  # 2cm = 1g
                special_mix_notes = (
                    f"Wella Rule of 12: Add {ribbon_cm} cm ({weight_g}g) of Special Mix {special_mix_shade.shade_code} "
                    f"to intensify or control tonal reflect."
                )
                products.append(
                    ProductComponentFormula(
                        product_type="SPECIAL_MIX",
                        product_id=special_mix_shade.product_id,
                        product_name=special_mix_shade.shade_name,
                        shade_id=special_mix_shade.id,
                        shade_code=special_mix_shade.shade_code,
                        shade_name=special_mix_shade.shade_name,
                        parts=Decimal("0.05"),
                        weight_grams=weight_g,
                        length_cm=ribbon_cm,
                        notes=f"Rule of 12 tonal booster: {ribbon_cm} cm.",
                    )
                )
                source_refs.append("Koleston Perfect Usage Guidelines Page 3 - Special Mix")

        # Mixing ratio and dev time
        mix_ratio = "1:1" if is_wella else "1:1.5"
        if "SPECIAL_BLONDE" in rule_code:
            mix_ratio = "1:2"
            dev_time = 50
            dev_time_range = "50–60 min without heat"
        else:
            dev_time = 35
            dev_time_range = "30–40 min without heat"

        # Check if verified product rules specify custom development time or mixing ratio
        for r in rules:
            actions = r.actions if hasattr(r, "actions") and isinstance(r.actions, dict) else {}
            if "development_time_minutes" in actions:
                dev_time = int(actions["development_time_minutes"])
                dev_time_range = f"{dev_time} min without heat"
            if "mixing_ratio" in actions and isinstance(actions["mixing_ratio"], str):
                mix_ratio = actions["mixing_ratio"]

        stage_single = FormulationStage(
            stage_number=1,
            service_type=overall_classification,
            stage_description=f"Stage 1: {overall_classification.value} application.",
            target_regions=[HairRegionEnum.ROOTS, HairRegionEnum.MID_LENGTHS, HairRegionEnum.ENDS],
            products=products,
            developer=dev_formula,
            mixing_ratio_text=mix_ratio,
            development_time_minutes=dev_time,
            development_time_range=dev_time_range,
            heat_permitted=False,
            application_instructions=(
                "Apply mixture systematically to regrowth / roots first. "
                "If refreshing mid-lengths and ends, emulsify through mid-lengths and ends during the final 10–15 minutes."
            ),
            rules_applied=[
                rule_code,
                "WELLA-KP-MIX-STANDARD" if is_wella else "LOREAL-MAJIREL-MIX",
            ],
            source_document_references=[
                "Koleston Perfect Usage Guidelines" if is_wella else "Majirel Technical Manual"
            ],
        )
        stages.append(stage_single)
        source_refs.append(
            "Koleston Perfect Usage Guidelines Page 2" if is_wella else "Majirel Technical Dossier"
        )

        # Build region plans
        for reg in (roots, mid, ends):
            region_plans.append(
                RegionFormulationPlan(
                    region=reg.region,
                    initial_level=int(reg.observed_level),
                    target_level=target_lvl,
                    level_delta=target_lvl - int(reg.observed_level),
                    service_classification=region_classes[reg.region],
                    stages=[stage_single],
                    grey_coverage_notes=grey_notes if reg.region == HairRegionEnum.ROOTS else None,
                    special_mix_notes=special_mix_notes,
                )
            )

        return stages, region_plans, conditions_uniform
