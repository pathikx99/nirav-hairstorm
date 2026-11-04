"""
Formulation Service — Version 1.0.

Orchestrates formulation evaluation workflows for both PREFERRED_MANUFACTURER
and CROSS_BRAND_COMPARISON modes. Loads versioned catalogues, executes the
FormulationEngine, and formats standardized responses.
"""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.formulation.engine import FormulationEngine
from backend.app.formulation.enums import (
    FormulationResultStatusEnum,
    ProcessModeEnum,
    ServiceClassificationEnum,
)
from backend.app.formulation.schemas import (
    FormulationEvaluateRequest,
    FormulationResultResponse,
    HairAssessmentInput,
    TargetColourInput,
)
from backend.app.manufacturers.enums import (
    CatalogueStatusEnum,
    ManufacturerStatusEnum,
    VerificationStatusEnum,
)
from backend.app.models.manufacturers import (
    CatalogueVersion,
    Developer,
    Manufacturer,
    ManufacturerProduct,
    ManufacturerShade,
    ProductLine,
    ProductRule,
)


class FormulationService:
    """Domain service managing formulation execution against manufacturer databases."""

    @classmethod
    async def evaluate_formulation(
        cls,
        request: FormulationEvaluateRequest,
        db: AsyncSession,
    ) -> FormulationResultResponse:
        """
        Evaluates a formulation request.
        """
        assessment = request.assessment
        target = request.target_colour

        if assessment is None or target is None:
            raise HTTPException(
                status_code=400,
                detail="Inline assessment and target_colour objects are currently required.",
            )

        # -------------------------------------------------------------------
        # Mode 1: Preferred Manufacturer
        # -------------------------------------------------------------------
        if request.mode == ProcessModeEnum.PREFERRED_MANUFACTURER:
            mfg_id = request.manufacturer_id
            if mfg_id is None:
                raise HTTPException(
                    status_code=400,
                    detail="manufacturer_id is required in PREFERRED_MANUFACTURER mode.",
                )

            mfg = await db.get(Manufacturer, mfg_id)
            if mfg is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Manufacturer with id {mfg_id} not found.",
                )

            return await cls._evaluate_single_manufacturer(
                assessment=assessment,
                target=target,
                manufacturer=mfg,
                market=request.market,
                db=db,
            )

        # -------------------------------------------------------------------
        # Mode 2: Cross-Brand Comparison
        # -------------------------------------------------------------------
        elif request.mode == ProcessModeEnum.CROSS_BRAND_COMPARISON:
            # Query all target manufacturers or all active manufacturers
            mfg_stmt = select(Manufacturer).where(
                Manufacturer.status == ManufacturerStatusEnum.ACTIVE
            )
            if request.manufacturer_ids:
                mfg_stmt = mfg_stmt.where(Manufacturer.id.in_(request.manufacturer_ids))

            mfg_res = await db.execute(mfg_stmt)
            manufacturers = list(mfg_res.scalars().all())

            if not manufacturers:
                raise HTTPException(
                    status_code=404,
                    detail="No active manufacturers found matching comparison request.",
                )

            # Evaluate each manufacturer
            evaluated_results: list[FormulationResultResponse] = []
            for m in manufacturers:
                res = await cls._evaluate_single_manufacturer(
                    assessment=assessment,
                    target=target,
                    manufacturer=m,
                    market=request.market,
                    db=db,
                )
                evaluated_results.append(res)

            # Return the best (e.g. eligible or draft) result, or the first one with comparisons attached
            primary = evaluated_results[0]
            # Attach comparative warnings/notes
            comp_warnings = list(primary.warnings)
            comp_warnings.append(
                f"Cross-brand evaluation performed across {len(evaluated_results)} manufacturers: "
                + ", ".join(
                    [f"{r.manufacturer_name} ({r.status.value})" for r in evaluated_results]
                )
            )

            return primary.model_copy(update={"warnings": comp_warnings})

        raise HTTPException(status_code=400, detail=f"Unsupported mode: {request.mode}")

    @classmethod
    async def _evaluate_single_manufacturer(
        cls,
        assessment: HairAssessmentInput,
        target: TargetColourInput,
        manufacturer: Manufacturer,
        market: str,
        db: AsyncSession,
    ) -> FormulationResultResponse:
        """Loads manufacturer records from the database and runs FormulationEngine."""
        # 1. Fetch published catalogue version
        cat_stmt = (
            select(CatalogueVersion)
            .where(
                CatalogueVersion.manufacturer_id == manufacturer.id,
                CatalogueVersion.market == market,
                CatalogueVersion.status == CatalogueStatusEnum.PUBLISHED,
            )
            .order_by(CatalogueVersion.created_at.desc())
        )
        cat_res = await db.execute(cat_stmt)
        catalogue_version = cat_res.scalars().first()

        if catalogue_version is None:
            # Check for draft/approved
            fallback_stmt = (
                select(CatalogueVersion)
                .where(
                    CatalogueVersion.manufacturer_id == manufacturer.id,
                    CatalogueVersion.market == market,
                )
                .order_by(CatalogueVersion.created_at.desc())
            )
            fb_res = await db.execute(fallback_stmt)
            catalogue_version = fb_res.scalars().first()

        if catalogue_version is None:
            return FormulationResultResponse(
                status=FormulationResultStatusEnum.BLOCKED,
                market=market,
                manufacturer_id=manufacturer.id,
                manufacturer_name=manufacturer.name,
                catalogue_version_id=None,
                assessment_id=assessment.assessment_id,
                target_colour_id=target.target_colour_id,
                service_classification=ServiceClassificationEnum.INSUFFICIENT_INFORMATION,
                stages=[],
                regions=[],
                safety_checks=[],
                warnings=[
                    f"No verified or published catalogue found for {manufacturer.name} in market {market}."
                ],
                missing_information=["CatalogueVersion"],
            )

        # 2. Fetch product lines
        lines_stmt = select(ProductLine).where(
            ProductLine.manufacturer_id == manufacturer.id,
            ProductLine.market == market,
        )
        lines_res = await db.execute(lines_stmt)
        product_lines = list(lines_res.scalars().all())

        # 3. Fetch shades with mappings
        shades_stmt = (
            select(ManufacturerShade)
            .join(ManufacturerProduct)
            .join(ProductLine)
            .where(
                ProductLine.manufacturer_id == manufacturer.id,
                ManufacturerShade.market == market,
                ManufacturerShade.active_status.is_(True),
            )
            .options(selectinload(ManufacturerShade.shade_mappings))
        )
        shades_res = await db.execute(shades_stmt)
        shades = list(shades_res.scalars().all())

        # 4. Fetch developers
        devs_stmt = select(Developer).where(
            Developer.manufacturer_id == manufacturer.id,
            Developer.market == market,
        )
        devs_res = await db.execute(devs_stmt)
        developers = list(devs_res.scalars().all())

        # 5. Fetch verified product rules
        rules_stmt = select(ProductRule).where(
            ProductRule.market == market,
            ProductRule.verification_status == VerificationStatusEnum.VERIFIED,
        )
        rules_res = await db.execute(rules_stmt)
        rules = list(rules_res.scalars().all())

        # 6. Run FormulationEngine
        return FormulationEngine.evaluate(
            assessment=assessment,
            target=target,
            manufacturer=manufacturer,
            product_lines=product_lines,
            shades=shades,
            developers=developers,
            rules=rules,
            catalogue_version=catalogue_version,
        )
