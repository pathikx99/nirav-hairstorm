"""
L'Oréal Professionnel India Onboarding Seeder.

Loads the verified L'Oréal India catalogue, source documents, Majirel
shades, Oxydant Crème developers, and technical rules into the database.
"""

from __future__ import annotations

import json
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.manufacturers.enums import (
    CatalogueStatusEnum,
    ConcentrationTypeEnum,
    DocumentTypeEnum,
    ManufacturerStatusEnum,
    MappingMethodEnum,
    PermissionStatusEnum,
    ProductTypeEnum,
    ServiceTypeEnum,
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
    ShadeMapping,
    SourceDocument,
)


def _load_json(filename: str) -> Any:
    data_dir = Path(__file__).resolve().parents[3] / "data" / "manufacturers" / "loreal"
    file_path = data_dir / filename
    with open(file_path, encoding="utf-8") as f:
        return json.load(f)


async def seed_loreal_india(session: AsyncSession) -> dict[str, int]:
    """
    Idempotently seeds L'Oréal India manufacturer, product lines, products,
    shades, mappings, developers, and technical rules.
    """
    counts = {
        "manufacturers": 0,
        "source_documents": 0,
        "catalogue_versions": 0,
        "product_lines": 0,
        "products": 0,
        "shades": 0,
        "shade_mappings": 0,
        "developers": 0,
        "product_rules": 0,
    }

    # 1. Manufacturer
    profile_data = _load_json("loreal_profile.json")
    m_info = profile_data["manufacturer"]

    stmt = select(Manufacturer).where(Manufacturer.slug == m_info["slug"])
    res = await session.execute(stmt)
    m = res.scalar_one_or_none()

    if m is None:
        m = Manufacturer(
            id=uuid.uuid4(),
            name=m_info["name"],
            slug=m_info["slug"],
            country_of_origin=m_info.get("country_of_origin"),
            supported_markets=m_info["supported_markets"],
            website=m_info.get("website"),
            status=m_info.get("status", ManufacturerStatusEnum.ACTIVE.value),
        )
        session.add(m)
        await session.flush()
        counts["manufacturers"] += 1

    # 2. Source Document
    source_docs: dict[str, SourceDocument] = {}
    for doc_info in profile_data["source_documents"]:
        doc_key = doc_info["key"]
        stmt = select(SourceDocument).where(
            SourceDocument.manufacturer_id == m.id,
            SourceDocument.title == doc_info["title"],
        )
        res = await session.execute(stmt)
        doc = res.scalar_one_or_none()
        if doc is None:
            doc = SourceDocument(
                id=uuid.uuid4(),
                manufacturer_id=m.id,
                title=doc_info["title"],
                publisher=doc_info.get("publisher"),
                document_type=doc_info.get(
                    "document_type", DocumentTypeEnum.TECHNICAL_MANUAL.value
                ),
                market=doc_info.get("market", "IN"),
                language=doc_info.get("language", "en"),
                document_version=doc_info.get("document_version", "1.0"),
                permission_status=doc_info.get(
                    "permission_status", PermissionStatusEnum.GRANTED.value
                ),
                verification_status=doc_info.get(
                    "verification_status", VerificationStatusEnum.VERIFIED.value
                ),
            )
            session.add(doc)
            await session.flush()
            counts["source_documents"] += 1
        source_docs[doc_key] = doc

    # 3. Catalogue Version
    cat_info = profile_data["catalogue_version"]
    stmt = select(CatalogueVersion).where(
        CatalogueVersion.manufacturer_id == m.id,
        CatalogueVersion.market == cat_info["market"],
        CatalogueVersion.version == cat_info["version"],
    )
    res = await session.execute(stmt)
    cat_ver = res.scalar_one_or_none()
    if cat_ver is None:
        cat_ver = CatalogueVersion(
            id=uuid.uuid4(),
            manufacturer_id=m.id,
            market=cat_info["market"],
            version=cat_info["version"],
            status=cat_info.get("status", CatalogueStatusEnum.PUBLISHED.value),
        )
        session.add(cat_ver)
        await session.flush()
        counts["catalogue_versions"] += 1

    # 4. Product Line: Majirel
    stmt = select(ProductLine).where(
        ProductLine.manufacturer_id == m.id,
        ProductLine.name == "Majirel",
        ProductLine.market == "IN",
    )
    res = await session.execute(stmt)
    pl = res.scalar_one_or_none()
    if pl is None:
        pl = ProductLine(
            id=uuid.uuid4(),
            manufacturer_id=m.id,
            name="Majirel",
            service_type=ServiceTypeEnum.PERMANENT_COLOUR.value,
            market="IN",
            status=ManufacturerStatusEnum.ACTIVE.value,
            catalogue_version_id=cat_ver.id,
        )
        session.add(pl)
        await session.flush()
        counts["product_lines"] += 1

    # 5. Product: Majirel Color Cream
    stmt = select(ManufacturerProduct).where(
        ManufacturerProduct.product_line_id == pl.id,
        ManufacturerProduct.product_code == "LP-MAJIREL",
    )
    res = await session.execute(stmt)
    prod = res.scalar_one_or_none()
    if prod is None:
        prod = ManufacturerProduct(
            id=uuid.uuid4(),
            product_line_id=pl.id,
            product_name="Majirel Permanent Creme Hair Colour",
            product_code="LP-MAJIREL",
            product_type=ProductTypeEnum.COLOUR.value,
            market="IN",
            active_status=True,
            source_document_id=source_docs["majirel_technical_manual"].id,
            verification_status=VerificationStatusEnum.VERIFIED.value,
        )
        session.add(prod)
        await session.flush()
        counts["products"] += 1

    # 6. Developers
    developers_data = _load_json("developers.json")
    for dev_info in developers_data:
        stmt = select(Developer).where(
            Developer.manufacturer_id == m.id,
            Developer.product_name == dev_info["product_name"],
            Developer.market == dev_info["market"],
        )
        res = await session.execute(stmt)
        dev = res.scalar_one_or_none()
        if dev is None:
            dev = Developer(
                id=uuid.uuid4(),
                manufacturer_id=m.id,
                product_name=dev_info["product_name"],
                concentration_percent=Decimal(str(dev_info["concentration_percent"])),
                concentration_type=dev_info.get(
                    "concentration_type", ConcentrationTypeEnum.PERCENTAGE.value
                ),
                intended_use=dev_info.get("intended_use"),
                market=dev_info["market"],
                source_document_id=source_docs["majirel_technical_manual"].id,
                verification_status=dev_info.get(
                    "verification_status", VerificationStatusEnum.VERIFIED.value
                ),
            )
            session.add(dev)
            counts["developers"] += 1

    # 7. Shades & UHCR Mappings
    shades_data = _load_json("majirel_shades.json")
    for s_info in shades_data:
        code = s_info["shade_code"]
        stmt = select(ManufacturerShade).where(
            ManufacturerShade.product_id == prod.id,
            ManufacturerShade.shade_code == code,
            ManufacturerShade.market == "IN",
            ManufacturerShade.catalogue_version_id == cat_ver.id,
        )
        res = await session.execute(stmt)
        shade = res.scalar_one_or_none()

        if shade is None:
            shade = ManufacturerShade(
                id=uuid.uuid4(),
                product_id=prod.id,
                shade_code=code,
                shade_name=s_info.get("shade_name"),
                manufacturer_depth=s_info.get("manufacturer_depth"),
                manufacturer_tone_code=s_info.get("manufacturer_tone_code"),
                manufacturer_family=s_info.get("manufacturer_family"),
                original_description=s_info.get("original_description"),
                market="IN",
                active_status=s_info.get("active_status", True),
                catalogue_version_id=cat_ver.id,
                source_document_id=source_docs["majirel_technical_manual"].id,
                verification_status=s_info.get(
                    "verification_status", VerificationStatusEnum.VERIFIED.value
                ),
            )
            session.add(shade)
            await session.flush()
            counts["shades"] += 1

            m_data = s_info["uhcr_mapping"]
            mapping = ShadeMapping(
                id=uuid.uuid4(),
                manufacturer_shade_id=shade.id,
                uhcr_level=m_data["uhcr_level"],
                primary_tone=m_data["primary_tone"],
                secondary_tone=m_data.get("secondary_tone"),
                tone_intensity=m_data.get("tone_intensity", "UNKNOWN"),
                colour_family=m_data.get("colour_family"),
                mapping_method=m_data.get(
                    "mapping_method", MappingMethodEnum.MANUFACTURER_DOCUMENT.value
                ),
                mapping_confidence=Decimal(str(m_data.get("mapping_confidence", 0.98))),
                verification_status=m_data.get(
                    "verification_status", VerificationStatusEnum.VERIFIED.value
                ),
                evidence_reference=source_docs["majirel_technical_manual"].id,
            )
            session.add(mapping)
            counts["shade_mappings"] += 1

    # 8. Rules
    rules_data = _load_json("product_rules.json")
    for r_info in rules_data:
        stmt = select(ProductRule).where(
            ProductRule.product_id == prod.id,
            ProductRule.rule_type == r_info["rule_type"],
            ProductRule.rule_version == r_info.get("rule_version", "1.0"),
        )
        res = await session.execute(stmt)
        rule = res.scalar_one_or_none()

        if rule is None:
            rule = ProductRule(
                id=uuid.uuid4(),
                product_id=prod.id,
                market=r_info["market"],
                service_type=r_info["service_type"],
                rule_type=r_info["rule_type"],
                conditions=r_info["conditions"],
                actions=r_info["actions"],
                priority=r_info.get("priority", 0),
                source_document_id=source_docs["majirel_technical_manual"].id,
                source_section=r_info.get("source_section"),
                verification_status=r_info.get(
                    "verification_status", VerificationStatusEnum.VERIFIED.value
                ),
                rule_version=r_info.get("rule_version", "1.0"),
            )
            session.add(rule)
            counts["product_rules"] += 1

    await session.commit()
    return counts
