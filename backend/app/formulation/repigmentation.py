"""
Repigmentation, Tint-Back & Colour Filler Engine — Version 1.0.

Implements automated underlying pigment calculation and multi-step filler
formulation when darkening hair by >= 2 levels or over porous/lightened hair.
Conforms strictly to professional colourimetry:
    - Delta = -2 levels: Add warm/gold priming component (25% warm tone to base).
    - Delta = -3 levels: Add copper priming filler (Level 6/7 Copper/Gold).
    - Delta <= -4 levels: Mandate two-step pre-pigmentation with red/copper filler.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from backend.app.formulation.enums import ServiceClassificationEnum
from backend.app.formulation.schemas import (
    DeveloperComponentFormula,
    FormulationStage,
    ProductComponentFormula,
)
from backend.app.models.manufacturers import Developer, Manufacturer, ManufacturerShade
from backend.app.universal_colour.enums import HairRegionEnum, ToneFamilyEnum

# ---------------------------------------------------------------------------
# Underlying Pigment Specification by Depth Level (1 to 10)
# ---------------------------------------------------------------------------
UNDERLYING_PIGMENT_MAP: dict[int, dict[str, Any]] = {
    10: {
        "depth": 10,
        "warmth_name": "PALE_YELLOW",
        "primary_tone": ToneFamilyEnum.YELLOW,
        "filler_tone": ToneFamilyEnum.GOLD,
        "shade_suffix_wella": "/03",
        "shade_suffix_loreal": ".3",
        "description": "Pale Yellow underlying pigment.",
    },
    9: {
        "depth": 9,
        "warmth_name": "YELLOW",
        "primary_tone": ToneFamilyEnum.YELLOW,
        "filler_tone": ToneFamilyEnum.GOLD,
        "shade_suffix_wella": "/3",
        "shade_suffix_loreal": ".3",
        "description": "Yellow underlying pigment.",
    },
    8: {
        "depth": 8,
        "warmth_name": "YELLOW_GOLD",
        "primary_tone": ToneFamilyEnum.GOLD,
        "filler_tone": ToneFamilyEnum.GOLD,
        "shade_suffix_wella": "/34",
        "shade_suffix_loreal": ".34",
        "description": "Yellow-Gold underlying pigment.",
    },
    7: {
        "depth": 7,
        "warmth_name": "ORANGE_GOLD",
        "primary_tone": ToneFamilyEnum.COPPER,
        "filler_tone": ToneFamilyEnum.COPPER,
        "shade_suffix_wella": "/43",
        "shade_suffix_loreal": ".43",
        "description": "Orange-Gold / Copper-Gold underlying pigment.",
    },
    6: {
        "depth": 6,
        "warmth_name": "ORANGE",
        "primary_tone": ToneFamilyEnum.COPPER,
        "filler_tone": ToneFamilyEnum.COPPER,
        "shade_suffix_wella": "/4",
        "shade_suffix_loreal": ".4",
        "description": "Orange / Pure Copper underlying pigment.",
    },
    5: {
        "depth": 5,
        "warmth_name": "RED_ORANGE",
        "primary_tone": ToneFamilyEnum.RED,
        "filler_tone": ToneFamilyEnum.RED,
        "shade_suffix_wella": "/45",
        "shade_suffix_loreal": ".45",
        "description": "Red-Orange underlying pigment.",
    },
    4: {
        "depth": 4,
        "warmth_name": "RED",
        "primary_tone": ToneFamilyEnum.RED,
        "filler_tone": ToneFamilyEnum.RED,
        "shade_suffix_wella": "/5",
        "shade_suffix_loreal": ".5",
        "description": "Red underlying pigment.",
    },
    3: {
        "depth": 3,
        "warmth_name": "DARK_RED_BROWN",
        "primary_tone": ToneFamilyEnum.RED,
        "filler_tone": ToneFamilyEnum.RED,
        "shade_suffix_wella": "/5",
        "shade_suffix_loreal": ".5",
        "description": "Dark Red-Brown underlying pigment.",
    },
    2: {
        "depth": 2,
        "warmth_name": "BLACK_RED",
        "primary_tone": ToneFamilyEnum.RED,
        "filler_tone": ToneFamilyEnum.RED,
        "shade_suffix_wella": "/0",
        "shade_suffix_loreal": ".0",
        "description": "Black-Red dense eumelanin.",
    },
    1: {
        "depth": 1,
        "warmth_name": "BLACK",
        "primary_tone": ToneFamilyEnum.NATURAL,
        "filler_tone": ToneFamilyEnum.NATURAL,
        "shade_suffix_wella": "/0",
        "shade_suffix_loreal": ".0",
        "description": "Dense black eumelanin.",
    },
}


def get_underlying_pigment(level: int) -> dict[str, Any]:
    """Returns the natural underlying warm pigment profile for a given depth level."""
    clamped = max(1, min(10, level))
    return UNDERLYING_PIGMENT_MAP[clamped]


# ---------------------------------------------------------------------------
# Repigmentation Strategy Calculation
# ---------------------------------------------------------------------------


def calculate_repigmentation_strategy(
    start_level: int,
    target_level: int,
    is_porous: bool = False,
) -> dict[str, Any]:
    """
    Evaluates whether repigmentation / tint-back is required when darkening,
    and returns the specific formulation protocol.

    Rules:
        - delta_levels >= 0: No repigmentation needed (lifting or same level).
        - delta_levels == -1: Direct deposit (standard formulation).
        - delta_levels == -2: 25% Gold Warm base addition to prevent hollow/khaki cast.
        - delta_levels == -3: 33%–50% Copper-Gold filler addition (e.g. Level 6/7 Copper/Gold).
        - delta_levels <= -4: Mandatory Two-Step Pre-pigmentation with Red/Copper filler.
    """
    delta_levels = target_level - start_level  # negative when darkening

    if delta_levels >= -1:
        return {
            "requires_repigmentation": False,
            "delta_levels": delta_levels,
            "strategy": "DIRECT_DEPOSIT",
            "filler_stage_required": False,
            "warm_tone_ratio": Decimal("0.0"),
            "target_tone_ratio": Decimal("1.0"),
            "filler_tone": None,
            "rationale": (
                "Direct deposit without filler is sufficient."
                if not is_porous
                else "Direct deposit with gentle developer for porous hair."
            ),
        }

    # Delta = -2 levels: Gold / Warm Gold priming addition
    if delta_levels == -2:
        return {
            "requires_repigmentation": True,
            "delta_levels": delta_levels,
            "strategy": "WARMTH_ADDITION_25PCT",
            "filler_stage_required": False,
            "warm_tone_ratio": Decimal("0.25"),
            "target_tone_ratio": Decimal("0.75"),
            "filler_tone": ToneFamilyEnum.GOLD,
            "filler_level": target_level,
            "rationale": (
                f"Darkening by {abs(delta_levels)} levels (Level {start_level} to Level {target_level}) "
                "requires adding 25% warm gold tone to replace missing underlying warmth and avoid khaki/muddy cast."
            ),
        }

    # Delta = -3 levels: Copper / Copper-Gold priming filler
    if delta_levels == -3:
        return {
            "requires_repigmentation": True,
            "delta_levels": delta_levels,
            "strategy": "COPPER_FILLER_INTEGRATED",
            "filler_stage_required": False,
            "warm_tone_ratio": Decimal("0.33"),
            "target_tone_ratio": Decimal("0.67"),
            "filler_tone": ToneFamilyEnum.COPPER,
            "filler_level": min(10, target_level + 1),
            "rationale": (
                f"Darkening by {abs(delta_levels)} levels (Level {start_level} to Level {target_level}) "
                "requires 1/3 Copper/Gold filler to reconstruct lost warm pheomelanin foundation."
            ),
        }

    # Delta <= -4 levels: Two-Step Pre-pigmentation mandatory
    filler_profile = get_underlying_pigment(target_level)
    return {
        "requires_repigmentation": True,
        "delta_levels": delta_levels,
        "strategy": "TWO_STEP_PREPIGMENTATION",
        "filler_stage_required": True,
        "warm_tone_ratio": Decimal("1.0"),
        "target_tone_ratio": Decimal("1.0"),
        "filler_tone": filler_profile["filler_tone"],
        "filler_level": min(10, target_level + 1),
        "rationale": (
            f"Drastic darkening by {abs(delta_levels)} levels (Level {start_level} to Level {target_level}) "
            "mandates a Two-Step Repigmentation process. Step 1 pre-fills hair fibers with warm red/copper "
            "protein filler before Step 2 target deposit to prevent translucent, muddy, or hollow results."
        ),
    }


# ---------------------------------------------------------------------------
# Shade Resolver Helper for Filler Shades
# ---------------------------------------------------------------------------


def find_filler_shade(
    shades: list[ManufacturerShade],
    target_level: int,
    filler_tone: ToneFamilyEnum,
    manufacturer_name: str,
) -> ManufacturerShade | None:
    """Finds the best matching warm filler shade in the manufacturer's active catalogue."""
    is_wella = "wella" in manufacturer_name.lower()

    candidates: list[tuple[int, ManufacturerShade]] = []

    for s in shades:
        if not s.active_status:
            continue
        if s.shade_mappings:
            m = s.shade_mappings[0]
            lvl_match = m.uhcr_level in (target_level, target_level + 1)
            tone_match = m.primary_tone == filler_tone.value or m.secondary_tone == filler_tone.value

            if lvl_match and tone_match:
                score = 20
                if m.uhcr_level == target_level:
                    score += 10
                candidates.append((score, s))

        # Code-based fallback
        code = s.shade_code
        if is_wella:
            if filler_tone == ToneFamilyEnum.GOLD and (f"{target_level}/3" in code or f"{target_level+1}/3" in code) or filler_tone in (ToneFamilyEnum.COPPER, ToneFamilyEnum.RED) and (
                f"{target_level}/4" in code or f"{target_level+1}/4" in code or f"{target_level}/43" in code
            ):
                candidates.append((15, s))
        else:
            if filler_tone == ToneFamilyEnum.GOLD and (f"{target_level}.3" in code or f"{target_level+1}.3" in code) or filler_tone in (ToneFamilyEnum.COPPER, ToneFamilyEnum.RED) and (
                f"{target_level}.4" in code or f"{target_level+1}.4" in code
            ):
                candidates.append((15, s))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    return None


# ---------------------------------------------------------------------------
# Stage Generation for Two-Step Repigmentation
# ---------------------------------------------------------------------------


def build_two_step_repigmentation_stages(
    start_level: int,
    target_level: int,
    target_shade: ManufacturerShade | None,
    filler_shade: ManufacturerShade | None,
    pure_natural_shade: ManufacturerShade | None,
    developers: list[Developer],
    target_regions: list[HairRegionEnum],
    manufacturer: Manufacturer,
    is_porous: bool = True,
) -> tuple[FormulationStage, FormulationStage]:
    """
    Builds the two technical formulation stages for a >= 4 level darkening transformation:
        - Stage 1: Pre-Pigmentation Warm Filler
        - Stage 2: Target Deposit Formula
    """
    is_wella = "wella" in manufacturer.name.lower()

    # --- Stage 1: Pre-Pigmentation Filler ---
    # Find lowest developer (1.9% / 6 Vol or lotion)
    dev_1_9 = None
    for d in developers:
        if abs(d.concentration_percent - Decimal("1.9")) < Decimal("0.2"):
            dev_1_9 = d
            break
    if dev_1_9 is None and developers:
        dev_1_9 = min(developers, key=lambda d: d.concentration_percent)

    filler_code = filler_shade.shade_code if filler_shade else (
        f"{min(10, target_level + 1)}/43" if is_wella else f"{min(10, target_level + 1)}.4"
    )
    filler_name = filler_shade.shade_name if filler_shade else "Warm Copper/Red Repigmentation Filler"

    filler_product = ProductComponentFormula(
        product_type="FILLER",
        product_id=filler_shade.product_id if filler_shade else None,
        product_name=filler_name,
        shade_id=filler_shade.id if filler_shade else None,
        shade_code=filler_code,
        shade_name=filler_name,
        parts=Decimal("1.0"),
        weight_grams=Decimal("30.0"),
        notes="Pre-pigmentation warm filler to replenish lost underlying pheomelanin.",
    )

    stage_1_dev = DeveloperComponentFormula(
        developer_id=dev_1_9.id if dev_1_9 else None,
        developer_name=dev_1_9.product_name if dev_1_9 else "1.9% (6 Vol) Developer / Warm Water",
        concentration_percent=dev_1_9.concentration_percent if dev_1_9 else Decimal("1.9"),
        volume_in_vol=6,
        parts=Decimal("2.0"),
        weight_grams=Decimal("60.0"),
    )

    stage_1 = FormulationStage(
        stage_number=1,
        service_type=ServiceClassificationEnum.DEPOSIT,
        stage_description="Stage 1: Pre-Pigmentation / Repigmentation Warm Filler.",
        target_regions=target_regions,
        products=[filler_product],
        developer=stage_1_dev,
        mixing_ratio_text="1:2",
        development_time_minutes=15,
        development_time_range="10–15 min without heat",
        heat_permitted=False,
        application_instructions=(
            "Apply pre-pigmenting filler evenly to previously lightened / porous sections. "
            "Process for 10–15 minutes. Scrape or blot off excess product thoroughly with a towel. "
            "DO NOT rinse or shampoo before Stage 2 target deposit."
        ),
        rules_applied=["TINT-BACK-PREPIGMENTATION-MANDATE"],
        source_document_references=["Professional Colour Tint-Back & Filler Guidelines"],
    )

    # --- Stage 2: Target Deposit ---
    # Find 1.9% or 3% or 4% developer for gentle deposit without lifting filler
    dev_target = None
    for d in developers:
        if abs(d.concentration_percent - Decimal("3.0")) < Decimal("0.5") or abs(
            d.concentration_percent - Decimal("1.9")
        ) < Decimal("0.2"):
            dev_target = d
            break
    if dev_target is None and dev_1_9:
        dev_target = dev_1_9

    target_products: list[ProductComponentFormula] = []

    if pure_natural_shade is not None:
        # 50% Natural base + 50% Target fashion shade
        target_products.append(
            ProductComponentFormula(
                product_type="PURE_NATURAL",
                product_id=pure_natural_shade.product_id,
                product_name=pure_natural_shade.shade_name,
                shade_id=pure_natural_shade.id,
                shade_code=pure_natural_shade.shade_code,
                shade_name=pure_natural_shade.shade_name,
                parts=Decimal("0.5"),
                weight_grams=Decimal("30.0"),
                is_pure_natural=True,
                notes="Natural depth foundation for stable deposit.",
            )
        )
        target_products.append(
            ProductComponentFormula(
                product_type="SHADE",
                product_id=target_shade.product_id if target_shade else None,
                product_name=target_shade.shade_name if target_shade else "Target Fashion Shade",
                shade_id=target_shade.id if target_shade else None,
                shade_code=target_shade.shade_code if target_shade else f"{target_level}/0",
                shade_name=target_shade.shade_name if target_shade else "Target Shade",
                parts=Decimal("0.5"),
                weight_grams=Decimal("30.0"),
                notes="Target fashion reflect.",
            )
        )
    else:
        target_products.append(
            ProductComponentFormula(
                product_type="SHADE",
                product_id=target_shade.product_id if target_shade else None,
                product_name=target_shade.shade_name if target_shade else "Target Shade",
                shade_id=target_shade.id if target_shade else None,
                shade_code=target_shade.shade_code if target_shade else f"{target_level}/0",
                shade_name=target_shade.shade_name if target_shade else "Target Shade",
                parts=Decimal("1.0"),
                weight_grams=Decimal("60.0"),
                notes="Target colour deposit.",
            )
        )

    stage_2_dev = DeveloperComponentFormula(
        developer_id=dev_target.id if dev_target else None,
        developer_name=dev_target.product_name if dev_target else "1.9% (6 Vol) / 3% (10 Vol) Developer",
        concentration_percent=dev_target.concentration_percent if dev_target else Decimal("1.9"),
        volume_in_vol=6 if (dev_target and dev_target.concentration_percent < Decimal("3.0")) else 10,
        parts=Decimal("1.0") if is_wella else Decimal("1.5"),
        weight_grams=Decimal("60.0") if is_wella else Decimal("90.0"),
    )

    stage_2 = FormulationStage(
        stage_number=2,
        service_type=ServiceClassificationEnum.DARKENING,
        stage_description="Stage 2: Target Deposit & Depth Lock application.",
        target_regions=target_regions,
        products=target_products,
        developer=stage_2_dev,
        mixing_ratio_text="1:1" if is_wella else "1:1.5",
        development_time_minutes=30,
        development_time_range="25–35 min without heat",
        heat_permitted=False,
        application_instructions=(
            "Apply target mixture directly over blotted Stage 1 filler from roots to ends. "
            "Ensure saturated, even saturation. Process for 25–35 minutes without heat. "
            "Emulsify with lukewarm water, rinse thoroughly, and apply acidic colour post-treatment."
        ),
        rules_applied=["TINT-BACK-DEPOSIT-LOCK"],
        source_document_references=["Professional Colour Tint-Back & Filler Guidelines"],
    )

    return stage_1, stage_2
