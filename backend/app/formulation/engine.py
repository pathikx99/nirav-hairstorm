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
    HairConditionEnum,
    PorosityEnum,
    SafetyStatusEnum,
    ServiceClassificationEnum,
)
from backend.app.formulation.repigmentation import (
    build_two_step_repigmentation_stages,
    calculate_repigmentation_strategy,
    find_filler_shade,
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
        technique: str | None = None,
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
        cat_status_val = (
            catalogue_version.status.value
            if hasattr(catalogue_version.status, "value")
            else str(catalogue_version.status)
        )
        if cat_status_val not in (
            CatalogueStatusEnum.APPROVED.value,
            CatalogueStatusEnum.PUBLISHED.value,
        ):
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
                    f"Principle 6 Violation: Catalogue version '{catalogue_version.version}' is {cat_status_val}. Unverified catalogues cannot generate executable formulations."
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
        # Step 5: Natural Contributing Pigment (NRP) & Neutralization
        # -------------------------------------------------------------------
        exposed_nrp: str | None = None
        counter_toner_rec: str | None = None
        roots_delta = int(target.universal_level) - int(assessment.roots.observed_level)

        if roots_delta > 0:
            from backend.app.formulation.repigmentation import UNDERLYING_PIGMENT_MAP

            target_lvl_int = int(target.universal_level)
            nrp_entry = UNDERLYING_PIGMENT_MAP.get(target_lvl_int, {})
            warmth = nrp_entry.get("warmth_name", "WARM")
            exposed_nrp = f"Level {target_lvl_int} {warmth}"

            if target.primary_tone in (
                ToneFamilyEnum.ASH,
                ToneFamilyEnum.BLUE,
                ToneFamilyEnum.PEARL,
                ToneFamilyEnum.VIOLET,
            ):
                if "YELLOW" in warmth:
                    counter_tone = "Violet / Pearl"
                    g_amt = "2–3g"
                elif "ORANGE" in warmth:
                    counter_tone = "Blue / Ash"
                    g_amt = "3–5g"
                else:
                    counter_tone = "Green / Ash"
                    g_amt = "2–4g"
                counter_toner_rec = (
                    f"Exposed {warmth} natural undertone: add {g_amt} {counter_tone} counter-neutralizer "
                    f"per 60g formula to cancel brassiness and lock in target {target.primary_tone.value} reflect."
                )
                warnings.append(counter_toner_rec)

        # -------------------------------------------------------------------
        # Step 6: Generate Stages and Regional Plans
        # -------------------------------------------------------------------
        stages, region_plans, shared_reg = cls._generate_stages_and_plans(
            assessment=assessment,
            target=target,
            overall_classification=overall_classification,
            region_classes=region_classes,
            manufacturer=manufacturer,
            shades=shades,
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
            technique=technique,
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
            technique=technique or "ALL_OVER",
            exposed_underlying_pigment=exposed_nrp,
            counter_toner_recommendation=counter_toner_rec,
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
            s_name = (s.shade_name or "").lower()
            # Check for lightener
            if (
                "blondor" in s_name or "lighten" in s_name
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
        shades: list[ManufacturerShade],
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
        technique: str | None = None,
    ) -> tuple[list[FormulationStage], list[RegionFormulationPlan], bool]:
        """Builds ordered stages and per-region plans."""
        stages: list[FormulationStage] = []
        region_plans: list[RegionFormulationPlan] = []

        m_name_lower = manufacturer.name.lower()
        is_wella = "wella" in m_name_lower
        is_loreal = "l'oréal" in m_name_lower or "loreal" in m_name_lower
        is_schwarzkopf = "schwarzkopf" in m_name_lower
        is_alfaparf = "alfaparf" in m_name_lower
        is_proads = "proads" in m_name_lower

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
        darkening_deltas = [target_lvl - int(r.observed_level) for r in (roots, mid, ends)]
        max_darkening_delta = min(darkening_deltas)

        stage_counter = 1

        # -------------------------------------------------------------------
        # Pre-Stage: Hard Water & Heavy Metal Chelation Pre-Treatment
        # -------------------------------------------------------------------
        has_hard_water = assessment.history.has_hard_water or any(
            "hard water" in s.lower() or "well water" in s.lower() or "borewell" in s.lower()
            for s in assessment.history.previous_chemical_services
        )
        if has_hard_water:
            chelation_stage = FormulationStage(
                stage_number=stage_counter,
                service_type=ServiceClassificationEnum.DEPOSIT,
                stage_description=f"Stage {stage_counter}: Metal Detox & Heavy Metal Chelation Pre-Treatment.",
                target_regions=[HairRegionEnum.ROOTS, HairRegionEnum.MID_LENGTHS, HairRegionEnum.ENDS],
                products=[
                    ProductComponentFormula(
                        product_type="CHELATING_TREATMENT",
                        product_name="Metal Detox Pre-Treatment Spray"
                        if is_loreal
                        else "Wella Invigo Aqua Pure Chelating Treatment",
                        shade_code="CHELATING-PREP",
                        shade_name="Metal Detox Pre-Treatment Spray"
                        if is_loreal
                        else "Wella Invigo Aqua Pure Chelating Treatment",
                        parts=Decimal("1.0"),
                        weight_grams=Decimal("20.0"),
                        notes="Chelating pre-treatment to neutralize copper and mineral deposits prior to chemical oxidation.",
                    )
                ],
                developer=None,
                mixing_ratio_text="Ready-to-use spray",
                development_time_minutes=10,
                development_time_range="5–10 min without heat",
                heat_permitted=False,
                application_instructions=(
                    "Spray evenly from roots to ends on dry hair prior to service. "
                    "Comb through for uniform saturation. Air-dry or towel-blot excess. Do not rinse."
                ),
                rules_applied=["HARD-WATER-METAL-DETOX-PROTOCOL"],
                source_document_references=["Salon Hard Water & Heavy Metal Safety Guidelines"],
            )
            stages.append(chelation_stage)
            stage_counter += 1
            source_refs.append("Salon Hard Water & Heavy Metal Safety Guidelines")

        # -------------------------------------------------------------------
        # Multi-Stage: Pre-lightening required
        # (e.g. artificial color lift where target > observed, or virgin lift delta > 3)
        # -------------------------------------------------------------------
        artificial_needs_lift = any(
            r.existing_artificial_colour and (target_lvl > int(r.observed_level))
            for r in (roots, mid, ends)
        )
        if (
            overall_classification
            in (
                ServiceClassificationEnum.MULTI_STAGE_PROCESS,
                ServiceClassificationEnum.LIGHTENING,
                ServiceClassificationEnum.COLOUR_REMOVAL,
            )
            and (artificial_needs_lift or roots_delta > 3)
            and (roots_delta > 0 or artificial_needs_lift)
        ):
            # Stage 1 (or 2 if hard water): Lightening / Cleansing
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
                stage_number=stage_counter,
                service_type=ServiceClassificationEnum.LIGHTENING,
                stage_description=f"Stage {stage_counter}: Pre-lightening / Cleansing to expose target depth level.",
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
            stage_counter += 1
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

            stage_2_products = [shade_comp_2]
            stage_2_special_mix_notes = None
            if (
                is_wella
                and special_mix_shade is not None
                and target.primary_tone in (ToneFamilyEnum.ASH, ToneFamilyEnum.VIOLET, ToneFamilyEnum.PEARL)
            ):
                ribbon_cm = Decimal(12 - target_lvl)
                if ribbon_cm > 0:
                    weight_g = ribbon_cm * Decimal("0.5")
                    stage_2_special_mix_notes = (
                        f"Wella Rule of 12 Post-Bleach Neutralization: Add {ribbon_cm} cm ({weight_g}g) of Special Mix {special_mix_shade.shade_code} "
                        "to counteract raw underlying yellow/orange exposed during Stage 1 pre-lightening."
                    )
                    stage_2_products.append(
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
                            notes=f"Rule of 12 counter-neutralizing booster: {ribbon_cm} cm.",
                        )
                    )

            toning_instructions = (
                "Apply evenly from roots to ends on towel-dried, pre-lightened hair. "
                "Process for 15–20 minutes without heat until desired tone refinement is achieved. Emulsify and rinse."
            )
            if target.primary_tone in (ToneFamilyEnum.GOLD, ToneFamilyEnum.COPPER) and any(
                r.existing_artificial_colour for r in (roots, mid, ends)
            ):
                toning_instructions = (
                    "Apply evenly from roots to ends on towel-dried, pre-lightened hair. "
                    "Note: Underlying raw warmth was exposed during Stage 1 pre-lightening. If residual orange exceeds "
                    f"Level {target_lvl}, blend with 10–15% ash/cool nuance (e.g. 7/1 or 7/13) to achieve honey caramel rather than brassy orange. "
                    "Process for 15–20 minutes without heat under visual control. Emulsify and rinse."
                )

            stage_2 = FormulationStage(
                stage_number=stage_counter,
                service_type=ServiceClassificationEnum.TONING,
                stage_description=f"Stage {stage_counter}: Tonal Glazing & Neutralisation on pre-lightened hair.",
                target_regions=[
                    HairRegionEnum.ROOTS,
                    HairRegionEnum.MID_LENGTHS,
                    HairRegionEnum.ENDS,
                ],
                products=stage_2_products,
                developer=dev_comp_2,
                mixing_ratio_text="1:2",
                development_time_minutes=20,
                development_time_range="15–20 min without heat",
                heat_permitted=False,
                application_instructions=toning_instructions,
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
                        stages=stages,
                        grey_coverage_notes=None,
                        special_mix_notes="Glaze tone applied across pre-lightened base.",
                    )
                )

            return stages, region_plans, False

        # -------------------------------------------------------------------
        # Multi-Stage Repigmentation (Darkening by >= 4 levels)
        # -------------------------------------------------------------------
        if max_darkening_delta <= -4:
            darkening_start_lvl = max(int(r.observed_level) for r in (roots, mid, ends))
            repig_strat = calculate_repigmentation_strategy(darkening_start_lvl, target_lvl, is_porous=True)
            filler_shade = find_filler_shade(
                shades, target_lvl, repig_strat["filler_tone"], manufacturer.name
            )
            is_porous_overall = any(
                r.porosity in (PorosityEnum.HIGH, PorosityEnum.EXTREME) for r in (roots, mid, ends)
            )
            s1, s2 = build_two_step_repigmentation_stages(
                start_level=darkening_start_lvl,
                target_level=target_lvl,
                target_shade=target_shade,
                filler_shade=filler_shade,
                pure_natural_shade=pure_natural_shade,
                developers=developers,
                target_regions=[
                    HairRegionEnum.ROOTS,
                    HairRegionEnum.MID_LENGTHS,
                    HairRegionEnum.ENDS,
                ],
                manufacturer=manufacturer,
                is_porous=is_porous_overall,
            )
            # Re-number stages based on stage_counter
            s1 = s1.model_copy(
                update={
                    "stage_number": stage_counter,
                    "stage_description": f"Stage {stage_counter}: Pre-Pigmentation / Repigmentation Warm Filler.",
                }
            )
            stage_counter += 1
            s2 = s2.model_copy(
                update={
                    "stage_number": stage_counter,
                    "stage_description": f"Stage {stage_counter}: Target Deposit & Depth Lock application.",
                }
            )
            stage_counter += 1
            stages.extend([s1, s2])
            source_refs.append("Professional Colour Tint-Back & Filler Guidelines")

            repig_note = repig_strat["rationale"]
            porosity_comp = None
            if is_porous_overall:
                porosity_comp = (
                    "High porosity detected. Developer limited to 1.9%/3% with reduced processing time on ends. "
                    "Apply porosity equalising spray before filler application."
                )

            for reg in (roots, mid, ends):
                region_plans.append(
                    RegionFormulationPlan(
                        region=reg.region,
                        initial_level=int(reg.observed_level),
                        target_level=target_lvl,
                        level_delta=target_lvl - int(reg.observed_level),
                        service_classification=region_classes[reg.region],
                        stages=stages,
                        grey_coverage_notes=None,
                        special_mix_notes=None,
                        repigmentation_notes=repig_note,
                        porosity_compensation_notes=porosity_comp,
                    )
                )

            return stages, region_plans, conditions_uniform

        # -------------------------------------------------------------------
        # Single-Stage / Standard Oxidative Colouring (incl. Lift & Mild Darkening)
        # -------------------------------------------------------------------
        # Calculate developer strength based on roots lift
        req_dev_pct = Decimal("6.0")
        dev_vol = 20
        rule_code = "WELLA-KP-DEV-LIFT-STANDARD" if is_wella else "LOREAL-MAJIREL-DEV-LIFT"

        # Developer selection
        if roots_delta <= 0:
            # Deposit / darkening: gentle developer
            req_dev_pct = Decimal("6.0")
            dev_vol = 20
        elif roots_delta == 1:
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

        # Grey hair & on-scalp developer safety capping
        grey_pct = float(roots.grey_percentage)
        if grey_pct >= 50.0:
            # Unpigmented grey hair has no melanin to lift; 20V (6%) is standard to ensure proper dye oxidation & prevent hot roots / scalp burns
            req_dev_pct = Decimal("6.0")
            dev_vol = 20
            rule_code = "GREY-COVERAGE-20V-STANDARD"
        elif grey_pct >= 30.0 and dev_vol > 30:
            # 30-50% grey: cap at 30 Vol to prevent hot roots on unpigmented hair
            req_dev_pct = Decimal("9.0")
            dev_vol = 30
            rule_code = "GREY-COVERAGE-30V-CAP"
        elif roots.is_on_scalp and dev_vol > 30 and "SPECIAL_BLONDE" not in rule_code:
            # Standard on-scalp tint should never exceed 30V to prevent chemical scalp irritation
            req_dev_pct = Decimal("9.0")
            dev_vol = 30
            rule_code = "ON-SCALP-30V-CAP"

        # Fine hair texture / high porosity safety calibration: cap on-scalp developer to 20V
        is_fine_or_fragile = (
            getattr(assessment.history, "hair_texture", "MEDIUM").upper() in ("FINE", "THIN")
            or roots.porosity in (PorosityEnum.HIGH, PorosityEnum.EXTREME)
        )
        if is_fine_or_fragile and dev_vol > 20 and roots.is_on_scalp and "SPECIAL_BLONDE" not in rule_code:
            req_dev_pct = Decimal("6.0")
            dev_vol = 20
            rule_code = "FINE-FRAGILE-20V-CAP"

        resolved_dev = cls._resolve_developer(developers, req_dev_pct)

        is_highlift_shade = (
            "SPECIAL_BLONDE" in rule_code
            or (target_shade and any(target_shade.shade_code.startswith(pre) for pre in ("12/", "11.", "12-", "10-", "11-", "13.")))
            or (target_shade and any(p in (target_shade.shade_name or "").lower() for p in ("highlift", "superlift", "platinum", "special blonde")))
        )
        if is_highlift_shade:
            ratio_parts = Decimal("2.0")
        elif is_wella or is_schwarzkopf or is_proads:
            ratio_parts = Decimal("1.0")
        else:
            ratio_parts = Decimal("1.5")

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
        repig_notes_single: str | None = None

        # Check Repigmentation for -2 or -3 levels darkening
        if max_darkening_delta == -3:
            # Delta = -3 levels: 1/3 Copper/Gold priming filler
            copper_filler = find_filler_shade(
                shades, target_lvl, ToneFamilyEnum.COPPER, manufacturer.name
            )
            filler_code = (
                copper_filler.shade_code
                if copper_filler
                else (f"{target_lvl+1}/43" if is_wella else f"{target_lvl+1}.4")
            )
            filler_name = (
                copper_filler.shade_name
                if copper_filler
                else f"Level {target_lvl+1} Copper Priming Filler"
            )

            repig_notes_single = (
                f"Darkening by 3 levels (Level {roots_lvl} to Level {target_lvl}): Added 1/3 Copper priming filler "
                f"({filler_code}) to formula to reconstruct lost warm pheomelanin foundation."
            )
            products.append(
                ProductComponentFormula(
                    product_type="FILLER",
                    product_id=copper_filler.product_id if copper_filler else None,
                    product_name=filler_name,
                    shade_id=copper_filler.id if copper_filler else None,
                    shade_code=filler_code,
                    shade_name=filler_name,
                    parts=Decimal("0.33"),
                    weight_grams=Decimal("20.0"),
                    notes="Copper priming filler to replenish missing underlying warmth.",
                )
            )
            products.append(
                ProductComponentFormula(
                    product_type="SHADE",
                    product_id=target_shade.product_id if target_shade else None,
                    product_name=target_shade.shade_name if target_shade else "Target Shade",
                    shade_id=target_shade.id if target_shade else None,
                    shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                    shade_name=target_shade.shade_name if target_shade else "Target Shade",
                    parts=Decimal("0.67"),
                    weight_grams=Decimal("40.0"),
                    notes="Target fashion reflect.",
                )
            )
            source_refs.append("Professional Colour Tint-Back & Filler Guidelines")

        elif max_darkening_delta == -2:
            # Delta = -2 levels: 25% Gold warm base addition
            gold_filler = find_filler_shade(
                shades, target_lvl, ToneFamilyEnum.GOLD, manufacturer.name
            )
            filler_code = (
                gold_filler.shade_code
                if gold_filler
                else (f"{target_lvl}/3" if is_wella else f"{target_lvl}.3")
            )
            filler_name = (
                gold_filler.shade_name
                if gold_filler
                else f"Level {target_lvl} Warm Gold Priming Base"
            )

            repig_notes_single = (
                f"Darkening by 2 levels (Level {roots_lvl} to Level {target_lvl}): Added 25% Gold warm tone "
                f"({filler_code}) to formula to replace missing underlying warmth and avoid hollow/khaki cast."
            )
            products.append(
                ProductComponentFormula(
                    product_type="FILLER",
                    product_id=gold_filler.product_id if gold_filler else None,
                    product_name=filler_name,
                    shade_id=gold_filler.id if gold_filler else None,
                    shade_code=filler_code,
                    shade_name=filler_name,
                    parts=Decimal("0.25"),
                    weight_grams=Decimal("15.0"),
                    notes="Warm Gold priming base to prevent hollow tone.",
                )
            )
            products.append(
                ProductComponentFormula(
                    product_type="SHADE",
                    product_id=target_shade.product_id if target_shade else None,
                    product_name=target_shade.shade_name if target_shade else "Target Shade",
                    shade_id=target_shade.id if target_shade else None,
                    shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                    shade_name=target_shade.shade_name if target_shade else "Target Shade",
                    parts=Decimal("0.75"),
                    weight_grams=Decimal("45.0"),
                    notes="Target fashion reflect.",
                )
            )
            source_refs.append("Professional Colour Tint-Back & Filler Guidelines")

        # Standard grey coverage check
        elif grey_pct >= 50.0 and pure_natural_shade is not None:
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
            # <30% grey and no repigmentation: Full fashion shade
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
        if is_highlift_shade:
            mix_ratio = "1:2"
            dev_time = 55 if is_alfaparf else 50
            dev_time_range = f"{dev_time} min without heat"
        elif is_wella or is_schwarzkopf or is_proads:
            mix_ratio = "1:1"
            dev_time = 40 if is_proads else 35
            dev_time_range = f"{dev_time - 5}–{dev_time} min without heat"
        else:
            mix_ratio = "1:1.5"
            dev_time = 35
            dev_time_range = "35 min without heat"

        # Indian Hair Phenotype Model & Coarse Texture Adjustment
        is_coarse = (
            getattr(assessment.history, "hair_texture", "MEDIUM").upper()
            in ("COARSE", "RESISTANT", "COARSE_RESISTANT")
        )
        is_indian_deep = (
            assessment.market == "IN" and any(int(r.observed_level) <= 3 for r in (roots, mid, ends))
        )
        if (is_coarse or is_indian_deep) and roots_delta > 0:
            dev_time = min(50, dev_time + 10)
            dev_time_range = f"{dev_time - 5}–{dev_time} min without heat (extended for Indian coarse eumelanin density)"
            warnings.append(
                "Indian Hair Phenotype / Coarse Texture: Natural Level 1–3 contains dense eumelanin granules. "
                "Extended processing time (+10 min) applied to break through the Level 4–5 red-orange wall."
            )

        # Check if verified product rules specify custom development time or mixing ratio
        for r in rules:
            actions = r.actions if hasattr(r, "actions") and isinstance(r.actions, dict) else {}
            conditions = r.conditions if hasattr(r, "conditions") and isinstance(r.conditions, dict) else {}
            is_rule_highlift = (
                conditions.get("product_family") == "Special Blonde"
                or conditions.get("shade_series") in ("12/", "Platinum", "Superlift", "Highlift", "12-", "10-", "11.", "13.")
            )
            # Skip toner rules, and ensure highlift/standard alignment
            if conditions.get("service_type") == "TONER" or conditions.get("shade_series") in ("Harmonizers", "Toners", "Pastel"):
                continue
            if not is_highlift_shade and is_rule_highlift:
                continue
            if is_highlift_shade and not is_rule_highlift:
                continue

            if "development_time_minutes" in actions:
                dev_time = int(actions["development_time_minutes"])
                dev_time_range = f"{dev_time} min without heat"

            if "mixing_ratio" in actions:
                mr = actions["mixing_ratio"]
                if isinstance(mr, str):
                    mix_ratio = mr
                    if ":" in mr:
                        try:
                            parts = mr.split(":")
                            ratio_parts = Decimal(parts[1]) / Decimal(parts[0])
                        except Exception:
                            pass
                elif isinstance(mr, dict):
                    c_parts = Decimal(str(mr.get("colour_parts", 1.0)))
                    d_parts = Decimal(str(mr.get("developer_parts", 1.0)))
                    ratio_parts = d_parts / c_parts
                    mix_ratio = f"1:{ratio_parts:g}"

        # Porosity & Condition Modifiers
        has_high_porosity = any(
            r.porosity in (PorosityEnum.HIGH, PorosityEnum.EXTREME) for r in (roots, mid, ends)
        )
        porosity_comp_text: str | None = None
        if has_high_porosity:
            porosity_comp_text = (
                "High cuticle porosity detected in lengths/ends. Apply a porosity equalising protein spray "
                "(e.g., Wella Service Pre-Color Treatment / L'Oréal Metal Detox) prior to chemical application. "
                "For high porosity ends, reduce dwell time or emulsify during final 10–15 minutes to avoid over-pigmentation."
            )

        if technique in ("SHADOW_ROOT", "COLOR_MELT"):
            # Dual-Bowl Master Color Melt
            shadow_level = max(1, min(int(roots.observed_level), target_lvl - 1))
            shadow_shade = pure_natural_shade or target_shade
            shadow_code = (
                f"{shadow_level}/0"
                if is_wella
                else (f"{shadow_level}.0" if is_loreal else f"{shadow_level}-0")
            )

            dev_shadow_formula = DeveloperComponentFormula(
                developer_id=resolved_dev.id if resolved_dev else None,
                developer_name="20 Vol (6%) Developer (Roots Anchor)",
                concentration_percent=Decimal("6.0"),
                volume_in_vol=20,
                parts=Decimal("1.0"),
                weight_grams=Decimal("30.0"),
            )

            stage_bowl_1 = FormulationStage(
                stage_number=stage_counter,
                service_type=ServiceClassificationEnum.DEPOSIT,
                stage_description="Bowl 1 (Root Shadow / Depth Anchor): Depth anchor applied to regrowth zone.",
                target_regions=[HairRegionEnum.ROOTS],
                products=[
                    ProductComponentFormula(
                        product_type="SHADOW_BASE",
                        product_id=shadow_shade.product_id if shadow_shade else None,
                        product_name=f"Level {shadow_level} Base Shade",
                        shade_id=shadow_shade.id if shadow_shade else None,
                        shade_code=shadow_code,
                        shade_name=f"Level {shadow_level} Shadow Foundation",
                        parts=Decimal("1.0"),
                        weight_grams=Decimal("30.0"),
                        notes="Root shadow deposit to create dimension and blend regrowth line.",
                    )
                ],
                developer=dev_shadow_formula,
                mixing_ratio_text="1:1",
                development_time_minutes=35,
                development_time_range="35 min without heat",
                heat_permitted=False,
                application_instructions=(
                    "Apply Bowl 1 with a fine tint brush to roots / regrowth only (approx. 1 to 1.5 inches from scalp). "
                    "Anchor base depth."
                ),
                rules_applied=[rule_code, "TECHNIQUE-SHADOW-ROOT-BOWL-1"],
                source_document_references=["Salon Creative Color Melt & Shadow Root Guide"],
            )
            stage_counter += 1

            # Bowl 2: Mid-Lengths & Ends Melt
            melt_dev_vol = 10 if has_high_porosity else 20
            melt_dev_pct = Decimal("3.0") if has_high_porosity else Decimal("6.0")
            dev_melt_formula = DeveloperComponentFormula(
                developer_id=resolved_dev.id if resolved_dev else None,
                developer_name=f"{melt_dev_vol} Vol Developer (Melt Glaze)",
                concentration_percent=melt_dev_pct,
                volume_in_vol=melt_dev_vol,
                parts=Decimal("1.0"),
                weight_grams=Decimal("45.0"),
            )

            stage_bowl_2 = FormulationStage(
                stage_number=stage_counter,
                service_type=overall_classification,
                stage_description="Bowl 2 (Luminous Color Melt): Vibrant fashion glaze feathered through lengths.",
                target_regions=[HairRegionEnum.MID_LENGTHS, HairRegionEnum.ENDS],
                products=[
                    ProductComponentFormula(
                        product_type="MELT_GLAZE",
                        product_id=target_shade.product_id if target_shade else None,
                        product_name=target_shade.shade_name if target_shade else "Target Shade",
                        shade_id=target_shade.id if target_shade else None,
                        shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                        shade_name=target_shade.shade_name if target_shade else "Target Glaze",
                        parts=Decimal("1.0"),
                        weight_grams=Decimal("45.0"),
                        notes="Target tonal reflect melt.",
                    )
                ],
                developer=dev_melt_formula,
                mixing_ratio_text="1:1",
                development_time_minutes=30,
                development_time_range="30 min concurrent with Bowl 1",
                heat_permitted=False,
                application_instructions=(
                    "Immediately following Bowl 1, apply Bowl 2 through mid-lengths and ends. Use a wide-tooth comb "
                    "or gloved fingers to smudge and blur the boundary line between Bowl 1 and Bowl 2 for an ultra-seamless melted gradient."
                ),
                rules_applied=[rule_code, "TECHNIQUE-COLOR-MELT-BOWL-2"],
                source_document_references=["Salon Creative Color Melt & Shadow Root Guide"],
            )
            stages.extend([stage_bowl_1, stage_bowl_2])
            source_refs.append("Salon Creative Color Melt & Shadow Root Guide")
        elif technique == "GLOSS_TONING":
            # Deposit-only toning gloss
            dev_gloss = DeveloperComponentFormula(
                developer_id=resolved_dev.id if resolved_dev else None,
                developer_name="10 Vol (3%) Developer (Deposit-Only Gloss)",
                concentration_percent=Decimal("3.0"),
                volume_in_vol=10,
                parts=Decimal("1.0"),
                weight_grams=Decimal("60.0"),
            )
            stage_gloss = FormulationStage(
                stage_number=stage_counter,
                service_type=ServiceClassificationEnum.TONING,
                stage_description=f"Stage {stage_counter}: Deposit-Only Toning Glaze (No Base Lift).",
                target_regions=[HairRegionEnum.ROOTS, HairRegionEnum.MID_LENGTHS, HairRegionEnum.ENDS],
                products=products,
                developer=dev_gloss,
                mixing_ratio_text="1:1",
                development_time_minutes=20,
                development_time_range="15–20 min visual timing",
                heat_permitted=False,
                application_instructions=(
                    "Apply toning gloss to damp or dry hair at the shampoo basin or station. "
                    "Massage thoroughly to saturate fibers. Dwell 15–20 min with visual inspection."
                ),
                rules_applied=[rule_code, "TECHNIQUE-GLOSS-TONING"],
                source_document_references=["Salon Demi-Permanent Toning & Glossing Protocol"],
            )
            stages.append(stage_gloss)
            source_refs.append("Salon Demi-Permanent Toning & Glossing Protocol")
        elif not conditions_uniform:
            # Multi-Bowl Zonal Formulation (Anatomical Tri-Bowl Architecture)
            # Differentiates formulation across non-uniform regrowth, mid-lengths, and porous ends
            is_roots_mid_same = (
                roots.observed_level == mid.observed_level
                and roots.existing_artificial_colour == mid.existing_artificial_colour
                and roots.grey_percentage == mid.grey_percentage
                and roots.condition == mid.condition
                and roots.porosity == mid.porosity
            )
            is_mid_ends_same = (
                mid.observed_level == ends.observed_level
                and mid.existing_artificial_colour == ends.existing_artificial_colour
                and mid.grey_percentage == ends.grey_percentage
                and mid.condition == ends.condition
                and mid.porosity == ends.porosity
            )

            if not is_roots_mid_same and not is_mid_ends_same:
                # 3 Independent Bowls: Roots, Mid-Lengths, Ends
                stage_bowl_1 = FormulationStage(
                    stage_number=stage_counter,
                    service_type=region_classes[HairRegionEnum.ROOTS],
                    stage_description=f"Stage {stage_counter} — Bowl 1 (Roots / Regrowth): Depth & Grey Coverage.",
                    target_regions=[HairRegionEnum.ROOTS],
                    products=products,
                    developer=dev_formula,
                    mixing_ratio_text=mix_ratio,
                    development_time_minutes=dev_time,
                    development_time_range=dev_time_range,
                    heat_permitted=False,
                    application_instructions=(
                        "Apply Bowl 1 with a fine tint brush to roots / regrowth only (approx. 1 to 1.5 inches from scalp). "
                        "Process for 20 minutes before applying mid-lengths and ends bowls."
                    ),
                    rules_applied=[rule_code, "ZONAL-MULTI-BOWL-ROOTS"],
                    source_document_references=["Salon Zonal Color Formulation Manual"],
                )
                stage_counter += 1

                mid_delta = target_lvl - int(mid.observed_level)
                mid_dev_vol = 10 if (mid_delta <= 0 or mid.porosity in (PorosityEnum.HIGH, PorosityEnum.EXTREME)) else 20
                mid_dev_pct = Decimal("3.0") if mid_dev_vol == 10 else Decimal("6.0")
                dev_mid = cls._resolve_developer(developers, mid_dev_pct)
                dev_mid_formula = DeveloperComponentFormula(
                    developer_id=dev_mid.id if dev_mid else None,
                    developer_name=dev_mid.product_name if dev_mid else f"{mid_dev_pct}% ({mid_dev_vol} Vol) Developer",
                    concentration_percent=mid_dev_pct,
                    volume_in_vol=mid_dev_vol,
                    parts=Decimal("1.0"),
                    weight_grams=Decimal("45.0"),
                )
                stage_bowl_2 = FormulationStage(
                    stage_number=stage_counter,
                    service_type=region_classes[HairRegionEnum.MID_LENGTHS],
                    stage_description=f"Stage {stage_counter} — Bowl 2 (Mid-Lengths Balancing): Mid-strand tone alignment.",
                    target_regions=[HairRegionEnum.MID_LENGTHS],
                    products=[
                        ProductComponentFormula(
                            product_type="SHADE",
                            product_id=target_shade.product_id if target_shade else None,
                            product_name=target_shade.shade_name if target_shade else "Target Shade",
                            shade_id=target_shade.id if target_shade else None,
                            shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                            shade_name=target_shade.shade_name if target_shade else "Target Shade",
                            parts=Decimal("1.0"),
                            weight_grams=Decimal("45.0"),
                            notes="Mid-lengths tonal balancing formula.",
                        )
                    ],
                    developer=dev_mid_formula,
                    mixing_ratio_text="1:1",
                    development_time_minutes=25,
                    development_time_range="25 min concurrent with Bowl 1",
                    heat_permitted=False,
                    application_instructions=(
                        "Apply Bowl 2 to mid-lengths, feathering upward into the root boundary line. "
                        "Process for 15 minutes concurrent with roots."
                    ),
                    rules_applied=[rule_code, "ZONAL-MULTI-BOWL-MIDS"],
                    source_document_references=["Salon Zonal Color Formulation Manual"],
                )
                stage_counter += 1

                dev_ends = cls._resolve_developer(developers, Decimal("1.9")) or cls._resolve_developer(developers, Decimal("3.0"))
                ends_dev_pct = dev_ends.concentration_percent if dev_ends else Decimal("1.9")
                ends_dev_vol = 6 if ends_dev_pct < Decimal("3.0") else 10
                dev_ends_formula = DeveloperComponentFormula(
                    developer_id=dev_ends.id if dev_ends else None,
                    developer_name=dev_ends.product_name if dev_ends else f"{ends_dev_pct}% ({ends_dev_vol} Vol) Developer (Restorative Glaze)",
                    concentration_percent=ends_dev_pct,
                    volume_in_vol=ends_dev_vol,
                    parts=Decimal("1.5"),
                    weight_grams=Decimal("45.0"),
                )
                stage_bowl_3 = FormulationStage(
                    stage_number=stage_counter,
                    service_type=ServiceClassificationEnum.TONING if ends.condition == HairConditionEnum.SEVERELY_DAMAGED else region_classes[HairRegionEnum.ENDS],
                    stage_description=f"Stage {stage_counter} — Bowl 3 (Ends Restorative Glaze): Low-volume conditioning deposit.",
                    target_regions=[HairRegionEnum.ENDS],
                    products=[
                        ProductComponentFormula(
                            product_type="SHADE",
                            product_id=target_shade.product_id if target_shade else None,
                            product_name=target_shade.shade_name if target_shade else "Target Shade",
                            shade_id=target_shade.id if target_shade else None,
                            shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                            shade_name=target_shade.shade_name if target_shade else "Target Shade",
                            parts=Decimal("1.0"),
                            weight_grams=Decimal("30.0"),
                            notes="Restorative deposit for porous/compromised ends.",
                        )
                    ],
                    developer=dev_ends_formula,
                    mixing_ratio_text="1:1.5",
                    development_time_minutes=15,
                    development_time_range="10–15 min visual timing",
                    heat_permitted=False,
                    application_instructions=(
                        "Apply Bowl 3 through ends during the final 10–15 minutes of service. "
                        "Gently emulsify with lukewarm water to seal the cuticle and equalize tonal reflection without mechanical friction."
                    ),
                    rules_applied=[rule_code, "ZONAL-MULTI-BOWL-ENDS"],
                    source_document_references=["Salon Zonal Color Formulation Manual"],
                )
                stages.extend([stage_bowl_1, stage_bowl_2, stage_bowl_3])
                source_refs.append("Salon Zonal Color Formulation Manual — Tri-Bowl Technique")
            elif is_mid_ends_same:
                # 2 Bowls: Roots vs Lengths/Ends
                stage_bowl_1 = FormulationStage(
                    stage_number=stage_counter,
                    service_type=region_classes[HairRegionEnum.ROOTS],
                    stage_description=f"Stage {stage_counter} — Bowl 1 (Roots / Regrowth): Regrowth formula.",
                    target_regions=[HairRegionEnum.ROOTS],
                    products=products,
                    developer=dev_formula,
                    mixing_ratio_text=mix_ratio,
                    development_time_minutes=dev_time,
                    development_time_range=dev_time_range,
                    heat_permitted=False,
                    application_instructions="Apply Bowl 1 to regrowth roots. Dwell 20 minutes before applying Bowl 2.",
                    rules_applied=[rule_code, "ZONAL-TWO-BOWL-ROOTS"],
                    source_document_references=["Salon Zonal Color Formulation Manual"],
                )
                stage_counter += 1

                dev_lengths = cls._resolve_developer(developers, Decimal("6.0"))
                lengths_dev_pct = dev_lengths.concentration_percent if dev_lengths else Decimal("6.0")
                lengths_dev_vol = (
                    int(round(float(lengths_dev_pct) * 3.333))
                    if lengths_dev_pct
                    else (dev_formula.volume_in_vol if dev_formula else 20)
                )
                dev_lengths_formula = DeveloperComponentFormula(
                    developer_id=dev_lengths.id if dev_lengths else (dev_formula.developer_id if dev_formula else None),
                    developer_name=dev_lengths.product_name if dev_lengths else (dev_formula.developer_name if dev_formula else f"{lengths_dev_pct}% ({lengths_dev_vol} Vol) Developer"),
                    concentration_percent=lengths_dev_pct,
                    volume_in_vol=lengths_dev_vol,
                    parts=Decimal("1.0"),
                    weight_grams=Decimal("60.0"),
                )
                stage_bowl_2 = FormulationStage(
                    stage_number=stage_counter,
                    service_type=region_classes[HairRegionEnum.MID_LENGTHS],
                    stage_description=f"Stage {stage_counter} — Bowl 2 (Mid-Lengths & Ends): Color refresh glaze.",
                    target_regions=[HairRegionEnum.MID_LENGTHS, HairRegionEnum.ENDS],
                    products=[
                        ProductComponentFormula(
                            product_type="SHADE",
                            product_id=target_shade.product_id if target_shade else None,
                            product_name=target_shade.shade_name if target_shade else "Target Shade",
                            shade_id=target_shade.id if target_shade else None,
                            shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                            shade_name=target_shade.shade_name if target_shade else "Target Shade",
                            parts=Decimal("1.0"),
                            weight_grams=Decimal("60.0"),
                            notes="Mid-lengths & ends refresh formula.",
                        )
                    ],
                    developer=dev_lengths_formula,
                    mixing_ratio_text="1:1",
                    development_time_minutes=20,
                    development_time_range="15–20 min concurrent with Bowl 1",
                    heat_permitted=False,
                    application_instructions="Apply Bowl 2 through lengths and ends during the final 15–20 minutes.",
                    rules_applied=[rule_code, "ZONAL-TWO-BOWL-LENGTHS"],
                    source_document_references=["Salon Zonal Color Formulation Manual"],
                )
                stages.extend([stage_bowl_1, stage_bowl_2])
                source_refs.append("Salon Zonal Color Formulation Manual — Dual-Bowl Technique")
            else:
                # 2 Bowls: Roots/Mids vs Ends
                stage_bowl_1 = FormulationStage(
                    stage_number=stage_counter,
                    service_type=region_classes[HairRegionEnum.ROOTS],
                    stage_description=f"Stage {stage_counter} — Bowl 1 (Roots & Mid-Lengths): Foundation lift and deposit.",
                    target_regions=[HairRegionEnum.ROOTS, HairRegionEnum.MID_LENGTHS],
                    products=products,
                    developer=dev_formula,
                    mixing_ratio_text=mix_ratio,
                    development_time_minutes=dev_time,
                    development_time_range=dev_time_range,
                    heat_permitted=False,
                    application_instructions="Apply Bowl 1 to roots and mid-lengths. Dwell 20 minutes before applying Bowl 2 to ends.",
                    rules_applied=[rule_code, "ZONAL-TWO-BOWL-ROOTS-MIDS"],
                    source_document_references=["Salon Zonal Color Formulation Manual"],
                )
                stage_counter += 1

                dev_ends = cls._resolve_developer(developers, Decimal("1.9")) or cls._resolve_developer(developers, Decimal("3.0"))
                ends_dev_pct = dev_ends.concentration_percent if dev_ends else Decimal("1.9")
                ends_dev_vol = 6 if ends_dev_pct < Decimal("3.0") else 10
                dev_ends_formula = DeveloperComponentFormula(
                    developer_id=dev_ends.id if dev_ends else None,
                    developer_name=dev_ends.product_name if dev_ends else f"{ends_dev_pct}% ({ends_dev_vol} Vol) Developer",
                    concentration_percent=ends_dev_pct,
                    volume_in_vol=ends_dev_vol,
                    parts=Decimal("1.5"),
                    weight_grams=Decimal("45.0"),
                )
                stage_bowl_2 = FormulationStage(
                    stage_number=stage_counter,
                    service_type=ServiceClassificationEnum.TONING if ends.condition == HairConditionEnum.SEVERELY_DAMAGED else region_classes[HairRegionEnum.ENDS],
                    stage_description=f"Stage {stage_counter} — Bowl 2 (Porous Ends Restorative Glaze): Gentle deposit.",
                    target_regions=[HairRegionEnum.ENDS],
                    products=[
                        ProductComponentFormula(
                            product_type="SHADE",
                            product_id=target_shade.product_id if target_shade else None,
                            product_name=target_shade.shade_name if target_shade else "Target Shade",
                            shade_id=target_shade.id if target_shade else None,
                            shade_code=target_shade.shade_code if target_shade else f"{target_lvl}/xx",
                            shade_name=target_shade.shade_name if target_shade else "Target Shade",
                            parts=Decimal("1.0"),
                            weight_grams=Decimal("30.0"),
                            notes="Porous ends restorative formula.",
                        )
                    ],
                    developer=dev_ends_formula,
                    mixing_ratio_text="1:1.5",
                    development_time_minutes=15,
                    development_time_range="10–15 min visual timing",
                    heat_permitted=False,
                    application_instructions="Apply Bowl 2 to porous ends during the final 10–15 minutes. Emulsify gently.",
                    rules_applied=[rule_code, "ZONAL-TWO-BOWL-ENDS-GLAZE"],
                    source_document_references=["Salon Zonal Color Formulation Manual"],
                )
                stages.extend([stage_bowl_1, stage_bowl_2])
                source_refs.append("Salon Zonal Color Formulation Manual — Dual-Bowl Porous Ends Technique")
        else:
            standard_app_instructions = (
                "Step 1 • PREPARATION: Dry, unwashed hair. Section into 4 equal quadrants with sectioning clips. Apply skin barrier cream around hairline and ears.\n"
                f"Step 2 • DIGITAL SCALE MIXING: Place bowl on digital scale, tare to 0.0g. Weigh {Decimal('60.0')}g of {target_shade.shade_code if target_shade else 'colour'} and {Decimal('60.0') * ratio_parts}g of {resolved_dev.product_name if resolved_dev else 'developer'} ({mix_ratio} ratio). Whisk with colour whisk until completely homogeneous.\n"
                "Step 3 • APPLICATION: Using a professional tint brush, apply in fine 0.5 cm slices starting from roots / regrowth. If refreshing lengths, pull through with wide-tooth comb during the final 10–15 minutes.\n"
                f"Step 4 • PROCESSING: Dwell for {dev_time} minutes at room temperature. Do NOT apply artificial heat.\n"
                "Step 5 • EMULSIFY & RINSE: Add a small splash of lukewarm water, massage hairline for 2 minutes to lift stains, then rinse until water runs completely clear. Follow with post-colour pH-neutralizing shampoo and conditioner."
            )
            if any(r.condition == HairConditionEnum.SEVERELY_DAMAGED for r in (mid, ends)):
                standard_app_instructions = (
                    "Step 1 • PREPARATION & BARRIER: Section into 4 quadrants. Apply porosity equalizer to sensitized lengths.\n"
                    f"Step 2 • REGROWTH FORMULA: Mix {Decimal('60.0')}g of {target_shade.shade_code if target_shade else 'colour'} with {Decimal('60.0') * ratio_parts}g of {resolved_dev.product_name if resolved_dev else 'developer'} ({mix_ratio} ratio).\n"
                    "Step 3 • REGROWTH APPLICATION: Apply to new growth roots only. CAUTION: Severely compromised lengths and ends must NOT be exposed to full-strength developer.\n"
                    f"Step 4 • REFRESH TECHNIQUE: Process roots for {dev_time - 15} minutes. For compromised lengths, dilute remaining mixture 1:1 with clear post-treatment or apply gentle 6 Vol gloss during the final 10 minutes only.\n"
                    "Step 5 • RINSE & SEAL: Emulsify gently without friction, rinse thoroughly, and apply reconstructive cuticle sealer."
                )

            stage_single = FormulationStage(
                stage_number=stage_counter,
                service_type=overall_classification,
                stage_description=f"Stage {stage_counter}: {overall_classification.value} application.",
                target_regions=[HairRegionEnum.ROOTS, HairRegionEnum.MID_LENGTHS, HairRegionEnum.ENDS],
                products=products,
                developer=dev_formula,
                mixing_ratio_text=mix_ratio,
                development_time_minutes=dev_time,
                development_time_range=dev_time_range,
                heat_permitted=False,
                application_instructions=standard_app_instructions,
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
                    stages=stages,
                    grey_coverage_notes=grey_notes if reg.region == HairRegionEnum.ROOTS else None,
                    special_mix_notes=special_mix_notes,
                    repigmentation_notes=repig_notes_single,
                    porosity_compensation_notes=porosity_comp_text
                    if reg.porosity in (PorosityEnum.HIGH, PorosityEnum.EXTREME)
                    else None,
                )
            )

        return stages, region_plans, conditions_uniform
