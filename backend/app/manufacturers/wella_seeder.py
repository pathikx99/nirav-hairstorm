"""
Wella Professionals India Onboarding Seeder.

Loads the verified Wella India catalogue, source documents, Koleston Perfect
shades, Blondor lighteners, Welloxon developers, and technical rules from the
data/manufacturers/wella JSON files into the database.
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
    data_dir = Path(__file__).resolve().parents[3] / "data" / "manufacturers" / "wella"
    file_path = data_dir / filename
    with open(file_path, encoding="utf-8") as f:
        return json.load(f)


async def seed_wella_india(session: AsyncSession) -> dict[str, int]:
    """
    Idempotently seeds Wella India manufacturer, product lines, products,
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
    profile_data = _load_json("wella_profile.json")
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

    # 2. Source Documents
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

    # 4. Product Lines
    lines_def = [
        ("Koleston Perfect ME+", ServiceTypeEnum.PERMANENT_COLOUR.value),
        ("Blondor", ServiceTypeEnum.LIGHTENER.value),
        ("Welloxon Perfect", ServiceTypeEnum.OTHER.value),
    ]
    product_lines: dict[str, ProductLine] = {}
    for line_name, s_type in lines_def:
        stmt = select(ProductLine).where(
            ProductLine.manufacturer_id == m.id,
            ProductLine.name == line_name,
            ProductLine.market == "IN",
        )
        res = await session.execute(stmt)
        pl = res.scalar_one_or_none()
        if pl is None:
            pl = ProductLine(
                id=uuid.uuid4(),
                manufacturer_id=m.id,
                name=line_name,
                service_type=s_type,
                market="IN",
                status=ManufacturerStatusEnum.ACTIVE.value,
                catalogue_version_id=cat_ver.id,
            )
            session.add(pl)
            await session.flush()
            counts["product_lines"] += 1
        product_lines[line_name] = pl

    kp_line = product_lines["Koleston Perfect ME+"]
    blondor_line = product_lines["Blondor"]

    # 5. Products under Koleston Perfect
    kp_sub_products = [
        ("Pure Naturals", "KP-PN"),
        ("Rich Naturals", "KP-RN"),
        ("Vibrant Reds", "KP-VR"),
        ("Deep Browns", "KP-DB"),
        ("Special Blonde", "KP-SB"),
        ("Special Mix", "KP-SM"),
    ]
    kp_products: dict[str, ManufacturerProduct] = {}
    for sub_name, code in kp_sub_products:
        stmt = select(ManufacturerProduct).where(
            ManufacturerProduct.product_line_id == kp_line.id,
            ManufacturerProduct.product_code == code,
        )
        res = await session.execute(stmt)
        prod = res.scalar_one_or_none()
        if prod is None:
            prod = ManufacturerProduct(
                id=uuid.uuid4(),
                product_line_id=kp_line.id,
                product_name=f"Koleston Perfect {sub_name}",
                product_code=code,
                product_type=ProductTypeEnum.COLOUR.value,
                market="IN",
                active_status=True,
                source_document_id=source_docs["kp_usage_guidelines"].id,
                verification_status=VerificationStatusEnum.VERIFIED.value,
            )
            session.add(prod)
            await session.flush()
            counts["products"] += 1
        kp_products[sub_name] = prod

    # Main KP Product for rules
    stmt = select(ManufacturerProduct).where(
        ManufacturerProduct.product_line_id == kp_line.id,
        ManufacturerProduct.product_code == "KP-MAIN",
    )
    res = await session.execute(stmt)
    kp_main_prod = res.scalar_one_or_none()
    if kp_main_prod is None:
        kp_main_prod = ManufacturerProduct(
            id=uuid.uuid4(),
            product_line_id=kp_line.id,
            product_name="Koleston Perfect ME+ Permanent Creme Haircolor",
            product_code="KP-MAIN",
            product_type=ProductTypeEnum.COLOUR.value,
            market="IN",
            active_status=True,
            source_document_id=source_docs["kp_usage_guidelines"].id,
            verification_status=VerificationStatusEnum.VERIFIED.value,
        )
        session.add(kp_main_prod)
        await session.flush()
        counts["products"] += 1
    kp_products["main"] = kp_main_prod

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
            doc_key = dev_info.get("source_doc_key", "kp_usage_guidelines")
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
                source_document_id=source_docs[doc_key].id,
                verification_status=dev_info.get(
                    "verification_status", VerificationStatusEnum.VERIFIED.value
                ),
            )
            session.add(dev)
            counts["developers"] += 1

    # 7. Blondor Products
    blondor_data = _load_json("blondor_products.json")
    blondor_products: dict[str, ManufacturerProduct] = {}
    for bp_info in blondor_data:
        p_code = bp_info["product_code"]
        stmt = select(ManufacturerProduct).where(
            ManufacturerProduct.product_line_id == blondor_line.id,
            ManufacturerProduct.product_code == p_code,
        )
        res = await session.execute(stmt)
        prod = res.scalar_one_or_none()
        if prod is None:
            doc_key = bp_info.get("source_doc_key", "blondor_technical_folder")
            prod = ManufacturerProduct(
                id=uuid.uuid4(),
                product_line_id=blondor_line.id,
                product_name=bp_info["product_name"],
                product_code=p_code,
                product_type=ProductTypeEnum.LIGHTENER.value,
                market="IN",
                active_status=True,
                source_document_id=source_docs[doc_key].id,
                verification_status=bp_info.get(
                    "verification_status", VerificationStatusEnum.VERIFIED.value
                ),
            )
            session.add(prod)
            await session.flush()
            counts["products"] += 1
        blondor_products[p_code] = prod

    # 8. Koleston Perfect Shades & UHCR Mappings
    shades_data = _load_json("koleston_perfect_shades.json")
    for s_info in shades_data:
        family = s_info["manufacturer_family"]
        target_prod = kp_products.get(family, kp_products["main"])
        code = s_info["shade_code"]

        stmt = select(ManufacturerShade).where(
            ManufacturerShade.product_id == target_prod.id,
            ManufacturerShade.shade_code == code,
            ManufacturerShade.market == "IN",
            ManufacturerShade.catalogue_version_id == cat_ver.id,
        )
        res = await session.execute(stmt)
        shade = res.scalar_one_or_none()

        if shade is None:
            shade = ManufacturerShade(
                id=uuid.uuid4(),
                product_id=target_prod.id,
                shade_code=code,
                shade_name=s_info.get("shade_name"),
                manufacturer_depth=s_info.get("manufacturer_depth"),
                manufacturer_tone_code=s_info.get("manufacturer_tone_code"),
                manufacturer_family=family,
                original_description=s_info.get("original_description"),
                market="IN",
                active_status=s_info.get("active_status", True),
                catalogue_version_id=cat_ver.id,
                source_document_id=source_docs["kp_usage_guidelines"].id,
                verification_status=s_info.get(
                    "verification_status", VerificationStatusEnum.VERIFIED.value
                ),
            )
            session.add(shade)
            await session.flush()
            counts["shades"] += 1

            # UHCR Mapping
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
                mapping_confidence=Decimal(str(m_data.get("mapping_confidence", 0.95))),
                verification_status=m_data.get(
                    "verification_status", VerificationStatusEnum.VERIFIED.value
                ),
                evidence_reference=source_docs["kp_usage_guidelines"].id,
            )
            session.add(mapping)
            counts["shade_mappings"] += 1

    # 9. Product Rules
    rules_data = _load_json("product_rules.json")
    for r_info in rules_data:
        # Link to appropriate product
        p_fam = r_info.get("product_family")
        if "Special Blonde" in p_fam:
            p_target = kp_products.get("Special Blonde", kp_main_prod)
        elif "Special Mix" in p_fam:
            p_target = kp_products.get("Special Mix", kp_main_prod)
        elif "Blondor Base Breakers" in p_fam:
            p_target = blondor_products.get("BLONDOR-BB", blondor_products["BLONDOR-MBP"])
        elif "Magma" in p_fam:
            p_target = blondor_products.get("BLONDOR-MAGMA", blondor_products["BLONDOR-MBP"])
        elif "Freelights" in p_fam:
            p_target = blondor_products.get("BLONDOR-FL-POWDER", blondor_products["BLONDOR-MBP"])
        elif "Blondor" in p_fam:
            p_target = blondor_products.get("BLONDOR-MBP", kp_main_prod)
        else:
            p_target = kp_main_prod

        doc_key = r_info.get("source_doc_key", "kp_usage_guidelines")
        doc_id = source_docs[doc_key].id if doc_key in source_docs else None

        # Check existing rule
        stmt = select(ProductRule).where(
            ProductRule.product_id == p_target.id,
            ProductRule.rule_type == r_info["rule_type"],
            ProductRule.rule_version == r_info.get("rule_version", "1.0"),
            ProductRule.source_section == r_info.get("source_section"),
        )
        res = await session.execute(stmt)
        rule = res.scalar_one_or_none()

        if rule is None:
            rule = ProductRule(
                id=uuid.uuid4(),
                product_id=p_target.id,
                market=r_info["market"],
                service_type=r_info["service_type"],
                rule_type=r_info["rule_type"],
                conditions=r_info["conditions"],
                actions=r_info["actions"],
                priority=r_info.get("priority", 0),
                source_document_id=doc_id,
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
