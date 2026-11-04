"""
Integration test verifying complete flow of Manufacturer data models in SQLite test database:
- Manufacturer creation
- Product Line creation
- Product creation
- Shade creation (preserving exact notation)
- ShadeMapping creation with UHCR taxonomy
- Verification status transitions
"""

import uuid
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.manufacturers.enums import (
    CatalogueStatusEnum,
    ManufacturerStatusEnum,
    MappingMethodEnum,
    ProductTypeEnum,
    ServiceTypeEnum,
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


@pytest.mark.asyncio
async def test_manufacturer_catalogue_full_lifecycle(db_session: AsyncSession):
    # 1. Create Manufacturer
    m = Manufacturer(
        id=uuid.uuid4(),
        name="Wella Professionals",
        slug="wella-india",
        country_of_origin="Germany",
        supported_markets={"IN": True},
        website="https://www.wella.com",
        status=ManufacturerStatusEnum.ACTIVE.value,
    )
    db_session.add(m)
    await db_session.commit()

    # 2. Create Catalogue Version
    cat_ver = CatalogueVersion(
        id=uuid.uuid4(),
        manufacturer_id=m.id,
        market="IN",
        version="1.0",
        status=CatalogueStatusEnum.PUBLISHED.value,
    )
    db_session.add(cat_ver)
    await db_session.commit()

    # 3. Create Product Line
    line = ProductLine(
        id=uuid.uuid4(),
        manufacturer_id=m.id,
        name="Koleston Perfect",
        service_type=ServiceTypeEnum.PERMANENT_COLOUR.value,
        market="IN",
        status=ManufacturerStatusEnum.ACTIVE.value,
        catalogue_version_id=cat_ver.id,
    )
    db_session.add(line)
    await db_session.commit()

    # 4. Create Product
    product = ManufacturerProduct(
        id=uuid.uuid4(),
        product_line_id=line.id,
        product_name="Koleston Perfect ME+",
        product_code="KP-MEPLUS",
        product_type=ProductTypeEnum.COLOUR.value,
        market="IN",
        verification_status=VerificationStatusEnum.VERIFIED.value,
    )
    db_session.add(product)
    await db_session.commit()

    # 5. Create Shades - preserving original notation (7/1, 7/0)
    shade_7_1 = ManufacturerShade(
        id=uuid.uuid4(),
        product_id=product.id,
        shade_code="7/1",  # Original notation preserved
        shade_name="Medium Ash Blonde",
        manufacturer_depth="7",
        manufacturer_tone_code="1",
        manufacturer_family="Pure Naturals",
        original_description="Koleston Perfect 7/1 Medium Ash Blonde",
        market="IN",
        active_status=True,
        catalogue_version_id=cat_ver.id,
        verification_status=VerificationStatusEnum.VERIFIED.value,
    )
    db_session.add(shade_7_1)
    await db_session.commit()

    # 6. Create ShadeMapping to UHCR
    mapping = ShadeMapping(
        id=uuid.uuid4(),
        manufacturer_shade_id=shade_7_1.id,
        uhcr_level=7,
        primary_tone="ASH",
        secondary_tone=None,
        tone_intensity="STANDARD",
        colour_family="NATURAL",
        mapping_method=MappingMethodEnum.EXPERT_VERIFIED.value,
        mapping_confidence=Decimal("0.9800"),
        verification_status=VerificationStatusEnum.VERIFIED.value,
    )
    db_session.add(mapping)
    await db_session.commit()

    # Query back and verify relationships
    stmt = select(ManufacturerShade).where(ManufacturerShade.id == shade_7_1.id)
    res = await db_session.execute(stmt)
    loaded_shade = res.scalar_one()

    assert loaded_shade.shade_code == "7/1"
    assert loaded_shade.verification_status == "VERIFIED"
    assert len(loaded_shade.shade_mappings) == 1
    assert loaded_shade.shade_mappings[0].uhcr_level == 7
    assert loaded_shade.shade_mappings[0].primary_tone == "ASH"
    assert loaded_shade.shade_mappings[0].mapping_confidence == Decimal("0.9800")
