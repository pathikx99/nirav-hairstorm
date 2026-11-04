"""
Unit tests for Manufacturer domain enumerations.

Tests:
- VerificationStatusEnum (all 6 statuses)
- CatalogueStatusEnum (all 5 statuses)
- ServiceTypeEnum (all 10 service types)
- MappingMethodEnum (all 6 methods)
- DocumentTypeEnum (all 7 document types)
- RuleCategoryEnum (all 11 rule categories)
- CatalogueCompletenessEnum (all 8 statuses)
- ProductTypeEnum
- ConcentrationTypeEnum
- PermissionStatusEnum
- ManufacturerStatusEnum
"""

from backend.app.manufacturers.enums import (
    CatalogueCompletenessEnum,
    CatalogueStatusEnum,
    ConcentrationTypeEnum,
    DocumentTypeEnum,
    ManufacturerStatusEnum,
    MappingMethodEnum,
    PermissionStatusEnum,
    ProductTypeEnum,
    RuleCategoryEnum,
    ServiceTypeEnum,
    VerificationStatusEnum,
)


class TestManufacturerEnums:
    """Verify all manufacturer enums match the v1.0 specification."""

    def test_verification_statuses(self):
        expected = {
            "UNVERIFIED",
            "EXTRACTED",
            "UNDER_REVIEW",
            "VERIFIED",
            "REJECTED",
            "SUPERSEDED",
        }
        actual = {status.value for status in VerificationStatusEnum}
        assert actual == expected

    def test_catalogue_statuses(self):
        expected = {"DRAFT", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "RETIRED"}
        actual = {status.value for status in CatalogueStatusEnum}
        assert actual == expected

    def test_service_types(self):
        expected = {
            "PERMANENT_COLOUR",
            "DEMI_PERMANENT_COLOUR",
            "SEMI_PERMANENT_COLOUR",
            "DIRECT_DYE",
            "TONER",
            "LIGHTENER",
            "BLEACH",
            "COLOUR_REMOVER",
            "GLOSS",
            "OTHER",
        }
        actual = {st.value for st in ServiceTypeEnum}
        assert actual == expected

    def test_mapping_methods(self):
        expected = {
            "MANUFACTURER_DOCUMENT",
            "EXPERT_VERIFIED",
            "PHYSICAL_MEASUREMENT",
            "EXPERIMENTAL_VALIDATION",
            "PROVISIONAL_AI_EXTRACTION",
            "MANUAL_UNVERIFIED",
        }
        actual = {mm.value for mm in MappingMethodEnum}
        assert actual == expected

    def test_document_types(self):
        expected = {
            "SHADE_CHART",
            "TECHNICAL_MANUAL",
            "DEVELOPER_GUIDE",
            "LIGHTENER_GUIDE",
            "SAFETY_DOCUMENT",
            "PRODUCT_INFORMATION",
            "OTHER",
        }
        actual = {dt.value for dt in DocumentTypeEnum}
        assert actual == expected

    def test_rule_categories(self):
        expected = {
            "MIXING_RATIO",
            "DEVELOPER_COMPATIBILITY",
            "PROCESSING_TIME",
            "PROCESSING_CONDITIONS",
            "APPLICATION_METHOD",
            "GREY_COVERAGE",
            "SPECIAL_MIX",
            "LIGHTENING",
            "COLOUR_REMOVAL",
            "CONTRAINDICATION",
            "OTHER",
        }
        actual = {rc.value for rc in RuleCategoryEnum}
        assert actual == expected

    def test_catalogue_completeness_statuses(self):
        expected = {
            "NOT_STARTED",
            "DOCUMENTS_COLLECTED",
            "SHADE_DATA_EXTRACTED",
            "SHADE_DATA_VERIFIED",
            "TECHNICAL_RULES_EXTRACTED",
            "TECHNICAL_RULES_VERIFIED",
            "READY_FOR_TESTING",
            "APPROVED_FOR_PRODUCTION",
        }
        actual = {cs.value for cs in CatalogueCompletenessEnum}
        assert actual == expected

    def test_product_types(self):
        expected = {"COLOUR", "DEVELOPER", "LIGHTENER", "ADDITIVE", "TONER", "OTHER"}
        actual = {pt.value for pt in ProductTypeEnum}
        assert actual == expected

    def test_concentration_types(self):
        expected = {"VOLUME", "PERCENTAGE", "OTHER"}
        actual = {ct.value for ct in ConcentrationTypeEnum}
        assert actual == expected

    def test_manufacturer_status(self):
        expected = {"ACTIVE", "INACTIVE"}
        actual = {ms.value for ms in ManufacturerStatusEnum}
        assert actual == expected

    def test_permission_status(self):
        expected = {"PENDING", "GRANTED", "DENIED", "NOT_REQUIRED"}
        actual = {ps.value for ps in PermissionStatusEnum}
        assert actual == expected
