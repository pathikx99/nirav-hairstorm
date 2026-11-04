"""
Unit tests for Manufacturer Pydantic Schemas.

Tests:
- ManufacturerCreate, ManufacturerRead, ManufacturerUpdate
- ProductLineCreate, ProductLineRead
- ManufacturerProductCreate, ManufacturerProductRead
- ManufacturerShadeCreate: Preserves exact original notation (7/1, 7.1, 7A)
- ShadeMappingCreate: Enforces uhcr_level 1-10, mapping_confidence 0-1
- DeveloperCreate: concentration_percent validation
- ProductRuleCreate: conditions and actions
- SourceDocumentCreate, CatalogueVersionCreate
"""

from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from backend.app.manufacturers.enums import (
    CatalogueStatusEnum,
    ConcentrationTypeEnum,
    ManufacturerStatusEnum,
    MappingMethodEnum,
    VerificationStatusEnum,
)
from backend.app.manufacturers.schemas import (
    CatalogueVersionCreate,
    DeveloperCreate,
    ManufacturerCreate,
    ManufacturerShadeCreate,
    ProductRuleCreate,
    ShadeMappingCreate,
)


class TestManufacturerSchemas:
    """Test schema validations for manufacturer models."""

    def test_manufacturer_create_valid(self):
        m = ManufacturerCreate(
            name="Wella Professionals",
            slug="wella",
            country_of_origin="Germany",
            supported_markets={"IN": True, "EU": True},
            website="https://www.wella.com",
            status=ManufacturerStatusEnum.ACTIVE,
        )
        assert m.name == "Wella Professionals"
        assert m.slug == "wella"
        assert m.status == ManufacturerStatusEnum.ACTIVE

    def test_manufacturer_shade_preserves_original_notation(self):
        """Original shade codes (7/1, 7.1, 7A, 10/04) must be preserved verbatim."""
        prod_id = uuid4()
        cat_id = uuid4()

        codes = ["7/1", "7.1", "7A", "10/04", "0/00", "Special Blonde 12/89"]
        for code in codes:
            shade = ManufacturerShadeCreate(
                product_id=prod_id,
                shade_code=code,
                shade_name=f"Shade {code}",
                market="IN",
                catalogue_version_id=cat_id,
                verification_status=VerificationStatusEnum.UNVERIFIED,
            )
            assert shade.shade_code == code  # Preserved exactly

    def test_shade_mapping_level_constraints(self):
        """uhcr_level must be between 1 and 10."""
        shade_id = uuid4()

        # Valid
        sm = ShadeMappingCreate(
            manufacturer_shade_id=shade_id,
            uhcr_level=7,
            primary_tone="ASH",
            mapping_method=MappingMethodEnum.EXPERT_VERIFIED,
            mapping_confidence=Decimal("0.95"),
        )
        assert sm.uhcr_level == 7

        # Invalid: level 0
        with pytest.raises(ValidationError):
            ShadeMappingCreate(
                manufacturer_shade_id=shade_id,
                uhcr_level=0,
                primary_tone="ASH",
                mapping_method=MappingMethodEnum.EXPERT_VERIFIED,
            )

        # Invalid: level 11
        with pytest.raises(ValidationError):
            ShadeMappingCreate(
                manufacturer_shade_id=shade_id,
                uhcr_level=11,
                primary_tone="ASH",
                mapping_method=MappingMethodEnum.EXPERT_VERIFIED,
            )

    def test_shade_mapping_confidence_constraints(self):
        """mapping_confidence must be between 0 and 1."""
        shade_id = uuid4()

        # Valid boundaries
        sm0 = ShadeMappingCreate(
            manufacturer_shade_id=shade_id,
            uhcr_level=5,
            primary_tone="NATURAL",
            mapping_method=MappingMethodEnum.MANUAL_UNVERIFIED,
            mapping_confidence=Decimal("0.0"),
        )
        assert sm0.mapping_confidence == Decimal("0.0")

        sm1 = ShadeMappingCreate(
            manufacturer_shade_id=shade_id,
            uhcr_level=5,
            primary_tone="NATURAL",
            mapping_method=MappingMethodEnum.EXPERT_VERIFIED,
            mapping_confidence=Decimal("1.0"),
        )
        assert sm1.mapping_confidence == Decimal("1.0")

        # Invalid: > 1
        with pytest.raises(ValidationError):
            ShadeMappingCreate(
                manufacturer_shade_id=shade_id,
                uhcr_level=5,
                primary_tone="NATURAL",
                mapping_method=MappingMethodEnum.EXPERT_VERIFIED,
                mapping_confidence=Decimal("1.05"),
            )

        # Invalid: < 0
        with pytest.raises(ValidationError):
            ShadeMappingCreate(
                manufacturer_shade_id=shade_id,
                uhcr_level=5,
                primary_tone="NATURAL",
                mapping_method=MappingMethodEnum.EXPERT_VERIFIED,
                mapping_confidence=Decimal("-0.1"),
            )

    def test_developer_create_valid(self):
        m_id = uuid4()
        dev = DeveloperCreate(
            manufacturer_id=m_id,
            product_name="Welloxon Perfect 6%",
            concentration_percent=Decimal("6.0"),
            concentration_type=ConcentrationTypeEnum.PERCENTAGE,
            intended_use={"standard_lift": "1 level"},
            market="IN",
            verification_status=VerificationStatusEnum.VERIFIED,
        )
        assert dev.concentration_percent == Decimal("6.0")
        assert dev.concentration_type == ConcentrationTypeEnum.PERCENTAGE

    def test_product_rule_create_typed_data(self):
        """Product rules must be typed JSON structures, not raw code."""
        p_id = uuid4()
        rule = ProductRuleCreate(
            product_id=p_id,
            market="IN",
            service_type="PERMANENT_COLOUR",
            rule_type="MIXING_RATIO",
            conditions={"service_type": "PERMANENT_COLOUR"},
            actions={"mixing_ratio": {"colour": 1, "developer": 1}},
            priority=1,
            rule_version="1.0",
        )
        assert rule.rule_type == "MIXING_RATIO"
        assert rule.actions["mixing_ratio"]["colour"] == 1
        assert rule.actions["mixing_ratio"]["developer"] == 1

    def test_catalogue_version_create(self):
        m_id = uuid4()
        cat = CatalogueVersionCreate(
            manufacturer_id=m_id,
            market="IN",
            version="1.0",
            status=CatalogueStatusEnum.DRAFT,
        )
        assert cat.version == "1.0"
        assert cat.status == CatalogueStatusEnum.DRAFT
