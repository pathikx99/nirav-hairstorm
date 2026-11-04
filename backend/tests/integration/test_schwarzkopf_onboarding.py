"""Integration tests for Milestone 7: Manufacturer Expansion (Schwarzkopf Onboarding via CatalogueImporter)."""

from __future__ import annotations

from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.manufacturers.importer import CatalogueImporter
from backend.app.models.manufacturers import (
    Manufacturer,
    ManufacturerShade,
    ShadeMapping,
)


@pytest.mark.asyncio
async def test_schwarzkopf_catalogue_import_and_idempotency(db_session: AsyncSession):
    """
    Test onboarding Schwarzkopf Professional India using the generic CatalogueImporter.
    Verifies Section 9 workflow and Section 10 Milestone 7 requirements.
    """
    schwarzkopf_dir = Path("data/manufacturers/schwarzkopf")
    assert schwarzkopf_dir.exists(), "Schwarzkopf data directory must exist"

    # 1. First Import
    result = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=schwarzkopf_dir,
        market="IN",
    )

    assert result["status"] == "SUCCESS"
    assert result["manufacturer_name"] == "Schwarzkopf Professional"
    assert result["catalogue_completeness"] == "APPROVED_FOR_PRODUCTION"

    counts = result["counts"]
    assert counts["manufacturers"] == 1
    assert counts["source_documents"] == 1
    assert counts["catalogue_versions"] == 1
    assert counts["product_lines"] == 1
    assert counts["products"] == 1
    assert counts["shades"] >= 18
    assert counts["developers"] == 4
    assert counts["product_rules"] == 4

    # 2. Database entity verification
    m_res = await db_session.execute(
        select(Manufacturer).where(Manufacturer.slug == "schwarzkopf-india")
    )
    m = m_res.scalar_one_or_none()
    assert m is not None
    assert m.name == "Schwarzkopf Professional"

    # Verify shade 7-77 (Copper Extra)
    s_res = await db_session.execute(
        select(ManufacturerShade).where(
            ManufacturerShade.shade_code == "7-77",
            ManufacturerShade.market == "IN",
        )
    )
    shade_7_77 = s_res.scalar_one_or_none()
    assert shade_7_77 is not None
    assert shade_7_77.shade_name == "Igora Royal 7-77 Medium Blonde Copper Extra"
    assert shade_7_77.manufacturer_tone_code == "77"

    # Verify UHCR Mapping for 7-77
    map_res = await db_session.execute(
        select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_7_77.id)
    )
    mapping_7_77 = map_res.scalar_one_or_none()
    assert mapping_7_77 is not None
    assert mapping_7_77.uhcr_level == 7
    assert mapping_7_77.primary_tone == "COPPER"
    assert mapping_7_77.secondary_tone == "COPPER"
    assert mapping_7_77.tone_intensity == "EXTRA_INTENSE"

    # Verify shade 7-1 (Cendré / Ash)
    s_ash_res = await db_session.execute(
        select(ManufacturerShade).where(
            ManufacturerShade.shade_code == "7-1",
            ManufacturerShade.market == "IN",
        )
    )
    shade_7_1 = s_ash_res.scalar_one_or_none()
    assert shade_7_1 is not None

    map_ash_res = await db_session.execute(
        select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_7_1.id)
    )
    mapping_7_1 = map_ash_res.scalar_one_or_none()
    assert mapping_7_1 is not None
    assert mapping_7_1.uhcr_level == 7
    assert mapping_7_1.primary_tone == "ASH"

    # 3. Idempotency Check: Re-importing must not duplicate entities
    second_run = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=schwarzkopf_dir,
        market="IN",
    )
    assert second_run["status"] == "SUCCESS"
    assert second_run["counts"]["manufacturers"] == 0
    assert second_run["counts"]["shades"] == 0
    assert second_run["counts"]["developers"] == 0
    assert second_run["counts"]["product_rules"] == 0
