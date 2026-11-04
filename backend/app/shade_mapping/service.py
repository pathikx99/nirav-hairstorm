"""
Shade Mapping Engine v1.0 — Core Domain Service.

Executes candidate shade search across manufacturers, evaluating:
- Hard eligibility filters (market, published status, category, verified mappings)
- Level distance D_L
- Versioned tone relationship matrix D_T
- Intensity distance D_I
- CIEDE2000 physical measurement distance D_C
- Categorical match classification and confidence tiering
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.manufacturers.enums import (
    CatalogueStatusEnum,
    ManufacturerStatusEnum,
    VerificationStatusEnum,
)
from backend.app.models.manufacturers import (
    CatalogueVersion,
    Manufacturer,
    ManufacturerProduct,
    ManufacturerShade,
    ProductLine,
    ShadeMapping,
)
from backend.app.shade_mapping.distance import (
    calculate_composite_distance,
    calculate_intensity_distance,
    calculate_level_distance,
)
from backend.app.shade_mapping.enums import (
    ChemicalEquivalenceEnum,
    ConfidenceTierEnum,
    MatchClassificationEnum,
)
from backend.app.shade_mapping.schemas import (
    CandidateShadeResult,
    CrossBrandCompareRequest,
    CrossBrandCompareResponse,
)
from backend.app.shade_mapping.tone_matrix import calculate_compound_tone_distance
from backend.app.universal_colour.enums import (
    MeasurementStatusEnum,
    ToneFamilyEnum,
    ToneIntensityEnum,
)


class ShadeMappingEngine:
    """
    Search and comparison engine for cross-brand hair colour candidates.
    """

    @classmethod
    async def compare_shades(
        cls,
        session: AsyncSession,
        request: CrossBrandCompareRequest,
    ) -> CrossBrandCompareResponse:
        """
        Identify and rank candidate shades matching the target universal colour
        across all eligible manufacturers.
        """
        target = request.target
        target_level = int(target.level)
        target_primary = target.primary_tone
        target_secondary = target.secondary_tone
        target_intensity = target.tone_intensity

        # ── 1. Query with Hard Eligibility Filters ────────────────────────
        stmt = (
            select(ManufacturerShade)
            .join(ManufacturerProduct, ManufacturerShade.product_id == ManufacturerProduct.id)
            .join(ProductLine, ManufacturerProduct.product_line_id == ProductLine.id)
            .join(Manufacturer, ProductLine.manufacturer_id == Manufacturer.id)
            .join(CatalogueVersion, ManufacturerShade.catalogue_version_id == CatalogueVersion.id)
            .join(ShadeMapping, ShadeMapping.manufacturer_shade_id == ManufacturerShade.id)
            .options(
                selectinload(ManufacturerShade.shade_mappings),
                selectinload(ManufacturerShade.product)
                .selectinload(ManufacturerProduct.product_line)
                .selectinload(ProductLine.manufacturer),
                selectinload(ManufacturerShade.catalogue_version),
            )
            .where(
                ManufacturerShade.market == request.market,
                ManufacturerShade.active_status.is_(True),
                Manufacturer.status == ManufacturerStatusEnum.ACTIVE.value,
                CatalogueVersion.status == CatalogueStatusEnum.PUBLISHED.value,
            )
        )

        if request.require_verified_mapping:
            stmt = stmt.where(
                ShadeMapping.verification_status == VerificationStatusEnum.VERIFIED.value
            )

        if request.product_categories:
            stmt = stmt.where(ProductLine.service_type.in_(request.product_categories))

        if request.manufacturer_ids:
            stmt = stmt.where(Manufacturer.id.in_(request.manufacturer_ids))

        # Filter by maximum depth level delta
        min_lvl = max(1, target_level - request.max_level_difference)
        max_lvl = min(10, target_level + request.max_level_difference)
        stmt = stmt.where(ShadeMapping.uhcr_level.between(min_lvl, max_lvl))

        res = await session.execute(stmt)
        shades = res.scalars().unique().all()

        # ── 2. Evaluate Candidates & Calculate Distances ──────────────────
        candidates: list[CandidateShadeResult] = []
        catalogue_versions_map: dict[UUID, dict[str, Any]] = {}

        for shade in shades:
            if not shade.shade_mappings:
                continue
            mapping = shade.shade_mappings[0]

            # Track catalogue version for reproducibility (Principle 10)
            cat = shade.catalogue_version
            if cat.id not in catalogue_versions_map:
                catalogue_versions_map[cat.id] = {
                    "catalogue_version_id": str(cat.id),
                    "manufacturer_id": str(cat.manufacturer_id),
                    "market": cat.market,
                    "version": cat.version,
                    "status": cat.status,
                }

            cand_level = int(mapping.uhcr_level)
            cand_primary = (
                ToneFamilyEnum(mapping.primary_tone)
                if mapping.primary_tone in ToneFamilyEnum._value2member_map_
                else ToneFamilyEnum.UNKNOWN
            )
            cand_secondary = (
                ToneFamilyEnum(mapping.secondary_tone)
                if mapping.secondary_tone in ToneFamilyEnum._value2member_map_
                else None
            )
            cand_intensity = (
                ToneIntensityEnum(mapping.tone_intensity)
                if mapping.tone_intensity in ToneIntensityEnum._value2member_map_
                else ToneIntensityEnum.UNKNOWN
            )

            # Distances
            d_l = calculate_level_distance(target_level, cand_level)
            d_t = calculate_compound_tone_distance(
                target_primary, target_secondary, cand_primary, cand_secondary
            )
            calculate_intensity_distance(target_intensity, cand_intensity)

            # CIEDE2000 physical colour difference if both swatches measured
            delta_e: float | None = None
            if (
                request.include_physical_measurements
                and target.measurement is not None
                and target.measurement.status == MeasurementStatusEnum.VALID
                and target.measurement.l_star is not None
                and target.measurement.a_star is not None
                and target.measurement.b_star is not None
            ):
                # When physical swatch measurement exists on candidate:
                pass  # Available when swatch dataset is integrated

            comp_dist = calculate_composite_distance(
                target_level=target_level,
                target_primary_tone=target_primary,
                target_secondary_tone=target_secondary,
                target_intensity=target_intensity,
                candidate_level=cand_level,
                candidate_primary_tone=cand_primary,
                candidate_secondary_tone=cand_secondary,
                candidate_intensity=cand_intensity,
                delta_e00=delta_e,
            )

            # Match classification
            if delta_e is not None and delta_e <= 3.0:
                match_class = MatchClassificationEnum.MEASURED_COLOUR_MATCH
            elif mapping.verification_status == VerificationStatusEnum.VERIFIED.value:
                match_class = MatchClassificationEnum.THEORETICAL_SHADE_MATCH
            else:
                match_class = MatchClassificationEnum.INSUFFICIENT_EVIDENCE

            # Categorical confidence
            conf = cls._determine_confidence(
                verification_status=mapping.verification_status,
                has_evidence=mapping.evidence_reference is not None,
                level_distance=d_l,
                tone_distance=d_t,
                delta_e00=delta_e,
            )

            product = shade.product
            product_line = product.product_line
            manufacturer = product_line.manufacturer

            candidates.append(
                CandidateShadeResult(
                    manufacturer=manufacturer.name,
                    manufacturer_id=manufacturer.id,
                    product_line=product_line.name,
                    product_line_id=product_line.id,
                    product_name=product.product_name,
                    product_id=product.id,
                    shade_id=shade.id,
                    shade_code=shade.shade_code,  # Verbatim notation (7/1, 7.1, 7A)
                    shade_name=shade.shade_name,
                    universal_mapping={
                        "level": mapping.uhcr_level,
                        "primary_tone": mapping.primary_tone,
                        "secondary_tone": mapping.secondary_tone,
                        "tone_intensity": mapping.tone_intensity,
                        "colour_family": mapping.colour_family,
                    },
                    match_classification=match_class,
                    measured_delta_e00=delta_e,
                    evidence_quality=mapping.mapping_method,
                    mapping_status=mapping.verification_status,
                    chemical_equivalence=ChemicalEquivalenceEnum.NOT_ESTABLISHED,
                    confidence=conf,
                    composite_distance=round(comp_dist, 4),
                    level_distance=d_l,
                    tone_distance=round(d_t, 4),
                )
            )

        # ── 3. Rank Candidates by Composite Distance ─────────────────────
        candidates.sort(key=lambda c: c.composite_distance)
        limited_candidates = candidates[: request.limit]

        return CrossBrandCompareResponse(
            results=limited_candidates,
            total=len(candidates),
            catalogue_versions=list(catalogue_versions_map.values()),
            mapping_engine_version="1.0",
        )

    @staticmethod
    def _determine_confidence(
        verification_status: str,
        has_evidence: bool,
        level_distance: float,
        tone_distance: float,
        delta_e00: float | None = None,
    ) -> ConfidenceTierEnum:
        """
        Categorical confidence based on verification rigor and tonal proximity.
        """
        if verification_status != VerificationStatusEnum.VERIFIED.value:
            return ConfidenceTierEnum.INSUFFICIENT

        if delta_e00 is not None:
            if delta_e00 <= 1.5:
                return ConfidenceTierEnum.HIGH
            if delta_e00 <= 3.0:
                return ConfidenceTierEnum.MEDIUM
            return ConfidenceTierEnum.LOW

        # Theoretical match confidence
        if level_distance == 0 and tone_distance <= 0.20 and has_evidence:
            return ConfidenceTierEnum.HIGH
        elif level_distance <= 1 and tone_distance <= 0.40:
            return ConfidenceTierEnum.MEDIUM
        elif level_distance <= 2 and tone_distance <= 0.60:
            return ConfidenceTierEnum.LOW

        return ConfidenceTierEnum.INSUFFICIENT
