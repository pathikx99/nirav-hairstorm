"""
Formulation API Router — Version 1.0.

Provides endpoints for formulation evaluation, safety validation,
and multi-stage process generation conforming to Technical Specification §5.13.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import get_db
from backend.app.formulation.schemas import (
    FormulationEvaluateRequest,
    FormulationResultResponse,
)
from backend.app.formulation.service import FormulationService

router = APIRouter(prefix="/formulations", tags=["Formulations"])


@router.post(
    "/evaluate",
    response_model=FormulationResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate hair colour formulation feasibility and generate technical stages",
    description=(
        "Evaluates process feasibility, executes safety and contraindication checks, "
        "and generates deterministic, reproducible formulation stages based on verified manufacturer rules."
    ),
)
async def evaluate_formulation(
    request: FormulationEvaluateRequest,
    db: AsyncSession = Depends(get_db),
) -> FormulationResultResponse:
    """Evaluates starting hair and target look to produce a verified formulation plan."""
    return await FormulationService.evaluate_formulation(request=request, db=db)
