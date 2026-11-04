"""Domain-specific exceptions for the Hairstorm platform.

Every exception carries a machine-readable ``code`` and a human-readable
``detail`` message.  FastAPI exception handlers translate these into the
appropriate HTTP responses.
"""

from __future__ import annotations


class HairstormError(Exception):
    """Base exception for all Hairstorm domain errors."""

    code: str = "HAIRSTORM_ERROR"

    def __init__(self, detail: str = "An unexpected error occurred.") -> None:
        self.detail = detail
        super().__init__(self.detail)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(code={self.code!r}, detail={self.detail!r})"


class ValidationError(HairstormError):
    """Raised when domain-level validation fails.

    Distinct from Pydantic's ``ValidationError`` — this covers business-rule
    violations such as invalid shade-code formats or out-of-range concentrations.
    """

    code = "VALIDATION_ERROR"

    def __init__(self, detail: str = "Validation failed.") -> None:
        super().__init__(detail)


class NotFoundError(HairstormError):
    """Raised when a requested resource does not exist."""

    code = "NOT_FOUND"

    def __init__(self, detail: str = "Resource not found.") -> None:
        super().__init__(detail)


class VerificationError(HairstormError):
    """Raised when a verification check fails.

    E.g. a shade record cannot be promoted to 'verified' because its
    spectrophotometer data is inconsistent with the declared CIE L*a*b* values.
    """

    code = "VERIFICATION_ERROR"

    def __init__(self, detail: str = "Verification failed.") -> None:
        super().__init__(detail)


class InsufficientEvidenceError(HairstormError):
    """Raised when an action requires supporting evidence that is missing.

    Per UHCR v1: every verified record must reference supporting evidence.
    """

    code = "INSUFFICIENT_EVIDENCE"

    def __init__(self, detail: str = "Insufficient supporting evidence.") -> None:
        super().__init__(detail)


class SafetyBlockError(HairstormError):
    """Raised when a formulation request is blocked for safety reasons.

    Per UHCR v1: unverified data must never generate executable formulations.
    """

    code = "SAFETY_BLOCK"

    def __init__(
        self,
        detail: str = "Formulation blocked: unverified data cannot produce executable formulations.",
    ) -> None:
        super().__init__(detail)


class CatalogueNotPublishedError(HairstormError):
    """Raised when accessing a manufacturer catalogue that hasn't been published yet."""

    code = "CATALOGUE_NOT_PUBLISHED"

    def __init__(
        self,
        detail: str = "Manufacturer catalogue has not been published.",
    ) -> None:
        super().__init__(detail)
