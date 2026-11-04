"""
UHCR v1.0 — Universal Colour Service.

High-level domain service providing operations on UHCR records, colour distance
calculations, conversions, neutralisation directions, and validation.
"""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from backend.app.universal_colour.colour_science import (
    NEUTRALISATION_MAP,
    ciede2000,
)
from backend.app.universal_colour.enums import (
    ClassificationStatusEnum,
    ColourFamilyEnum,
    MeasurementStatusEnum,
    NeutralisationDirectionEnum,
    NeutralisationWarmthEnum,
    ToneFamilyEnum,
    ToneIntensityEnum,
    UniversalLevel,
)
from backend.app.universal_colour.schemas import (
    CIELABMeasurement,
    CIELChValues,
    UHCRRecord,
)


class UniversalColourService:
    """
    Service responsible for constructing, validating, and performing
    colour-science operations on UHCR records.
    """

    @staticmethod
    def create_uhcr_record(
        level: int | UniversalLevel,
        primary_tone: str | ToneFamilyEnum,
        secondary_tone: str | ToneFamilyEnum | None = None,
        tone_intensity: str | ToneIntensityEnum = ToneIntensityEnum.UNKNOWN,
        colour_family: str | ColourFamilyEnum | None = None,
        l_star: float | Decimal | None = None,
        a_star: float | Decimal | None = None,
        b_star: float | Decimal | None = None,
        measurement_status: MeasurementStatusEnum = MeasurementStatusEnum.NOT_AVAILABLE,
        classification_status: ClassificationStatusEnum = ClassificationStatusEnum.PREDICTED,
        mapping_confidence: float | Decimal | None = None,
        evidence_reference: UUID | None = None,
    ) -> UHCRRecord:
        """
        Factory helper to create a fully validated UHCRRecord.
        """
        lvl = UniversalLevel(int(level))
        pt = ToneFamilyEnum(primary_tone) if isinstance(primary_tone, str) else primary_tone
        st = ToneFamilyEnum(secondary_tone) if isinstance(secondary_tone, str) else secondary_tone
        ti = (
            ToneIntensityEnum(tone_intensity)
            if isinstance(tone_intensity, str)
            else tone_intensity
        )
        cf = ColourFamilyEnum(colour_family) if isinstance(colour_family, str) else colour_family

        measurement: CIELABMeasurement | None = None
        if (
            l_star is not None
            or a_star is not None
            or b_star is not None
            or measurement_status != MeasurementStatusEnum.NOT_AVAILABLE
        ):
            measurement = CIELABMeasurement(
                l_star=Decimal(str(l_star)) if l_star is not None else None,
                a_star=Decimal(str(a_star)) if a_star is not None else None,
                b_star=Decimal(str(b_star)) if b_star is not None else None,
                status=measurement_status,
            )

        conf = Decimal(str(mapping_confidence)) if mapping_confidence is not None else None

        return UHCRRecord(
            schema_version="1.0",
            level=lvl,
            primary_tone=pt,
            secondary_tone=st,
            tone_intensity=ti,
            colour_family=cf,
            measurement=measurement,
            classification_status=classification_status,
            mapping_confidence=conf,
            evidence_reference=evidence_reference,
        )

    @staticmethod
    def calculate_colour_distance(
        record_1: UHCRRecord,
        record_2: UHCRRecord,
    ) -> float | None:
        """
        Calculate the CIEDE2000 colour distance (ΔE₀₀) between two UHCR records.

        Returns None if either record lacks a VALID physical colour measurement.
        """
        m1 = record_1.measurement
        m2 = record_2.measurement

        if (
            m1 is None
            or m2 is None
            or m1.status != MeasurementStatusEnum.VALID
            or m2.status != MeasurementStatusEnum.VALID
            or m1.l_star is None
            or m1.a_star is None
            or m1.b_star is None
            or m2.l_star is None
            or m2.a_star is None
            or m2.b_star is None
        ):
            return None

        return ciede2000(
            float(m1.l_star),
            float(m1.a_star),
            float(m1.b_star),
            float(m2.l_star),
            float(m2.a_star),
            float(m2.b_star),
        )

    @staticmethod
    def convert_to_cielch(record: UHCRRecord) -> CIELChValues | None:
        """
        Convert the record's CIELAB measurement into CIELCh values.
        Returns None if no measurement values exist.
        """
        m = record.measurement
        if m is None or m.l_star is None or m.a_star is None or m.b_star is None:
            return None

        return CIELChValues(
            l_star=m.l_star,
            a_star=m.a_star,
            b_star=m.b_star,
        )

    @staticmethod
    def get_neutralisation_direction(
        warmth: NeutralisationWarmthEnum,
    ) -> NeutralisationDirectionEnum:
        """
        Look up the complementary corrective direction for an exposed warm undertone.
        """
        return NEUTRALISATION_MAP[warmth]

    @staticmethod
    def validate_uhcr_record(record: UHCRRecord) -> list[str]:
        """
        Perform domain checks and return a list of issue descriptions.
        An empty list indicates full compliance.
        """
        issues: list[str] = []

        # Check level
        if not (1 <= record.level <= 10):
            issues.append(f"Level {record.level} outside ICC scale 1-10.")

        # Check measurement consistency
        if record.measurement is not None:
            m = record.measurement
            if m.status == MeasurementStatusEnum.VALID and (
                m.l_star is None or m.a_star is None or m.b_star is None
            ):
                issues.append("VALID status requires L*, a*, and b* values.")

        # Check unknown tone logic
        if (
            record.primary_tone == ToneFamilyEnum.UNKNOWN
            and record.tone_intensity != ToneIntensityEnum.UNKNOWN
        ):
            issues.append(
                f"Tone intensity cannot be '{record.tone_intensity.value}' when primary tone is UNKNOWN."
            )

        return issues
