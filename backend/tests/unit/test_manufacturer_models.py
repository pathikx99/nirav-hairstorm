"""
Unit tests for Manufacturer SQLAlchemy Models.

Tests:
- Table names and primary keys
- Index definitions on all models
- Unique constraints (including (product_id, market, catalogue_version_id, shade_code))
- Check constraints (uhcr_level 1-10, mapping_confidence 0-1)
- Model instantiation
"""

import uuid

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


class TestManufacturerModels:
    """Validate SQLAlchemy model configuration and constraints."""

    def test_table_names(self):
        assert Manufacturer.__tablename__ == "manufacturers"
        assert ProductLine.__tablename__ == "product_lines"
        assert ManufacturerProduct.__tablename__ == "manufacturer_products"
        assert ManufacturerShade.__tablename__ == "manufacturer_shades"
        assert ShadeMapping.__tablename__ == "shade_mappings"
        assert Developer.__tablename__ == "developers"
        assert ProductRule.__tablename__ == "product_rules"
        assert SourceDocument.__tablename__ == "source_documents"
        assert CatalogueVersion.__tablename__ == "catalogue_versions"

    def test_unique_constraint_on_shade(self):
        """(product_id, market, catalogue_version_id, shade_code) must be unique."""
        table = ManufacturerShade.__table__
        unique_constraints = [
            c for c in table.constraints if hasattr(c, "columns") and len(c.columns) > 1
        ]
        col_names_sets = [{col.name for col in c.columns} for c in unique_constraints]
        expected_cols = {"product_id", "market", "catalogue_version_id", "shade_code"}
        assert expected_cols in col_names_sets

    def test_check_constraints_on_shade_mapping(self):
        """uhcr_level (1-10) and mapping_confidence (0-1) must have check constraints."""
        table = ShadeMapping.__table__
        check_names = {c.name for c in table.constraints if hasattr(c, "sqltext")}
        assert "ck_shade_mapping_uhcr_level_range" in check_names
        assert "ck_shade_mapping_confidence_range" in check_names

    def test_required_indexes_present(self):
        """Validate all spec-mandated indexes are defined."""
        # idx_shades_product_code on manufacturer_shades(product_id, shade_code)
        shade_indexes = {
            idx.name: [col.name for col in idx.columns]
            for idx in ManufacturerShade.__table__.indexes
        }
        assert "idx_shades_product_code" in shade_indexes
        assert shade_indexes["idx_shades_product_code"] == ["product_id", "shade_code"]

        # idx_shades_market on manufacturer_shades(market)
        assert "idx_shades_market" in shade_indexes
        assert shade_indexes["idx_shades_market"] == ["market"]

        # idx_shade_mapping_level on shade_mappings(uhcr_level)
        mapping_indexes = {
            idx.name: [col.name for col in idx.columns] for idx in ShadeMapping.__table__.indexes
        }
        assert "idx_shade_mapping_level" in mapping_indexes
        assert mapping_indexes["idx_shade_mapping_level"] == ["uhcr_level"]

        # idx_product_rules_product on product_rules(product_id)
        rule_indexes = {
            idx.name: [col.name for col in idx.columns] for idx in ProductRule.__table__.indexes
        }
        assert "idx_product_rules_product" in rule_indexes
        assert rule_indexes["idx_product_rules_product"] == ["product_id"]

        # idx_catalogue_version on catalogue_versions(manufacturer_id, market, status)
        cat_indexes = {
            idx.name: [col.name for col in idx.columns]
            for idx in CatalogueVersion.__table__.indexes
        }
        assert "idx_catalogue_version" in cat_indexes
        assert cat_indexes["idx_catalogue_version"] == ["manufacturer_id", "market", "status"]

    def test_model_instantiation(self):
        """Verify models can be instantiated with valid attributes."""
        m_id = uuid.uuid4()
        m = Manufacturer(
            id=m_id,
            name="Wella",
            slug="wella",
            supported_markets={"IN": True},
        )
        assert m.name == "Wella"
        assert m.slug == "wella"
        assert m.id == m_id
