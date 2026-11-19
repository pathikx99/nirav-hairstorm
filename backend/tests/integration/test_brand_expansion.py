"""Integration tests for Brand Data Expansion:
- Alfaparf Milano Professional (Evolution of the Color)
- Proads Professional (Absolute Premium Permanent Hair Color)
- Wella Professionals expansions (Illumina Color & Pure Perfection)
"""

from __future__ import annotations

from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.manufacturers.importer import CatalogueImporter
from backend.app.manufacturers.wella_seeder import seed_wella_india
from backend.app.models.manufacturers import (
    Developer,
    Manufacturer,
    ManufacturerProduct,
    ManufacturerShade,
    ProductLine,
    ProductRule,
    ShadeMapping,
)


@pytest.mark.asyncio
async def test_alfaparf_catalogue_import_and_idempotency(db_session: AsyncSession):
    """Test onboarding Alfaparf Milano Professional India via CatalogueImporter."""
    alfaparf_dir = Path("data/manufacturers/alfaparf")
    assert alfaparf_dir.exists(), "Alfaparf data directory must exist"

    # 1. First Import
    result = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=alfaparf_dir,
        market="IN",
    )

    assert result["status"] == "SUCCESS"
    assert result["manufacturer_name"] == "Alfaparf Milano Professional"
    assert result["catalogue_completeness"] == "APPROVED_FOR_PRODUCTION"

    counts = result["counts"]
    assert counts["manufacturers"] == 1
    assert counts["source_documents"] == 1
    assert counts["catalogue_versions"] == 1
    assert counts["product_lines"] == 1
    assert counts["products"] == 1
    assert counts["shades"] == 119
    assert counts["developers"] == 5
    assert counts["product_rules"] == 5

    # 2. Database entity verification
    m_res = await db_session.execute(
        select(Manufacturer).where(Manufacturer.slug == "alfaparf-milano-india")
    )
    m = m_res.scalar_one_or_none()
    assert m is not None
    assert m.name == "Alfaparf Milano Professional"
    assert m.country_of_origin == "Italy"

    # Verify shade 7.32 (Medium Golden Irisé Blonde)
    s_res = await db_session.execute(
        select(ManufacturerShade).where(
            ManufacturerShade.shade_code == "7.32",
            ManufacturerShade.market == "IN",
        )
    )
    shade_7_32 = s_res.scalar_one_or_none()
    assert shade_7_32 is not None
    assert "Golden" in shade_7_32.shade_name
    assert shade_7_32.manufacturer_tone_code == "32"

    map_res = await db_session.execute(
        select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_7_32.id)
    )
    mapping_7_32 = map_res.scalar_one_or_none()
    assert mapping_7_32 is not None
    assert mapping_7_32.uhcr_level == 7
    assert mapping_7_32.primary_tone == "GOLD"
    assert mapping_7_32.secondary_tone == "VIOLET"

    # Verify Platinum shade 11.11 (Platinum Intense Ash)
    s_plat_res = await db_session.execute(
        select(ManufacturerShade).where(
            ManufacturerShade.shade_code == "11.11",
            ManufacturerShade.market == "IN",
        )
    )
    shade_11_11 = s_plat_res.scalar_one_or_none()
    assert shade_11_11 is not None

    map_plat_res = await db_session.execute(
        select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_11_11.id)
    )
    mapping_11_11 = map_plat_res.scalar_one_or_none()
    assert mapping_11_11 is not None
    assert mapping_11_11.uhcr_level == 10
    assert mapping_11_11.primary_tone == "ASH"
    assert mapping_11_11.secondary_tone is None
    assert mapping_11_11.tone_intensity == "INTENSE"
    assert mapping_11_11.colour_family == "HIGH_LIFT"

    # Verify Developers (5 Oxid'o developers)
    dev_res = await db_session.execute(
        select(Developer).where(Developer.manufacturer_id == m.id)
    )
    devs = dev_res.scalars().all()
    assert len(devs) == 5
    dev_names = {d.product_name for d in devs}
    assert any("Oxid'o 10 Vol" in name for name in dev_names)
    assert any("Oxid'o 20 Vol" in name for name in dev_names)
    assert any("Oxid'o 30 Vol" in name for name in dev_names)
    assert any("Oxid'o 40 Vol" in name for name in dev_names)

    # Verify Product Rules (5 rules)
    rule_res = await db_session.execute(
        select(ProductRule).where(ProductRule.market == "IN")
    )
    rules = [r for r in rule_res.scalars().all() if "ALFAPARF" in str(r.actions) or "Evolution" in str(r.conditions)]
    assert len(rules) >= 5

    # 3. Idempotency Check
    second_run = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=alfaparf_dir,
        market="IN",
    )
    c2 = second_run["counts"]
    assert c2["manufacturers"] == 0
    assert c2["shades"] == 0
    assert c2["developers"] == 0
    assert c2["product_rules"] == 0


@pytest.mark.asyncio
async def test_proads_catalogue_import_and_idempotency(db_session: AsyncSession):
    """Test onboarding Proads Professional India via CatalogueImporter."""
    proads_dir = Path("data/manufacturers/proads")
    assert proads_dir.exists(), "Proads data directory must exist"

    # 1. First Import
    result = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=proads_dir,
        market="IN",
    )

    assert result["status"] == "SUCCESS"
    assert result["manufacturer_name"] == "Proads Professional"
    assert result["catalogue_completeness"] == "APPROVED_FOR_PRODUCTION"

    counts = result["counts"]
    assert counts["manufacturers"] == 1
    assert counts["source_documents"] == 1
    assert counts["catalogue_versions"] == 1
    assert counts["product_lines"] == 1
    assert counts["products"] == 1
    assert counts["shades"] == 118
    assert counts["developers"] == 4
    assert counts["product_rules"] == 4

    # 2. Database entity verification
    m_res = await db_session.execute(
        select(Manufacturer).where(Manufacturer.slug == "proads-professional-india")
    )
    m = m_res.scalar_one_or_none()
    assert m is not None
    assert m.name == "Proads Professional"

    # Verify shade 6.13 (Dark Ash Golden Blonde)
    s_res = await db_session.execute(
        select(ManufacturerShade).where(
            ManufacturerShade.shade_code == "6.13",
            ManufacturerShade.market == "IN",
        )
    )
    shade_6_13 = s_res.scalar_one_or_none()
    assert shade_6_13 is not None
    assert shade_6_13.manufacturer_tone_code == "13"

    map_res = await db_session.execute(
        select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_6_13.id)
    )
    mapping_6_13 = map_res.scalar_one_or_none()
    assert mapping_6_13 is not None
    assert mapping_6_13.uhcr_level == 6
    assert mapping_6_13.primary_tone == "ASH"
    assert mapping_6_13.secondary_tone == "GOLD"

    # Verify Highlift shade 13.00
    s_13_res = await db_session.execute(
        select(ManufacturerShade).where(
            ManufacturerShade.shade_code == "13.00",
            ManufacturerShade.market == "IN",
        )
    )
    shade_13_00 = s_13_res.scalar_one_or_none()
    assert shade_13_00 is not None

    map_13_res = await db_session.execute(
        select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_13_00.id)
    )
    mapping_13_00 = map_13_res.scalar_one_or_none()
    assert mapping_13_00 is not None
    assert mapping_13_00.uhcr_level == 10
    assert mapping_13_00.colour_family == "HIGH_LIFT"

    # Verify Developers (4 developers)
    dev_res = await db_session.execute(
        select(Developer).where(Developer.manufacturer_id == m.id)
    )
    devs = dev_res.scalars().all()
    assert len(devs) == 4

    # 3. Idempotency Check
    second_run = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=proads_dir,
        market="IN",
    )
    c2 = second_run["counts"]
    assert c2["manufacturers"] == 0
    assert c2["shades"] == 0
    assert c2["developers"] == 0
    assert c2["product_rules"] == 0


@pytest.mark.asyncio
async def test_wella_brand_expansion_import_and_idempotency(db_session: AsyncSession):
    """Test importing Illumina Color and Pure Perfection under Wella Professionals."""
    illumina_dir = Path("data/manufacturers/wella_illumina")
    pp_dir = Path("data/manufacturers/wella_pure_perfection")
    assert illumina_dir.exists(), "Illumina data directory must exist"
    assert pp_dir.exists(), "Pure Perfection data directory must exist"

    # 1. Seed baseline Wella
    baseline_counts = await seed_wella_india(db_session)
    assert baseline_counts["manufacturers"] == 1
    assert baseline_counts["product_lines"] == 3

    # 2. Import Illumina Color
    il_res = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=illumina_dir,
        market="IN",
    )
    assert il_res["status"] == "SUCCESS"
    assert il_res["counts"]["shades"] == 48
    assert il_res["counts"]["product_lines"] == 1
    assert il_res["counts"]["product_rules"] == 2

    # Verify Illumina shade 10/81
    s_res = await db_session.execute(
        select(ManufacturerShade).where(
            ManufacturerShade.shade_code == "10/81",
            ManufacturerShade.market == "IN",
        )
    )
    shade_10_81 = s_res.scalar_one_or_none()
    assert shade_10_81 is not None

    map_res = await db_session.execute(
        select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_10_81.id)
    )
    mapping_10_81 = map_res.scalar_one_or_none()
    assert mapping_10_81 is not None
    assert mapping_10_81.uhcr_level == 10
    assert mapping_10_81.primary_tone == "PEARL"
    assert mapping_10_81.secondary_tone == "ASH"

    # 3. Import Pure Perfection
    pp_res = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=pp_dir,
        market="IN",
    )
    assert pp_res["status"] == "SUCCESS"
    assert pp_res["counts"]["shades"] == 30
    assert pp_res["counts"]["product_lines"] == 1
    assert pp_res["counts"]["product_rules"] == 2

    # Verify Wella Product Lines total (KP, Color Touch, Blondor, Illumina, Pure Perfection)
    m_res = await db_session.execute(
        select(Manufacturer).where(Manufacturer.slug == "wella-india")
    )
    wella = m_res.scalar_one()
    pl_res = await db_session.execute(
        select(ProductLine).where(ProductLine.manufacturer_id == wella.id)
    )
    lines = pl_res.scalars().all()
    line_names = {line.name for line in lines}
    assert "Illumina Color" in line_names
    assert "Pure Perfection" in line_names
    assert "Koleston Perfect ME+" in line_names
    assert len(lines) == 5

    # 4. Idempotency Check for expansions
    il_run2 = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=illumina_dir,
        market="IN",
    )
    assert il_run2["counts"]["shades"] == 0
    assert il_run2["counts"]["product_lines"] == 0

    pp_run2 = await CatalogueImporter.import_from_directory(
        session=db_session,
        directory=pp_dir,
        market="IN",
    )
    assert pp_run2["counts"]["shades"] == 0
    assert pp_run2["counts"]["product_lines"] == 0
