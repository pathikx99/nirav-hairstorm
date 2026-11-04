"""
UHCR v1.0 — Standalone Validation Functions.

These functions provide reusable, composable validation logic that can be
called independently of the Pydantic schemas (e.g., in API endpoints, service
layers, or pre-processing pipelines).
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from backend.app.universal_colour.enums import (
    AssessmentProvenanceEnum,
    MeasurementStatusEnum,
    ToneFamilyEnum,
)


def validate_uhcr_level(level: int) -> bool:
    """
    Validate that a universal depth level is within the ICC range 1–10.

    Parameters
    ----------
    level : int
        The depth level to validate.

    Returns
    -------
    bool
        ``True`` if the level is between 1 and 10 inclusive.

    Examples
    --------
    >>> validate_uhcr_level(5)
    True
    >>> validate_uhcr_level(0)
    False
    >>> validate_uhcr_level(11)
    False
    """
    return isinstance(level, int) and 1 <= level <= 10


def validate_tone(tone: str) -> bool:
    """
    Validate that a tone string is a member of ``ToneFamilyEnum``.

    Parameters
    ----------
    tone : str
        The tone value to validate (case-sensitive).

    Returns
    -------
    bool
        ``True`` if ``tone`` is a valid ToneFamilyEnum member value.

    Examples
    --------
    >>> validate_tone("ASH")
    True
    >>> validate_tone("SPARKLE")
    False
    """
    try:
        ToneFamilyEnum(tone)
        return True
    except ValueError:
        return False


def validate_confidence(confidence: float | Decimal) -> bool:
    """
    Validate that a confidence score is in the range [0, 1].

    Parameters
    ----------
    confidence : float | Decimal
        The confidence value to validate.

    Returns
    -------
    bool
        ``True`` if the confidence is between 0 and 1 inclusive.

    Examples
    --------
    >>> validate_confidence(0.85)
    True
    >>> validate_confidence(1.5)
    False
    >>> validate_confidence(-0.1)
    False
    """
    try:
        c = float(confidence)
    except (TypeError, ValueError):
        return False
    return 0.0 <= c <= 1.0


def validate_lab_completeness(
    l: float | Decimal | None,
    a: float | Decimal | None,
    b: float | Decimal | None,
) -> bool:
    """
    Validate that CIELAB values are either all present or all ``None``.

    Partial Lab data is never valid — you must have the full triplet or no
    measurement at all.

    Parameters
    ----------
    l, a, b : Optional[float | Decimal]
        The three CIELAB components.

    Returns
    -------
    bool
        ``True`` if all three are provided or all three are ``None``.

    Examples
    --------
    >>> validate_lab_completeness(50.0, 10.0, -20.0)
    True
    >>> validate_lab_completeness(None, None, None)
    True
    >>> validate_lab_completeness(50.0, None, -20.0)
    False
    """
    present = (l is not None, a is not None, b is not None)
    return all(present) or not any(present)


def validate_measurement_with_metadata(
    measurement: Any,
    metadata: Any,
) -> bool:
    """
    Validate that a ``VALID`` measurement has accompanying metadata.

    If the measurement status is ``VALID``, metadata must be provided (not
    ``None``). Measurements with other statuses do not require metadata.

    Parameters
    ----------
    measurement : Any
        An object with a ``status`` attribute (e.g., ``CIELABMeasurement``),
        or ``None``.
    metadata : Any
        An object representing measurement metadata (e.g.,
        ``MeasurementMetadata``), or ``None``.

    Returns
    -------
    bool
        ``True`` if the validation passes.

    Examples
    --------
    A ``VALID`` measurement without metadata fails:

    >>> class M:
    ...     status = MeasurementStatusEnum.VALID
    >>> validate_measurement_with_metadata(M(), None)
    False

    A ``PROVISIONAL`` measurement without metadata is acceptable:

    >>> class M:
    ...     status = MeasurementStatusEnum.PROVISIONAL
    >>> validate_measurement_with_metadata(M(), None)
    True
    """
    if measurement is None:
        return True
    return not (
        hasattr(measurement, "status")
        and measurement.status == MeasurementStatusEnum.VALID
        and metadata is None
    )


def validate_photo_prediction_not_instrument(
    provenance: AssessmentProvenanceEnum | str,
    source: str,
) -> bool:
    """
    Validate that a photo-based prediction is never labelled as an
    instrument measurement.

    Photo-derived colour assessments are inherently less reliable than
    spectrophotometric measurements. Labelling a photo prediction as
    ``INSTRUMENT_MEASURED`` would violate the UHCR data integrity rules
    and could lead to unsafe formulation decisions.

    Parameters
    ----------
    provenance : AssessmentProvenanceEnum | str
        The provenance classification of the assessment.
    source : str
        The data source identifier (e.g., ``"photo"``, ``"instrument"``,
        ``"manual"``).

    Returns
    -------
    bool
        ``True`` if the combination is valid (i.e., photo sources are not
        labelled as instrument measurements).

    Examples
    --------
    >>> validate_photo_prediction_not_instrument(
    ...     AssessmentProvenanceEnum.PREDICTED, "photo"
    ... )
    True
    >>> validate_photo_prediction_not_instrument(
    ...     AssessmentProvenanceEnum.INSTRUMENT_MEASURED, "photo"
    ... )
    False
    >>> validate_photo_prediction_not_instrument(
    ...     AssessmentProvenanceEnum.INSTRUMENT_MEASURED, "instrument"
    ... )
    True
    """
    # Normalise to string for comparison
    if isinstance(provenance, AssessmentProvenanceEnum):
        provenance_str = provenance.value
    else:
        provenance_str = str(provenance)

    source_lower = source.strip().lower()

    return not (
        source_lower == "photo"
        and provenance_str == AssessmentProvenanceEnum.INSTRUMENT_MEASURED.value
    )
