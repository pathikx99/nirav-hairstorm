"""
Integration tests for Milestone 2: Wella India Manufacturer Integration.

Verifies:
- Seeding Wella India profile, documents, and published catalogue version
- Verification of Koleston Perfect shades, preserving exact notation
- Verification of UHCR mappings with high confidence and evidence references
- Verification of separate Blondor lightening records and closed systems
- Verification of Welloxon Perfect developers and concentration conventions
- Verification of executable technical rules (mixing ratios, developer lift, grey coverage, contraindications)
- Idempotency of onboarding seeder
"""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.manufacturers.wella_seeder import seed_wella_india
from backend.app.models.manufacturers import (
    CatalogueVersion,
    Developer,
    Manufacturer,
    ManufacturerProduct,
    ManufacturerShade,
    ProductRule,
    ShadeMapping,
    SourceDocument,
)


@pytest.mark.asyncio
async def test_wella_india_onboarding_and_seeder(db_session: AsyncSession):
    # 1. Run seeder
    counts = await seed_wella_india(db_session)
    assert counts["manufacturers"] == 1
    assert counts["source_documents"] == 2
    assert counts["catalogue_versions"] == 1
    assert counts["product_lines"] == 3
    assert counts["shades"] >= 140
    assert counts["shade_mappings"] >= 140
    assert counts["developers"] >= 8
    assert counts["product_rules"] >= 14

    # 2. Test Idempotency — running again should insert 0 new records
    counts2 = await seed_wella_india(db_session)
    assert counts2["manufacturers"] == 0
    assert counts2["shades"] == 0
    assert counts2["developers"] == 0
    assert counts2["product_rules"] == 0

    # 3. Verify Manufacturer Profile
    stmt = select(Manufacturer).where(Manufacturer.slug == "wella-india")
    m = (await db_session.execute(stmt)).scalar_one()
    assert m.name == "Wella Professionals"
    assert m.country_of_origin == "Germany"
    assert m.supported_markets.get("IN") is True
    assert m.status == "ACTIVE"

    # 4. Verify Catalogue Version
    stmt = select(CatalogueVersion).where(CatalogueVersion.manufacturer_id == m.id)
    cat = (await db_session.execute(stmt)).scalar_one()
    assert cat.market == "IN"
    assert cat.version == "1.0"
    assert cat.status == "PUBLISHED"

    # 5. Verify Source Documents
    stmt = select(SourceDocument).where(SourceDocument.manufacturer_id == m.id)
    docs = (await db_session.execute(stmt)).scalars().all()
    assert len(docs) == 2
    doc_titles = {d.title for d in docs}
    assert "Koleston Perfect Usage Guidelines & Technical Folder" in doc_titles
    assert "Blondor Technical Folder & Services Guide" in doc_titles
    for d in docs:
        assert d.verification_status == "VERIFIED"

    # 6. Verify Original Shade Notation Preservation
    test_codes = ["7/1", "7/0", "12/89", "0/43", "44/0", "99/44", "88/02"]
    for code in test_codes:
        stmt = select(ManufacturerShade).where(
            ManufacturerShade.shade_code == code,
            ManufacturerShade.market == "IN",
        )
        shade = (await db_session.execute(stmt)).scalar_one_or_none()
        assert shade is not None, f"Shade {code} should exist verbatim!"
        assert shade.shade_code == code  # Never normalized

        # Verify UHCR Mapping
        stmt_m = select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade.id)
        mapping = (await db_session.execute(stmt_m)).scalar_one()
        assert 1 <= mapping.uhcr_level <= 10
        assert mapping.verification_status == "VERIFIED"
        assert mapping.evidence_reference is not None

    # 7. Specific Shade Mapping Checks
    # 7/1 -> Level 7, ASH
    shade_7_1 = (
        await db_session.execute(
            select(ManufacturerShade).where(ManufacturerShade.shade_code == "7/1")
        )
    ).scalar_one()
    map_7_1 = (
        await db_session.execute(
            select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_7_1.id)
        )
    ).scalar_one()
    assert map_7_1.uhcr_level == 7
    assert map_7_1.primary_tone == "ASH"

    # 12/89 -> Special Blonde, Level 10, PEARL, secondary VIOLET
    shade_12_89 = (
        await db_session.execute(
            select(ManufacturerShade).where(ManufacturerShade.shade_code == "12/89")
        )
    ).scalar_one()
    map_12_89 = (
        await db_session.execute(
            select(ShadeMapping).where(ShadeMapping.manufacturer_shade_id == shade_12_89.id)
        )
    ).scalar_one()
    assert map_12_89.uhcr_level == 10
    assert map_12_89.primary_tone == "PEARL"
    assert map_12_89.secondary_tone == "VIOLET"
    assert map_12_89.colour_family == "SPECIAL_BLONDE"

    # 8. Verify Developers Range
    stmt = select(Developer).where(Developer.manufacturer_id == m.id)
    devs = (await db_session.execute(stmt)).scalars().all()
    dev_names = {d.product_name for d in devs}
    assert "Welloxon Perfect 1.9% (Pastel)" in dev_names
    assert "Welloxon Perfect 6% (20 Vol)" in dev_names
    assert "Welloxon Perfect 9% (30 Vol)" in dev_names
    assert "Welloxon Perfect 12% (40 Vol)" in dev_names
    assert "Blondor Freelights Developer 6% (20 Vol)" in dev_names

    # 9. Verify Blondor Lightening Records
    stmt = select(ManufacturerProduct).where(ManufacturerProduct.product_type == "LIGHTENER")
    lighteners = (await db_session.execute(stmt)).scalars().all()
    lightener_names = {lp.product_name for lp in lighteners}
    assert "Blondor Multi-Blonde Powder" in lightener_names
    assert "BlondorPlex" in lightener_names
    assert "Blondor Soft Blonde Cream" in lightener_names
    assert "Blondor Freelights White Lightening Powder" in lightener_names
    assert "Blondor Meches" in lightener_names
    assert "Blondor Extra Cool Blonde" in lightener_names
    assert "Blondor Base Breakers" in lightener_names
    assert "Magma by Blondor" in lightener_names

    # 10. Verify Executable Technical Rules
    stmt = select(ProductRule)
    rules = (await db_session.execute(stmt)).scalars().all()
    rule_types = {r.rule_type for r in rules}
    assert "MIXING_RATIO" in rule_types
    assert "DEVELOPER_COMPATIBILITY" in rule_types
    assert "GREY_COVERAGE" in rule_types
    assert "PROCESSING_TIME" in rule_types
    assert "CONTRAINDICATION" in rule_types

    # Test Special Blonde 1:2 mixing ratio rule
    sb_rule = [
        r
        for r in rules
        if r.conditions.get("product_family") == "Special Blonde" and r.rule_type == "MIXING_RATIO"
    ][0]
    assert sb_rule.actions["mixing_ratio"]["colour_parts"] == 1.0
    assert sb_rule.actions["mixing_ratio"]["developer_parts"] == 2.0

    # Test Standard 1:1 mixing ratio rule
    std_rule = [
        r
        for r in rules
        if r.rule_type == "MIXING_RATIO"
        and "Pure Naturals" in r.conditions.get("product_family_in", [])
    ][0]
    assert std_rule.actions["mixing_ratio"]["colour_parts"] == 1.0
    assert std_rule.actions["mixing_ratio"]["developer_parts"] == 1.0

    # Test Freelights Closed System rule
    fl_rule = [r for r in rules if r.conditions.get("product_code") == "BLONDOR-FL-POWDER"][0]
    assert fl_rule.actions["mandatory_developer"] == "Blondor Freelights Developer"
    assert "Welloxon Perfect" in fl_rule.actions["disallowed_developers"]

    # Test Contraindication on Base Breakers (no WellaPlex)
    bb_rule = [r for r in rules if r.conditions.get("product_code") == "BLONDOR-BB"][0]
    assert bb_rule.actions["is_blocked"] is True

    # Test Contraindication on Magma (no on-scalp)
    magma_rule = [r for r in rules if r.conditions.get("product_code") == "BLONDOR-MAGMA"][0]
    assert magma_rule.actions["is_blocked"] is True
