"""
Formulation Engine Package — Version 1.0.

Provides deterministic feasibility classification, safety validation,
multi-stage process sequencing, and regional formulation plans.
"""

from backend.app.formulation.classifier import FeasibilityClassifier
from backend.app.formulation.engine import FormulationEngine
from backend.app.formulation.enums import (
    ApplicationTechniqueEnum,
    FormulationResultStatusEnum,
    HairConditionEnum,
    PorosityEnum,
    ProcessModeEnum,
    SafetyStatusEnum,
    ServiceClassificationEnum,
)
from backend.app.formulation.safety import SafetyValidationService
from backend.app.formulation.schemas import (
    ClientHistoryInput,
    DeveloperComponentFormula,
    FormulationEvaluateRequest,
    FormulationResultResponse,
    FormulationStage,
    HairAssessmentInput,
    HairRegionInput,
    PredictedResult,
    ProductComponentFormula,
    RegionFormulationPlan,
    SafetyCheckResult,
    TargetColourInput,
)
from backend.app.formulation.service import FormulationService

__all__ = [
    "ApplicationTechniqueEnum",
    "ClientHistoryInput",
    "DeveloperComponentFormula",
    "FeasibilityClassifier",
    "FormulationEngine",
    "FormulationEvaluateRequest",
    "FormulationResultResponse",
    "FormulationResultStatusEnum",
    "FormulationService",
    "FormulationStage",
    "HairAssessmentInput",
    "HairConditionEnum",
    "HairRegionInput",
    "PorosityEnum",
    "PredictedResult",
    "ProcessModeEnum",
    "ProductComponentFormula",
    "RegionFormulationPlan",
    "SafetyCheckResult",
    "SafetyStatusEnum",
    "SafetyValidationService",
    "ServiceClassificationEnum",
    "TargetColourInput",
]
