# Nirav Hairstorm Data Dictionary — Version 1.0

## 1. UHCR Dimensions

| Dimension | Type | Range / Options | Description |
|---|---|---|---|
| `level` | Integer | 1–10 | Standardised ICC depth level (1=Black, 10=Extra Light Blonde) |
| `primary_tone` | Enum | NATURAL, ASH, BLUE, GREEN, VIOLET, PEARL, BEIGE, GOLD, YELLOW, COPPER, ORANGE, RED, MAHOGANY, PINK, MIXED, UNKNOWN | Primary chromatic reflect direction |
| `secondary_tone` | Enum | Same as above (nullable) | Secondary modifier reflect direction |
| `tone_intensity` | Enum | UNKNOWN, SOFT, STANDARD, INTENSE, EXTRA_INTENSE | Intensity of chromatic reflection |
| `colour_family` | Enum | NATURAL, FASHION, SPECIAL_BLONDE, HIGH_LIFT, PASTEL, TONER, GLOSS, CORRECTOR, SPECIAL_MIX, OTHER, UNKNOWN | Product classification group |
| `lightness_l` | Decimal | 0.0 – 100.0 | Measured CIELAB L* |
| `chromatic_a` | Decimal | -128.0 – 127.0 | Measured CIELAB a* (green-red) |
| `chromatic_b` | Decimal | -128.0 – 127.0 | Measured CIELAB b* (blue-yellow) |
| `chroma_c` | Float | Derived >= 0.0 | CIELCh chroma: $\sqrt{a^{*2} + b^{*2}}$ |
| `hue_angle` | Float | Derived 0.0° – 360.0° | CIELCh hue: $\text{atan2}(b^*, a^*)$ converted to degrees |
| `measurement_status` | Enum | VALID, PROVISIONAL, INVALID, NOT_AVAILABLE | Status of physical measurement |
| `mapping_confidence` | Decimal | 0.0000 – 1.0000 | Confidence score for mapping |
| `evidence_reference` | UUID | Foreign UUID | Reference to verification document/tress record |

---

## 2. Manufacturer Database Tables

### `manufacturers`
- `id`: UUID Primary Key
- `name`: VARCHAR(255)
- `slug`: VARCHAR(255) UNIQUE
- `country_of_origin`: VARCHAR(100)
- `supported_markets`: JSONB
- `website`: TEXT
- `status`: ENUM (ACTIVE, INACTIVE)
- `created_at`, `updated_at`: TIMESTAMPTZ

### `product_lines`
- `id`: UUID Primary Key
- `manufacturer_id`: UUID FK -> manufacturers.id
- `name`: VARCHAR(255)
- `service_type`: ENUM (PERMANENT_COLOUR, DEMI_PERMANENT_COLOUR, SEMI_PERMANENT_COLOUR, DIRECT_DYE, TONER, LIGHTENER, BLEACH, COLOUR_REMOVER, GLOSS, OTHER)
- `market`: VARCHAR(100)
- `status`: ENUM (ACTIVE, INACTIVE)
- `catalogue_version_id`: UUID FK -> catalogue_versions.id

### `catalogue_versions`
- `id`: UUID Primary Key
- `manufacturer_id`: UUID FK -> manufacturers.id
- `market`: VARCHAR(100)
- `version`: VARCHAR(50)
- `status`: ENUM (DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED, RETIRED)
- `published_at`: TIMESTAMPTZ
- `supersedes_version_id`: UUID FK -> catalogue_versions.id (self-ref)

### `source_documents`
- `id`: UUID Primary Key
- `manufacturer_id`: UUID FK -> manufacturers.id
- `title`: TEXT
- `document_type`: ENUM (SHADE_CHART, TECHNICAL_MANUAL, DEVELOPER_GUIDE, LIGHTENER_GUIDE, SAFETY_DOCUMENT, PRODUCT_INFORMATION, OTHER)
- `permission_status`: ENUM (PENDING, GRANTED, DENIED, NOT_REQUIRED)
- `verification_status`: ENUM (UNVERIFIED, EXTRACTED, UNDER_REVIEW, VERIFIED, REJECTED, SUPERSEDED)

### `manufacturer_products`
- `id`: UUID Primary Key
- `product_line_id`: UUID FK -> product_lines.id
- `product_name`: VARCHAR(255)
- `product_code`: VARCHAR(100)
- `product_type`: ENUM (COLOUR, DEVELOPER, LIGHTENER, ADDITIVE, TONER, OTHER)
- `market`: VARCHAR(100)
- `active_status`: BOOLEAN
- `verification_status`: ENUM (UNVERIFIED, EXTRACTED, UNDER_REVIEW, VERIFIED, REJECTED, SUPERSEDED)

### `manufacturer_shades`
- `id`: UUID Primary Key
- `product_id`: UUID FK -> manufacturer_products.id
- `shade_code`: VARCHAR(50) — Preserves manufacturer notation verbatim (e.g. `7/1`, `7.1`, `7A`)
- `shade_name`: VARCHAR(255)
- `manufacturer_depth`: VARCHAR(50)
- `manufacturer_tone_code`: VARCHAR(50)
- `manufacturer_family`: VARCHAR(100)
- `market`: VARCHAR(100)
- `active_status`: BOOLEAN
- `catalogue_version_id`: UUID FK -> catalogue_versions.id
- Unique constraint: `(product_id, market, catalogue_version_id, shade_code)`

### `shade_mappings`
- `id`: UUID Primary Key
- `manufacturer_shade_id`: UUID FK -> manufacturer_shades.id
- `uhcr_level`: SMALLINT (Check: 1 <= level <= 10)
- `primary_tone`: VARCHAR(50)
- `secondary_tone`: VARCHAR(50)
- `tone_intensity`: VARCHAR(30)
- `mapping_method`: ENUM (MANUFACTURER_DOCUMENT, EXPERT_VERIFIED, PHYSICAL_MEASUREMENT, EXPERIMENTAL_VALIDATION, PROVISIONAL_AI_EXTRACTION, MANUAL_UNVERIFIED)
- `mapping_confidence`: NUMERIC(5, 4) (Check: 0.0 <= confidence <= 1.0)
- `verification_status`: ENUM (UNVERIFIED, EXTRACTED, UNDER_REVIEW, VERIFIED, REJECTED, SUPERSEDED)

### `developers`
- `id`: UUID Primary Key
- `manufacturer_id`: UUID FK -> manufacturers.id
- `product_name`: VARCHAR(255)
- `concentration_percent`: NUMERIC(5, 2)
- `concentration_type`: ENUM (VOLUME, PERCENTAGE, OTHER)
- `intended_use`: JSONB

### `product_rules`
- `id`: UUID Primary Key
- `product_id`: UUID FK -> manufacturer_products.id
- `market`: VARCHAR(100)
- `service_type`: VARCHAR(50)
- `rule_type`: ENUM (MIXING_RATIO, DEVELOPER_COMPATIBILITY, PROCESSING_TIME, PROCESSING_CONDITIONS, APPLICATION_METHOD, GREY_COVERAGE, SPECIAL_MIX, LIGHTENING, COLOUR_REMOVAL, CONTRAINDICATION, OTHER)
- `conditions`: JSONB
- `actions`: JSONB
- `priority`: INTEGER
- `rule_version`: VARCHAR(20)
