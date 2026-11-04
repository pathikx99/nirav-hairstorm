"""
Safety & Contraindication Validation Service — Version 1.0.

Evaluates hair assessments, target transformations, and product combinations
against hard clinical and manufacturer safety constraints.
Conforms strictly to Technical Specification §5.7 & §5.8.
"""

from __future__ import annotations

from decimal import Decimal

from backend.app.formulation.enums import (
    HairConditionEnum,
    SafetyStatusEnum,
    ServiceClassificationEnum,
)
from backend.app.formulation.schemas import (
    HairAssessmentInput,
    SafetyCheckResult,
    TargetColourInput,
)


class SafetyValidationService:
    """
    Deterministic safety validator.

    Hard constraints block executable formulation output.
    Any single BLOCKED check transitions overall safety status to BLOCKED.
    """

    @classmethod
    def validate_assessment_and_target(
        cls,
        assessment: HairAssessmentInput,
        target: TargetColourInput,
        overall_classification: ServiceClassificationEnum,
    ) -> tuple[SafetyStatusEnum, list[SafetyCheckResult], list[str]]:
        """
        Runs comprehensive pre-formulation safety and contraindication checks.

        Returns:
            - overall_status: PASS, WARNING, BLOCKED, or NEEDS_ASSESSMENT.
            - checks: list of detailed diagnostic check results.
            - blocking_reasons: list of human-readable blocking reasons.
        """
        checks: list[SafetyCheckResult] = []
        blocking_reasons: list[str] = []

        history = assessment.history

        # -------------------------------------------------------------------
        # 1. Allergy Alert & Known Allergy History
        # -------------------------------------------------------------------
        if history.has_allergy_history:
            msg = (
                "Client has a documented history of allergic reaction to hair colour. "
                "Any oxidative colour service is strictly prohibited."
            )
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_ALLERGY_KNOWN_HISTORY",
                    status=SafetyStatusEnum.BLOCKED,
                    title="Known Hair Colour Allergy",
                    detail=msg,
                    blocked_reason=msg,
                    recommendation="Refer client for dermatological allergy testing. Do not apply oxidative colour.",
                )
            )
            blocking_reasons.append(msg)
        else:
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_ALLERGY_KNOWN_HISTORY",
                    status=SafetyStatusEnum.PASS,
                    title="Known Hair Colour Allergy",
                    detail="No prior adverse or allergic reaction to hair colour reported.",
                )
            )

        # 48-Hour Patch Test Verification
        if not history.patch_test_completed_48h:
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_ALLERGY_48H_PATCH_TEST",
                    status=SafetyStatusEnum.WARNING,
                    title="48-Hour Allergy Alert Test (AAT)",
                    detail=(
                        "Allergy Alert Test (patch test) has not been confirmed within the past 48 hours. "
                        "Manufacturer protocol and professional guidelines require an AAT prior to application."
                    ),
                    recommendation="Perform 48-hour Allergy Alert Test behind ear or inside elbow before chemical service.",
                )
            )
        else:
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_ALLERGY_48H_PATCH_TEST",
                    status=SafetyStatusEnum.PASS,
                    title="48-Hour Allergy Alert Test (AAT)",
                    detail="48-hour Allergy Alert Test confirmed negative.",
                )
            )

        # -------------------------------------------------------------------
        # 2. Scalp Condition
        # -------------------------------------------------------------------
        scalp = (history.scalp_condition or "normal").lower().strip()
        if scalp in ("irritated", "broken_skin", "abrasions", "lesions", "dermatitis"):
            msg = (
                f"Scalp examination reveals compromised tissue ({scalp}). "
                "Direct contact with oxidative colour or lightener can cause chemical burns or systemic sensitization."
            )
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_SCALP_INTEGRITY",
                    status=SafetyStatusEnum.BLOCKED,
                    title="Compromised Scalp Condition",
                    detail=msg,
                    blocked_reason=msg,
                    recommendation="Postpone chemical service until scalp is completely healed and re-evaluated.",
                )
            )
            blocking_reasons.append(msg)
        else:
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_SCALP_INTEGRITY",
                    status=SafetyStatusEnum.PASS,
                    title="Scalp Integrity",
                    detail="Scalp is intact with no observed abrasions, lesions, or active irritation.",
                )
            )

        # -------------------------------------------------------------------
        # 3. Chemical Incompatibilities
        # -------------------------------------------------------------------
        # Metallic Salts / Henna
        if history.has_metallic_salts_or_henna or "henna" in [
            s.lower() for s in history.previous_chemical_services
        ]:
            if overall_classification in (
                ServiceClassificationEnum.LIGHTENING,
                ServiceClassificationEnum.LIFTING,
                ServiceClassificationEnum.COLOUR_REMOVAL,
                ServiceClassificationEnum.MULTI_STAGE_PROCESS,
            ):
                msg = (
                    "Hair has been treated with henna or metallic salts. Applying persulfate lightener or high-volume peroxide "
                    "can cause exothermic thermal reaction, rapid chemical burn, and severe fiber disintegration."
                )
                checks.append(
                    SafetyCheckResult(
                        check_code="SAFETY_HENNA_METALLIC_SALTS",
                        status=SafetyStatusEnum.BLOCKED,
                        title="Metallic Salts / Henna Contraindication",
                        detail=msg,
                        blocked_reason=msg,
                        recommendation="Perform clarifying mineral-removing treatment and cut-swatch strand test before proceeding.",
                    )
                )
                blocking_reasons.append(msg)
            else:
                checks.append(
                    SafetyCheckResult(
                        check_code="SAFETY_HENNA_METALLIC_SALTS",
                        status=SafetyStatusEnum.NEEDS_ASSESSMENT,
                        title="Metallic Salts / Henna History",
                        detail="Hair has previous henna/metallic salt exposure. Tone deposit requires a strand test.",
                        recommendation="Strand test required to verify compatibility and prevent unexpected green/black cast.",
                    )
                )

        # Sodium Hydroxide (Lye) Relaxer + Bleaching
        has_lye = history.has_sodium_hydroxide_relaxer or any(
            "sodium hydroxide" in s.lower() or "lye" in s.lower()
            for s in history.previous_chemical_services
        )
        if has_lye and overall_classification in (
            ServiceClassificationEnum.LIGHTENING,
            ServiceClassificationEnum.MULTI_STAGE_PROCESS,
        ):
            msg = (
                "Hair chemically straightened with sodium hydroxide (lye) relaxer must never be lightened with persulfate bleach. "
                "Severe irreversible fiber destruction will occur."
            )
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_SODIUM_HYDROXIDE_BLEACH",
                    status=SafetyStatusEnum.BLOCKED,
                    title="Sodium Hydroxide Relaxer Incompatibility",
                    detail=msg,
                    blocked_reason=msg,
                    recommendation="Lightening is strictly contraindicated on lye-relaxed hair.",
                )
            )
            blocking_reasons.append(msg)

        # -------------------------------------------------------------------
        # 4. Fiber Integrity / Severe Damage
        # -------------------------------------------------------------------
        severely_damaged_regions = [
            r.region.value
            for r in (assessment.roots, assessment.mid_lengths, assessment.ends)
            if r.condition == HairConditionEnum.SEVERELY_DAMAGED
        ]
        if severely_damaged_regions:
            if overall_classification in (
                ServiceClassificationEnum.LIGHTENING,
                ServiceClassificationEnum.LIFTING,
                ServiceClassificationEnum.MULTI_STAGE_PROCESS,
            ):
                msg = (
                    f"Hair fiber in regions {severely_damaged_regions} is classified as SEVERELY_DAMAGED. "
                    "Aggressive oxidative lifting or bleaching poses extreme risk of hair breakage and loss of structural elasticity."
                )
                checks.append(
                    SafetyCheckResult(
                        check_code="SAFETY_SEVERELY_DAMAGED_FIBER",
                        status=SafetyStatusEnum.BLOCKED,
                        title="Severe Hair Damage Contraindication",
                        detail=msg,
                        blocked_reason=msg,
                        recommendation="Prescribe bond-rebuilding and protein treatments. Oxidative lift contraindicated without strand test.",
                    )
                )
                blocking_reasons.append(msg)
            else:
                checks.append(
                    SafetyCheckResult(
                        check_code="SAFETY_SEVERELY_DAMAGED_FIBER",
                        status=SafetyStatusEnum.WARNING,
                        title="Severely Damaged Hair Fiber",
                        detail=f"Hair is severely damaged in {severely_damaged_regions}. Use gentle deposit or acidic gloss only.",
                        recommendation="Use lowest developer concentration (1.9% / 6 Vol) with maximum conditioning agents.",
                    )
                )

        # Determine overall safety status
        if any(c.status == SafetyStatusEnum.BLOCKED for c in checks):
            overall_status = SafetyStatusEnum.BLOCKED
        elif any(c.status == SafetyStatusEnum.NEEDS_ASSESSMENT for c in checks):
            overall_status = SafetyStatusEnum.NEEDS_ASSESSMENT
        elif any(c.status == SafetyStatusEnum.WARNING for c in checks):
            overall_status = SafetyStatusEnum.WARNING
        else:
            overall_status = SafetyStatusEnum.PASS

        return overall_status, checks, blocking_reasons

    @classmethod
    def validate_product_and_application_rules(
        cls,
        product_family: str,
        service_type: str,
        developer_percentage: Decimal,
        is_on_scalp: bool,
        has_wellaplex: bool = False,
    ) -> list[SafetyCheckResult]:
        """
        Validates manufacturer-specific chemical rules and application conditions.
        """
        checks: list[SafetyCheckResult] = []

        # Wella Blondor Scalp Safety: Max 6% on scalp
        if (
            "blondor" in product_family.lower()
            and is_on_scalp
            and developer_percentage > Decimal("6.0")
        ):
            msg = (
                f"When applying Blondor lightener on scalp, maximum developer strength is 6% (20 Vol). "
                f"Requested developer strength is {developer_percentage}%."
            )
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_BLONDOR_SCALP_MAX_6PCT",
                    status=SafetyStatusEnum.BLOCKED,
                    title="Blondor Scalp Developer Limit Exceeded",
                    detail=msg,
                    blocked_reason=msg,
                    recommendation="Reduce developer strength to 6% (20 Vol) or lower for on-scalp lightening.",
                )
            )

        # Wella Blondor Base Breaker + WellaPlex contraindication
        if "base breaker" in product_family.lower() and has_wellaplex:
            msg = "Blondor Base Breaker cannot be mixed with WellaPlex according to manufacturer technical guidelines."
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_BLONDOR_BB_NO_WELLAPLEX",
                    status=SafetyStatusEnum.BLOCKED,
                    title="Blondor Base Breaker / WellaPlex Incompatibility",
                    detail=msg,
                    blocked_reason=msg,
                    recommendation="Do not add WellaPlex to Blondor Base Breaker mixtures.",
                )
            )

        # Magma on scalp contraindication
        if "magma" in product_family.lower() and is_on_scalp:
            msg = "Wella Magma is formulated exclusively for off-scalp highlighting and must never contact the scalp."
            checks.append(
                SafetyCheckResult(
                    check_code="SAFETY_MAGMA_ON_SCALP",
                    status=SafetyStatusEnum.BLOCKED,
                    title="Magma Direct Scalp Contact Contraindicated",
                    detail=msg,
                    blocked_reason=msg,
                    recommendation="Apply Magma strictly using off-scalp foil or meches techniques.",
                )
            )

        return checks
