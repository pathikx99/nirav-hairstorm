"""
Formulation Engine Schemas — Version 1.0.

Defines Pydantic v2 schemas for hair assessment inputs, target colour definition,
safety evaluation diagnostics, formulation stages, and complete formulation results.
Conforms strictly to Technical Specification §5.2, §5.8, §5.9, §5.10, §5.12, §5.13.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.app.formulation.enums import (
    FormulationResultStatusEnum,
    HairConditionEnum,
    PorosityEnum,
    ProcessModeEnum,
    SafetyStatusEnum,
    ServiceClassificationEnum,
)
from backend.app.universal_colour.enums import (
    AssessmentProvenanceEnum,
    HairRegionEnum,
    ToneFamilyEnum,
    ToneIntensityEnum,
    UniversalLevel,
)
from backend.app.universal_colour.schemas import CIELABMeasurement, UHCRRecord

# ---------------------------------------------------------------------------
# Client History & Hair Assessment Inputs
# ---------------------------------------------------------------------------


class ClientHistoryInput(BaseModel):
    """Client chemical and allergy history."""

    model_config = ConfigDict(frozen=True)

    has_allergy_history: bool = Field(
        default=False,
        description="Whether the client has known allergy or adverse reaction history to hair colour.",
    )
    allergy_details: str | None = Field(
        default=None,
        description="Specific details of any prior allergic reaction.",
    )
    patch_test_completed_48h: bool = Field(
        default=False,
        description="Whether a 48-hour allergy alert test (patch test) was performed with negative result.",
    )
    scalp_condition: str = Field(
        default="normal",
        description="Scalp state: 'normal', 'sensitive', 'irritated', 'broken_skin', 'abrasions'.",
    )
    previous_chemical_services: list[str] = Field(
        default_factory=list,
        description="Chemical service history: 'bleach', 'highlights', 'permanent_colour', 'relaxer', 'perm', 'henna', 'keratin'.",
    )
    has_metallic_salts_or_henna: bool = Field(
        default=False,
        description="Whether hair has been treated with henna, vegetable dye, or metallic salt compounds.",
    )
    has_sodium_hydroxide_relaxer: bool = Field(
        default=False,
        description="Whether hair has been chemically straightened with sodium hydroxide / lye relaxer.",
    )


class HairRegionInput(BaseModel):
    """Assessment of a single anatomical hair zone (roots, mid-lengths, or ends)."""

    model_config = ConfigDict(frozen=True)

    region: HairRegionEnum = Field(
        description="Hair region identifier: ROOTS, MID_LENGTHS, or ENDS.",
    )
    observed_level: UniversalLevel = Field(
        description="Observed hair depth level (1–10).",
    )
    observed_undertone: ToneFamilyEnum | None = Field(
        default=None,
        description="Observed natural or artificial undertone.",
    )
    existing_artificial_colour: bool = Field(
        default=False,
        description="Whether this region contains existing artificial dye or pigment.",
    )
    grey_percentage: Decimal = Field(
        default=Decimal("0.0"),
        ge=0,
        le=100,
        description="Observed percentage of unpigmented/white hair (0–100%).",
    )
    porosity: PorosityEnum = Field(
        default=PorosityEnum.NORMAL,
        description="Cuticle porosity level.",
    )
    condition: HairConditionEnum = Field(
        default=HairConditionEnum.HEALTHY,
        description="Hair fiber integrity and condition.",
    )
    is_on_scalp: bool = Field(
        default=False,
        description="Whether product applied to this region contacts the scalp (typically True for ROOTS).",
    )
    colourist_confirmed: bool = Field(
        default=False,
        description="Whether a qualified colourist has visually confirmed this assessment.",
    )


class HairAssessmentInput(BaseModel):
    """Complete multi-region starting hair assessment."""

    model_config = ConfigDict(frozen=True)

    assessment_id: UUID = Field(
        default_factory=uuid4,
        description="Unique identifier for this assessment.",
    )
    market: str = Field(
        default="IN",
        description="Target geographic market code (e.g., 'IN').",
    )
    history: ClientHistoryInput = Field(
        default_factory=ClientHistoryInput,
        description="Client health, allergy, and chemical service history.",
    )
    roots: HairRegionInput = Field(
        description="Roots / regrowth region assessment.",
    )
    mid_lengths: HairRegionInput = Field(
        description="Mid-lengths region assessment.",
    )
    ends: HairRegionInput = Field(
        description="Ends region assessment.",
    )
    assessment_provenance: AssessmentProvenanceEnum = Field(
        default=AssessmentProvenanceEnum.COLOURIST_CONFIRMED,
        description="Provenance of the hair assessment.",
    )
    colourist_confirmation_status: bool = Field(
        default=True,
        description="Overall colourist confirmation of the starting condition.",
    )


# ---------------------------------------------------------------------------
# Target Colour Definition
# ---------------------------------------------------------------------------


class TargetColourInput(BaseModel):
    """Desired target hair colour representation."""

    model_config = ConfigDict(frozen=True)

    target_colour_id: UUID = Field(
        default_factory=uuid4,
        description="Unique identifier for this target colour specification.",
    )
    universal_level: UniversalLevel = Field(
        description="Target universal depth level (1–10).",
    )
    primary_tone: ToneFamilyEnum = Field(
        description="Target primary tonal direction.",
    )
    secondary_tone: ToneFamilyEnum | None = Field(
        default=None,
        description="Target secondary / subtle reflect direction.",
    )
    tone_intensity: ToneIntensityEnum = Field(
        default=ToneIntensityEnum.STANDARD,
        description="Target tone saturation / prominence.",
    )
    reference_image_id: UUID | None = Field(
        default=None,
        description="Optional reference image asset ID.",
    )
    notes: str | None = Field(
        default=None,
        description="Optional colourist notes regarding target look.",
    )


# ---------------------------------------------------------------------------
# Formulation Request
# ---------------------------------------------------------------------------


class FormulationEvaluateRequest(BaseModel):
    """Request payload for POST /api/v1/formulations/evaluate."""

    model_config = ConfigDict(frozen=True)

    assessment_id: UUID | None = Field(
        default=None,
        description="UUID of previously persisted hair assessment, if applicable.",
    )
    assessment: HairAssessmentInput | None = Field(
        default=None,
        description="Inline starting hair assessment.",
    )
    target_colour_id: UUID | None = Field(
        default=None,
        description="UUID of previously persisted target colour, if applicable.",
    )
    target_colour: TargetColourInput | None = Field(
        default=None,
        description="Inline target colour definition.",
    )
    mode: ProcessModeEnum = Field(
        default=ProcessModeEnum.PREFERRED_MANUFACTURER,
        description="Operating mode: PREFERRED_MANUFACTURER or CROSS_BRAND_COMPARISON.",
    )
    manufacturer_id: UUID | None = Field(
        default=None,
        description="Target manufacturer ID for PREFERRED_MANUFACTURER mode.",
    )
    manufacturer_ids: list[UUID] = Field(
        default_factory=list,
        description="Target manufacturer IDs for CROSS_BRAND_COMPARISON mode.",
    )
    market: str = Field(
        default="IN",
        description="Target market code (default: 'IN').",
    )

    @model_validator(mode="after")
    def _validate_inputs_present(self) -> FormulationEvaluateRequest:
        if self.assessment is None and self.assessment_id is None:
            raise ValueError("Either assessment or assessment_id must be provided.")
        if self.target_colour is None and self.target_colour_id is None:
            raise ValueError("Either target_colour or target_colour_id must be provided.")
        if self.mode == ProcessModeEnum.PREFERRED_MANUFACTURER and self.manufacturer_id is None:
            raise ValueError("manufacturer_id is required when mode is PREFERRED_MANUFACTURER.")
        return self


# ---------------------------------------------------------------------------
# Formulation Output Components
# ---------------------------------------------------------------------------


class SafetyCheckResult(BaseModel):
    """Diagnostic result of a specific safety check."""

    model_config = ConfigDict(frozen=True)

    check_code: str = Field(
        description="Unique code identifying the safety constraint checked.",
    )
    status: SafetyStatusEnum = Field(
        description="Safety status: PASS, WARNING, BLOCKED, or NEEDS_ASSESSMENT.",
    )
    title: str = Field(
        description="Brief human-readable title of the safety check.",
    )
    detail: str = Field(
        description="Detailed technical rationale and assessment.",
    )
    blocked_reason: str | None = Field(
        default=None,
        description="Explains why this check blocked formulation execution, if blocked.",
    )
    recommendation: str | None = Field(
        default=None,
        description="Clinical or technical recommendation to resolve or mitigate risk.",
    )


class ProductComponentFormula(BaseModel):
    """A single product component in a chemical formula (e.g. colour shade, lightener, additive)."""

    model_config = ConfigDict(frozen=True)

    product_type: str = Field(
        description="Component role: 'SHADE', 'PURE_NATURAL', 'SPECIAL_MIX', 'LIGHTENER', 'ADDITIVE'.",
    )
    product_id: UUID | None = Field(
        default=None,
        description="Manufacturer product UUID.",
    )
    product_name: str = Field(
        description="Product trade name (e.g., 'Koleston Perfect ME+', 'Blondor Multi-Blonde Powder').",
    )
    shade_id: UUID | None = Field(
        default=None,
        description="Manufacturer shade UUID if component is a specific shade.",
    )
    shade_code: str | None = Field(
        default=None,
        description="Verbatim manufacturer shade notation (e.g. '7/43', '7/0', '0/43', '7.43').",
    )
    shade_name: str | None = Field(
        default=None,
        description="Verbatim shade name (e.g. 'Medium Blonde Red Gold').",
    )
    parts: Decimal = Field(
        description="Proportional parts in the formula mixture (e.g., 1.0, 0.5).",
    )
    weight_grams: Decimal | None = Field(
        default=None,
        description="Illustrative weight in grams for a standard salon application.",
    )
    length_cm: Decimal | None = Field(
        default=None,
        description="Length in centimeters for Special Mix ribbons (Rule of 12).",
    )
    is_pure_natural: bool = Field(
        default=False,
        description="Flag indicating whether this component was added for grey coverage.",
    )
    notes: str | None = Field(
        default=None,
        description="Technical usage notes for this component.",
    )


class DeveloperComponentFormula(BaseModel):
    """Developer component required for oxidative activation."""

    model_config = ConfigDict(frozen=True)

    developer_id: UUID | None = Field(
        default=None,
        description="Manufacturer developer UUID.",
    )
    developer_name: str = Field(
        description="Trade name of the developer (e.g. 'Welloxon Perfect 6% 20 Vol').",
    )
    concentration_percent: Decimal = Field(
        description="Hydrogen peroxide concentration percentage (e.g. 6.0, 9.0).",
    )
    volume_in_vol: int | None = Field(
        default=None,
        description="Volume strength designation (e.g. 20, 30, 40 Vol).",
    )
    parts: Decimal = Field(
        description="Parts developer relative to colour/lightener base.",
    )
    weight_grams: Decimal | None = Field(
        default=None,
        description="Illustrative weight in grams for standard application.",
    )


class FormulationStage(BaseModel):
    """An executable stage in a multi-stage or single-stage colouring process."""

    model_config = ConfigDict(frozen=True)

    stage_number: int = Field(
        description="Execution order: 1, 2, ...",
    )
    service_type: ServiceClassificationEnum = Field(
        description="Service type for this stage (e.g. LIGHTENING, TONING, DEPOSIT, LIFTING).",
    )
    stage_description: str = Field(
        description="Clear operational summary of this stage.",
    )
    target_regions: list[HairRegionEnum] = Field(
        description="Anatomical hair regions treated during this stage.",
    )
    products: list[ProductComponentFormula] = Field(
        description="List of colour/lightening products to mix.",
    )
    developer: DeveloperComponentFormula | None = Field(
        default=None,
        description="Prescribed developer and strength.",
    )
    mixing_ratio_text: str = Field(
        description="Standard mixing ratio description (e.g. '1:1', '1:2', '1:1.5').",
    )
    development_time_minutes: int = Field(
        description="Standard development time in minutes.",
    )
    development_time_range: str = Field(
        description="Permitted development time window (e.g. '30–40 min', '50–60 min').",
    )
    heat_permitted: bool = Field(
        default=False,
        description="Whether climatic heat / Climazon acceleration is permitted.",
    )
    application_instructions: str = Field(
        description="Step-by-step application technique and placement instructions.",
    )
    rules_applied: list[str] = Field(
        default_factory=list,
        description="Rule codes applied during formula generation.",
    )
    source_document_references: list[str] = Field(
        default_factory=list,
        description="Citations to authoritative manufacturer technical documents.",
    )


class RegionFormulationPlan(BaseModel):
    """Formulation plan and diagnostic analysis for a specific hair region."""

    model_config = ConfigDict(frozen=True)

    region: HairRegionEnum = Field(
        description="Hair region: ROOTS, MID_LENGTHS, or ENDS.",
    )
    initial_level: int = Field(
        description="Observed starting level.",
    )
    target_level: int = Field(
        description="Target final level.",
    )
    level_delta: int = Field(
        description="Depth delta (target - initial). Positive = lift, negative = darken.",
    )
    service_classification: ServiceClassificationEnum = Field(
        description="Classified service for this specific region.",
    )
    stages: list[FormulationStage] = Field(
        description="Ordered stages applicable to this region.",
    )
    grey_coverage_notes: str | None = Field(
        default=None,
        description="Grey coverage instructions and Pure Naturals inclusion rationale.",
    )
    special_mix_notes: str | None = Field(
        default=None,
        description="Corrective tone or intensifying ribbon calculations.",
    )


class PredictedResult(BaseModel):
    """Theoretical outcome prediction and validation disclaimer."""

    model_config = ConfigDict(frozen=True)

    universal_colour: UHCRRecord | None = Field(
        default=None,
        description="Theoretical resulting UHCR colour record.",
    )
    lab_measurement: CIELABMeasurement | None = Field(
        default=None,
        description="Predicted CIELAB coordinates if empirical model available.",
    )
    confidence: Literal["HIGH", "MEDIUM", "LOW", "INSUFFICIENT"] = Field(
        default="INSUFFICIENT",
        description="Confidence in theoretical outcome.",
    )
    guarantee_disclaimer: str = Field(
        default=(
            "Predicted results are theoretical estimations based on verified manufacturer guidelines "
            "and do not constitute a chemical guarantee of final colour. Strand tests remain mandatory."
        ),
        description="Architectural Principle 10 disclaimer.",
    )


class FormulationResultResponse(BaseModel):
    """Complete formulation evaluation result conforming to Technical Specification §5.12."""

    model_config = ConfigDict(frozen=True)

    formulation_id: UUID = Field(
        default_factory=uuid4,
        description="Unique formulation evaluation identifier.",
    )
    status: FormulationResultStatusEnum = Field(
        description="Formulation execution status (DRAFT, BLOCKED, REQUIRES_PROFESSIONAL_REVIEW, etc.).",
    )
    market: str = Field(
        default="IN",
        description="Geographic market code.",
    )
    manufacturer_id: UUID | None = Field(
        default=None,
        description="Manufacturer UUID for single-brand evaluation.",
    )
    manufacturer_name: str | None = Field(
        default=None,
        description="Manufacturer trade name.",
    )
    catalogue_version_id: UUID | None = Field(
        default=None,
        description="Versioned manufacturer catalogue UUID used for calculation.",
    )
    engine_version: str = Field(
        default="1.0",
        description="Formulation engine algorithm version.",
    )
    assessment_id: UUID | None = Field(
        default=None,
        description="Hair assessment ID.",
    )
    target_colour_id: UUID | None = Field(
        default=None,
        description="Target colour ID.",
    )
    service_classification: ServiceClassificationEnum = Field(
        description="Overall service classification.",
    )
    stages: list[FormulationStage] = Field(
        default_factory=list,
        description="Sequenced technical formulation stages.",
    )
    regions: list[RegionFormulationPlan] = Field(
        default_factory=list,
        description="Per-region technical formulation plans.",
    )
    shared_regional_formulation: bool = Field(
        default=False,
        description="True if all regions share identical initial conditions and can receive a single formula.",
    )
    safety_checks: list[SafetyCheckResult] = Field(
        default_factory=list,
        description="Detailed diagnostic results for all evaluated safety constraints.",
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Advisory warnings for professional colourist consideration.",
    )
    missing_information: list[str] = Field(
        default_factory=list,
        description="Explicit list of missing data elements that impeded evaluation.",
    )
    predicted_result: PredictedResult = Field(
        default_factory=PredictedResult,
        description="Predicted colour outcome and uncertainty.",
    )
    source_references: list[str] = Field(
        default_factory=list,
        description="Citations to verified manufacturer technical documentation.",
    )
    chemical_equivalence: Literal["NOT_ESTABLISHED"] = Field(
        default="NOT_ESTABLISHED",
        description="Strictly non-negotiable chemical equivalence boundary.",
    )
    evaluated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="Timestamp when formulation was evaluated.",
    )
