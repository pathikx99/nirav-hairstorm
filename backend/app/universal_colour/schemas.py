"""
UHCR v1.0 — Pydantic v2 Schemas.

Defines the data-transfer and validation contracts for UHCR records,
CIELAB measurements, photo assessments, and hair-region analysis results.
All schemas use Pydantic v2 ``model_validator`` / ``field_validator`` style.
"""

from __future__ import annotations

import math
from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator

from backend.app.universal_colour.enums import (
    AssessmentProvenanceEnum,
    ClassificationStatusEnum,
    ColourFamilyEnum,
    HairRegionEnum,
    MeasurementStatusEnum,
    ToneFamilyEnum,
    ToneIntensityEnum,
    UniversalLevel,
)

# ---------------------------------------------------------------------------
# CIELAB / CIELCh
# ---------------------------------------------------------------------------


class CIELABMeasurement(BaseModel):
    """
    A single CIELAB colour measurement with validity status.

    Enforces the UHCR rule that Lab values must be **all present or all
    absent**, and that a ``VALID`` measurement must contain actual data
    within the conventional instrument ranges.
    """

    model_config = ConfigDict(
        frozen=True,
        json_schema_extra={
            "description": "CIELAB colour measurement as defined by the UHCR v1 spec."
        },
    )

    l_star: Decimal | None = Field(
        default=None,
        description="CIELAB L* (lightness), 0–100.",
    )
    a_star: Decimal | None = Field(
        default=None,
        description="CIELAB a* (green–red axis), −128 to 127.",
    )
    b_star: Decimal | None = Field(
        default=None,
        description="CIELAB b* (blue–yellow axis), −128 to 127.",
    )
    space: Literal["CIELAB"] = Field(
        default="CIELAB",
        description="Colour space identifier. Always 'CIELAB'.",
    )
    status: MeasurementStatusEnum = Field(
        default=MeasurementStatusEnum.NOT_AVAILABLE,
        description="Validity status of this measurement.",
    )

    # --- validators -------------------------------------------------------

    @model_validator(mode="after")
    def _validate_lab_completeness(self) -> CIELABMeasurement:
        """All three Lab values must be all present or all None."""
        values = (self.l_star, self.a_star, self.b_star)
        present = [v is not None for v in values]
        if any(present) and not all(present):
            raise ValueError(
                "CIELAB values must be all present or all absent; "
                f"got l_star={'set' if present[0] else 'None'}, "
                f"a_star={'set' if present[1] else 'None'}, "
                f"b_star={'set' if present[2] else 'None'}."
            )
        return self

    @model_validator(mode="after")
    def _validate_status_requires_values(self) -> CIELABMeasurement:
        """If status is VALID the Lab triplet must be present."""
        if self.status == MeasurementStatusEnum.VALID and self.l_star is None:
            raise ValueError(
                "A measurement with status=VALID must include l_star, a_star, and b_star values."
            )
        return self

    @model_validator(mode="after")
    def _validate_lab_ranges(self) -> CIELABMeasurement:
        """L* must be 0–100; a*/b* must be −128 to 127."""
        if self.l_star is not None:
            l = float(self.l_star)
            a = float(self.a_star)  # type: ignore[arg-type]  # guaranteed by completeness check
            b = float(self.b_star)  # type: ignore[arg-type]
            if not (0.0 <= l <= 100.0):
                raise ValueError(f"L* must be between 0 and 100, got {l}.")
            if not (-128.0 <= a <= 127.0):
                raise ValueError(f"a* must be between −128 and 127, got {a}.")
            if not (-128.0 <= b <= 127.0):
                raise ValueError(f"b* must be between −128 and 127, got {b}.")
        return self


class CIELChValues(BaseModel):
    """
    CIELCh cylindrical representation derived from CIELAB.

    Provides computed chroma (C*) and hue angle (h°) from the underlying
    CIELAB a*/b* components.
    """

    model_config = ConfigDict(frozen=True)

    l_star: Decimal = Field(description="Lightness L*.")
    a_star: Decimal = Field(description="CIELAB a* (used to derive C* and h°).")
    b_star: Decimal = Field(description="CIELAB b* (used to derive C* and h°).")

    @computed_field  # type: ignore[misc]
    @property
    def chroma_c(self) -> float:
        """Chroma C* = sqrt(a*² + b*²)."""
        a = float(self.a_star)
        b = float(self.b_star)
        return math.sqrt(a * a + b * b)

    @computed_field  # type: ignore[misc]
    @property
    def hue_angle(self) -> float:
        """Hue angle h° in degrees [0, 360)."""
        a = float(self.a_star)
        b = float(self.b_star)
        h = math.degrees(math.atan2(b, a))
        if h < 0.0:
            h += 360.0
        return h


# ---------------------------------------------------------------------------
# Measurement metadata
# ---------------------------------------------------------------------------


class MeasurementMetadata(BaseModel):
    """
    Optional metadata describing the conditions under which a CIELAB
    measurement was taken.

    All fields are optional because metadata availability varies widely
    across instruments and lab environments. When present, they provide
    traceability for the measurement.
    """

    model_config = ConfigDict(frozen=True)

    illuminant: str | None = Field(
        default=None,
        description="CIE illuminant, e.g. 'D65', 'A', 'F2'.",
    )
    observer_angle: str | None = Field(
        default=None,
        description="CIE standard observer angle, e.g. '2°', '10°'.",
    )
    measurement_geometry: str | None = Field(
        default=None,
        description="Instrument geometry, e.g. 'd/8°', '45°/0°'.",
    )
    instrument_manufacturer: str | None = Field(
        default=None,
        description="Manufacturer of the measurement instrument.",
    )
    instrument_model: str | None = Field(
        default=None,
        description="Model of the measurement instrument.",
    )
    measurement_mode: str | None = Field(
        default=None,
        description="Measurement mode, e.g. 'SCI', 'SCE'.",
    )
    sample_type: str | None = Field(
        default=None,
        description="Type of sample, e.g. 'swatch', 'hair_strand'.",
    )
    sample_preparation: str | None = Field(
        default=None,
        description="Preparation procedure applied to the sample.",
    )
    sample_condition: str | None = Field(
        default=None,
        description="Condition of the sample at measurement time.",
    )
    measurement_date: date | None = Field(
        default=None,
        description="Date the measurement was taken.",
    )
    measurement_operator: str | None = Field(
        default=None,
        description="Name or identifier of the person/system that performed the measurement.",
    )


# ---------------------------------------------------------------------------
# Core UHCR record
# ---------------------------------------------------------------------------


class UHCRRecord(BaseModel):
    """
    The core UHCR JSON contract — a universal, manufacturer-neutral
    representation of a hair colour.

    This is the primary interchange object for the Nirav Hairstorm
    platform. Every shade, whether from Wella, L'Oréal, Schwarzkopf, or
    any other brand, is mapped to this universal structure.
    """

    model_config = ConfigDict(
        frozen=True,
        json_schema_extra={"description": "UHCR v1.0 universal hair colour record."},
    )

    schema_version: str = Field(
        default="1.0",
        description="UHCR specification version.",
    )
    level: UniversalLevel = Field(
        description="ICC depth level 1–10.",
    )
    primary_tone: ToneFamilyEnum = Field(
        description="Primary chromatic tone family.",
    )
    secondary_tone: ToneFamilyEnum | None = Field(
        default=None,
        description="Secondary (modifier) tone family, if any.",
    )
    tone_intensity: ToneIntensityEnum = Field(
        default=ToneIntensityEnum.UNKNOWN,
        description="Intensity of the tone expression.",
    )
    colour_family: ColourFamilyEnum | None = Field(
        default=None,
        description="Product category classification.",
    )
    measurement: CIELABMeasurement | None = Field(
        default=None,
        description="Associated CIELAB colour measurement.",
    )
    classification_status: ClassificationStatusEnum = Field(
        description="How this classification was determined.",
    )
    mapping_confidence: Decimal | None = Field(
        default=None,
        ge=0,
        le=1,
        description="Mapping confidence score, 0.0–1.0.",
    )
    evidence_reference: UUID | None = Field(
        default=None,
        description="UUID referencing the supporting evidence record.",
    )

    # --- validators -------------------------------------------------------

    @model_validator(mode="after")
    def _validate_unknown_tones_explicit(self) -> UHCRRecord:
        """
        If the primary tone is UNKNOWN, the tone_intensity must also be
        UNKNOWN — it makes no sense to have an intensity for an unknown tone.
        """
        if (
            self.primary_tone == ToneFamilyEnum.UNKNOWN
            and self.tone_intensity != ToneIntensityEnum.UNKNOWN
        ):
            raise ValueError(
                "When primary_tone is UNKNOWN, tone_intensity must also be "
                f"UNKNOWN; got tone_intensity={self.tone_intensity.value}."
            )
        return self


# ---------------------------------------------------------------------------
# Photo assessment schemas
# ---------------------------------------------------------------------------


class PhotoCaptureInfo(BaseModel):
    """
    Metadata about the photographic conditions under which a hair image
    was captured. Used to qualify the reliability of photo-based predictions.
    """

    model_config = ConfigDict(frozen=True)

    lighting_type: str | None = Field(
        default=None,
        description="Lighting type, e.g. 'natural_daylight', 'fluorescent', 'led'.",
    )
    colour_reference_present: bool | None = Field(
        default=None,
        description="Whether a colour reference card/chart was visible in the frame.",
    )
    white_balance_status: str | None = Field(
        default=None,
        description="White balance setting or status, e.g. 'auto', 'manual_5500K'.",
    )
    image_quality: str | None = Field(
        default=None,
        description="Qualitative image quality assessment, e.g. 'good', 'poor', 'overexposed'.",
    )


class PhotoRegionPrediction(BaseModel):
    """
    A per-region colour prediction derived from photographic analysis.

    Photo-based predictions are inherently less reliable than instrument
    measurements and must be flagged accordingly. A colourist may confirm
    or override the prediction.
    """

    model_config = ConfigDict(frozen=True)

    predicted_level: UniversalLevel | None = Field(
        default=None,
        description="Predicted ICC depth level.",
    )
    predicted_tone: ToneFamilyEnum | None = Field(
        default=None,
        description="Predicted primary tone family.",
    )
    confidence: Decimal | None = Field(
        default=None,
        ge=0,
        le=1,
        description="Prediction confidence, 0.0–1.0.",
    )
    colourist_confirmed: bool = Field(
        default=False,
        description="Whether a colourist has confirmed this prediction.",
    )


class PhotoAssessment(BaseModel):
    """
    Complete photo-based hair colour assessment including capture metadata
    and per-region predictions.
    """

    model_config = ConfigDict(frozen=True)

    capture: PhotoCaptureInfo = Field(
        description="Photographic capture conditions.",
    )
    regions: dict[str, PhotoRegionPrediction | None] = Field(
        default_factory=lambda: {
            HairRegionEnum.ROOTS.value: None,
            HairRegionEnum.MID_LENGTHS.value: None,
            HairRegionEnum.ENDS.value: None,
        },
        description=(
            "Per-region predictions keyed by HairRegionEnum values. "
            "Standard keys: 'ROOTS', 'MID_LENGTHS', 'ENDS'."
        ),
    )


# ---------------------------------------------------------------------------
# Hair region assessment
# ---------------------------------------------------------------------------


class HairRegionAssessment(BaseModel):
    """
    Comprehensive assessment of a single hair region (roots, mid-lengths,
    or ends) including observed colour, condition, and optional instrument
    measurement.
    """

    model_config = ConfigDict(frozen=True)

    observed_level: UniversalLevel | None = Field(
        default=None,
        description="Observed ICC depth level for this region.",
    )
    observed_undertone: ToneFamilyEnum | None = Field(
        default=None,
        description="Observed underlying tone for this region.",
    )
    existing_artificial_colour: bool | None = Field(
        default=None,
        description="Whether artificial (previously applied) colour is present.",
    )
    porosity_assessment: str | None = Field(
        default=None,
        description="Porosity level, e.g. 'low', 'medium', 'high'.",
    )
    condition_assessment: str | None = Field(
        default=None,
        description="Hair condition, e.g. 'healthy', 'damaged', 'severely_damaged'.",
    )
    previous_chemical_services: list[str] | None = Field(
        default=None,
        description="List of prior chemical services, e.g. ['perm', 'bleach', 'relaxer'].",
    )
    measurement: CIELABMeasurement | None = Field(
        default=None,
        description="Instrument CIELAB measurement for this region, if taken.",
    )
    image_reference: UUID | None = Field(
        default=None,
        description="UUID of the reference image for this region.",
    )
    assessment_confidence: Decimal | None = Field(
        default=None,
        ge=0,
        le=1,
        description="Confidence in this assessment, 0.0–1.0.",
    )
    colourist_confirmation: bool = Field(
        default=False,
        description="Whether a colourist has confirmed this assessment.",
    )
    assessment_provenance: AssessmentProvenanceEnum = Field(
        default=AssessmentProvenanceEnum.PREDICTED,
        description="How this assessment was obtained.",
    )
