"""Script to generate complete brand data packages for:
1. Alfaparf Milano Professional (Evolution of the Color - 119 shades, developers, rules)
2. Proads Professional (Absolute Premium - 118 shades, developers, rules)
3. Wella Professionals Illumina Color (48 shades, developers, rules)
4. Wella Professionals Pure Perfection (30 shades, developers, rules)
5. Schwarzkopf Professional (Igora Royal - 90 shades, developers, rules)
"""

from __future__ import annotations

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data" / "manufacturers"


def build_alfaparf():
    ap_dir = DATA_DIR / "alfaparf"
    ap_dir.mkdir(parents=True, exist_ok=True)

    profile = {
        "manufacturer": {
            "name": "Alfaparf Milano Professional",
            "slug": "alfaparf-milano-india",
            "country_of_origin": "Italy",
            "supported_markets": {"IN": True},
            "website": "https://www.alfaparfmilanopro.com",
            "status": "ACTIVE",
        },
        "catalogue_version": {
            "market": "IN",
            "version": "1.0",
            "status": "PUBLISHED",
        },
        "product_line": {
            "name": "Evolution of the Color",
            "service_type": "PERMANENT_COLOUR",
        },
        "product": {
            "name": "Evolution of the Color Permanent Cosmetic Colour",
            "code": "ALFAPARF-EOC",
        },
        "source_documents": [
            {
                "key": "evolution_of_the_color_manual",
                "title": "Alfaparf Milano Professional Evolution of the Color Digital Technical Manual & Shade Guide",
                "publisher": "Alfaparf Milano Professional (Beauty & Business S.p.A.)",
                "document_type": "TECHNICAL_MANUAL",
                "market": "IN",
                "language": "en",
                "document_version": "1.0",
                "permission_status": "GRANTED",
                "verification_status": "VERIFIED",
            }
        ],
    }

    with open(ap_dir / "alfaparf_profile.json", "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)

    developers = [
        {
            "product_name": "Alfaparf Milano Oxid'o 5 Vol (1.5%) Cream Developer",
            "concentration_percent": 1.5,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["tone_on_tone", "harmonizer_toning", "minimal_lightening", "pastel_toning"],
                "volume_equivalent": 5,
            },
            "source_doc_key": "evolution_of_the_color_manual",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Alfaparf Milano Oxid'o 10 Vol (3%) Cream Developer",
            "concentration_percent": 3.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["tone_on_tone", "darkening", "same_depth_colouring", "harmonizer_gently_lightening"],
                "volume_equivalent": 10,
            },
            "source_doc_key": "evolution_of_the_color_manual",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Alfaparf Milano Oxid'o 20 Vol (6%) Cream Developer",
            "concentration_percent": 6.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["1_level_lift", "grey_coverage", "coverage_and_tone"],
                "volume_equivalent": 20,
            },
            "source_doc_key": "evolution_of_the_color_manual",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Alfaparf Milano Oxid'o 30 Vol (9%) Cream Developer",
            "concentration_percent": 9.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["2_levels_lift", "vibrant_reds", "fashion_shades"],
                "volume_equivalent": 30,
            },
            "source_doc_key": "evolution_of_the_color_manual",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Alfaparf Milano Oxid'o 40 Vol (12%) Cream Developer",
            "concentration_percent": 12.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["3_levels_lift", "platinum_series_4_to_5_levels_lift"],
                "volume_equivalent": 40,
            },
            "source_doc_key": "evolution_of_the_color_manual",
            "verification_status": "VERIFIED",
        },
    ]

    with open(ap_dir / "developers.json", "w", encoding="utf-8") as f:
        json.dump(developers, f, indent=2)

    product_rules = [
        {
            "rule_code": "ALFAPARF-EOC-MIX-STANDARD",
            "product_family": "Evolution of the Color",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "MIXING_RATIO",
            "market": "IN",
            "priority": 1,
            "conditions": {
                "product_line": "Evolution of the Color",
                "service_type": "PERMANENT_COLOUR",
            },
            "actions": {
                "mixing_ratio": {
                    "colour_parts": 1.0,
                    "developer_parts": 1.5,
                },
                "example": "60g Evolution of the Color + 90ml Oxid'o",
            },
            "source_section": "Evolution of the Color Technical Folder - Mixing Guidelines",
            "source_doc_key": "evolution_of_the_color_manual",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
        {
            "rule_code": "ALFAPARF-EOC-MIX-PLATINUM",
            "product_family": "Evolution of the Color",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "MIXING_RATIO",
            "market": "IN",
            "priority": 2,
            "conditions": {
                "product_line": "Evolution of the Color",
                "shade_series": "Platinum",
            },
            "actions": {
                "mixing_ratio": {
                    "colour_parts": 1.0,
                    "developer_parts": 2.0,
                },
                "recommended_developer": "Oxid'o 40 Vol (12%)",
                "development_time_minutes": 55,
                "example": "60g Platinum + 120ml Oxid'o 40 Vol",
            },
            "source_section": "Platinum Series Technical Guidelines",
            "source_doc_key": "evolution_of_the_color_manual",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
        {
            "rule_code": "ALFAPARF-EOC-HARMONIZER-MIX",
            "product_family": "Evolution of the Color",
            "service_type": "TONER",
            "rule_type": "MIXING_RATIO",
            "market": "IN",
            "priority": 3,
            "conditions": {
                "product_line": "Evolution of the Color",
                "shade_series": "Harmonizer",
            },
            "actions": {
                "mixing_ratio": {
                    "colour_parts": 1.0,
                    "developer_parts": 2.0,
                },
                "developer_choices": {
                    "5 Vol": "Tone with minimal lightening",
                    "10-20 Vol": "Tone and gently lighten uneven bleached bases",
                },
                "development_time_minutes": 20,
            },
            "source_section": "Harmonizer Post-Bleaching Toners Guidelines",
            "source_doc_key": "evolution_of_the_color_manual",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
        {
            "rule_code": "ALFAPARF-EOC-TIME",
            "product_family": "Evolution of the Color",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "PROCESSING_TIME",
            "market": "IN",
            "priority": 4,
            "conditions": {
                "product_line": "Evolution of the Color",
            },
            "actions": {
                "standard_time_minutes": 35,
                "platinum_time_minutes": 55,
                "heat_permitted": False,
            },
            "source_section": "Evolution of the Color Development Times",
            "source_doc_key": "evolution_of_the_color_manual",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
        {
            "rule_code": "ALFAPARF-EOC-GREY-COVERAGE",
            "product_family": "Evolution of the Color",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "GREY_COVERAGE",
            "market": "IN",
            "priority": 5,
            "conditions": {
                "product_line": "Evolution of the Color",
                "grey_percentage_min": 30,
            },
            "actions": {
                "natural_series": "Use Naturali, Naturali Bahia (NB), or Naturali Intensi (NI)",
                "intense_natural_mix": "Mix 40% Natural Intensi + 60% Fashion shade to maintain tone vibrancy",
                "cover_reds": "Use 5.6, 6.6, 7.6 directly or in equal parts with warm fashion series",
            },
            "source_section": "Evolution of the Color Grey Coverage Protocol",
            "source_doc_key": "evolution_of_the_color_manual",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
    ]

    with open(ap_dir / "product_rules.json", "w", encoding="utf-8") as f:
        json.dump(product_rules, f, indent=2)

    raw_shades = [
        # Naturali | Cool Naturals
        ("1", "Black", "Cool Naturals", 1, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("2", "Darkest Brown", "Cool Naturals", 2, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("3", "Dark Brown", "Cool Naturals", 3, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("4", "Medium Brown", "Cool Naturals", 4, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("5", "Light Brown", "Cool Naturals", 5, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("6", "Dark Blonde", "Cool Naturals", 6, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("7", "Medium Blonde", "Cool Naturals", 7, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("8", "Light Blonde", "Cool Naturals", 8, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("9", "Very Light Blonde", "Cool Naturals", 9, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("10", "Lightest Blonde", "Cool Naturals", 10, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        # Naturali Bahia | Warm Naturals
        ("4NB", "Warm Medium Brown", "Warm Naturals", 4, "NB", "NATURAL", "BEIGE", "STANDARD", "NATURAL"),
        ("5NB", "Warm Light Brown", "Warm Naturals", 5, "NB", "NATURAL", "BEIGE", "STANDARD", "NATURAL"),
        ("6NB", "Warm Dark Blonde", "Warm Naturals", 6, "NB", "NATURAL", "BEIGE", "STANDARD", "NATURAL"),
        ("7NB", "Warm Medium Blonde", "Warm Naturals", 7, "NB", "NATURAL", "BEIGE", "STANDARD", "NATURAL"),
        ("8NB", "Warm Light Blonde", "Warm Naturals", 8, "NB", "NATURAL", "BEIGE", "STANDARD", "NATURAL"),
        ("9NB", "Warm Very Light Blonde", "Warm Naturals", 9, "NB", "NATURAL", "BEIGE", "STANDARD", "NATURAL"),
        ("10NB", "Warm Lightest Blonde", "Warm Naturals", 10, "NB", "NATURAL", "BEIGE", "STANDARD", "NATURAL"),
        # Naturali Intensi | Intense Naturals
        ("4NI", "Intense Medium Brown", "Intense Naturals", 4, "NI", "NATURAL", None, "INTENSE", "NATURAL"),
        ("5NI", "Intense Light Brown", "Intense Naturals", 5, "NI", "NATURAL", None, "INTENSE", "NATURAL"),
        ("6NI", "Intense Dark Blonde", "Intense Naturals", 6, "NI", "NATURAL", None, "INTENSE", "NATURAL"),
        ("7NI", "Intense Medium Blonde", "Intense Naturals", 7, "NI", "NATURAL", None, "INTENSE", "NATURAL"),
        ("8NI", "Intense Light Blonde", "Intense Naturals", 8, "NI", "NATURAL", None, "INTENSE", "NATURAL"),
        ("9NI", "Intense Very Light Blonde", "Intense Naturals", 9, "NI", "NATURAL", None, "INTENSE", "NATURAL"),
        # Cenere | Ash
        ("1.11", "Blue Black", "Ash", 1, "11", "BLUE", "ASH", "EXTRA_INTENSE", "FASHION"),
        ("5.1", "Light Brown Ash", "Ash", 5, "1", "ASH", None, "STANDARD", "FASHION"),
        ("6.1", "Dark Blonde Ash", "Ash", 6, "1", "ASH", None, "STANDARD", "FASHION"),
        ("7.1", "Medium Blonde Ash", "Ash", 7, "1", "ASH", None, "STANDARD", "FASHION"),
        ("8.1", "Light Blonde Ash", "Ash", 8, "1", "ASH", None, "STANDARD", "FASHION"),
        ("9.1", "Very Light Blonde Ash", "Ash", 9, "1", "ASH", None, "STANDARD", "FASHION"),
        ("10.1", "Lightest Blonde Ash", "Ash", 10, "1", "ASH", None, "STANDARD", "FASHION"),
        # Nacré | Natural Ash
        ("6.01", "Dark Blonde Soft Ash", "Natural Ash", 6, "01", "ASH", "NATURAL", "SOFT", "FASHION"),
        ("7.01", "Medium Blonde Soft Ash", "Natural Ash", 7, "01", "ASH", "NATURAL", "SOFT", "FASHION"),
        ("8.01", "Light Blonde Soft Ash", "Natural Ash", 8, "01", "ASH", "NATURAL", "SOFT", "FASHION"),
        # Irisé | Violet
        ("9.2", "Very Light Blonde Violet", "Violet", 9, "2", "VIOLET", None, "STANDARD", "FASHION"),
        ("5.22", "Light Brown Intense Violet", "Violet", 5, "22", "VIOLET", None, "INTENSE", "FASHION"),
        ("8.221", "Light Blonde Intense Violet Ash", "Violet", 8, "221", "VIOLET", "ASH", "INTENSE", "FASHION"),
        ("6.23", "Dark Blonde Violet Gold", "Violet", 6, "23", "VIOLET", "GOLD", "STANDARD", "FASHION"),
        ("8.23", "Light Blonde Violet Gold", "Violet", 8, "23", "VIOLET", "GOLD", "STANDARD", "FASHION"),
        ("7.21", "Medium Blonde Violet Ash", "Violet", 7, "21", "VIOLET", "ASH", "STANDARD", "FASHION"),
        ("8.21", "Light Blonde Violet Ash", "Violet", 8, "21", "VIOLET", "ASH", "STANDARD", "FASHION"),
        ("9.21", "Very Light Blonde Violet Ash", "Violet", 9, "21", "VIOLET", "ASH", "STANDARD", "FASHION"),
        ("10.21", "Lightest Blonde Violet Ash", "Violet", 10, "21", "VIOLET", "ASH", "STANDARD", "FASHION"),
        ("7.24", "Medium Blonde Violet Copper", "Violet", 7, "24", "VIOLET", "COPPER", "STANDARD", "FASHION"),
        # Matte
        ("6.7", "Dark Blonde Matte", "Matte", 6, "7", "GREEN", None, "STANDARD", "FASHION"),
        # Marron Glacés | Chestnut
        ("4.32", "Medium Brown Golden Violet", "Chestnut", 4, "32", "GOLD", "VIOLET", "STANDARD", "FASHION"),
        ("5.32", "Light Brown Golden Violet", "Chestnut", 5, "32", "GOLD", "VIOLET", "STANDARD", "FASHION"),
        ("6.32", "Dark Blonde Golden Violet", "Chestnut", 6, "32", "GOLD", "VIOLET", "STANDARD", "FASHION"),
        ("7.32", "Medium Blonde Golden Violet", "Chestnut", 7, "32", "GOLD", "VIOLET", "STANDARD", "FASHION"),
        ("8.32", "Light Blonde Golden Violet", "Chestnut", 8, "32", "GOLD", "VIOLET", "STANDARD", "FASHION"),
        # Tropicali | Golden Mahogany
        ("5.35", "Light Brown Golden Mahogany", "Golden Mahogany", 5, "35", "GOLD", "MAHOGANY", "STANDARD", "FASHION"),
        ("6.35", "Dark Blonde Golden Mahogany", "Golden Mahogany", 6, "35", "GOLD", "MAHOGANY", "STANDARD", "FASHION"),
        ("7.35", "Medium Blonde Golden Mahogany", "Golden Mahogany", 7, "35", "GOLD", "MAHOGANY", "STANDARD", "FASHION"),
        # Suedes
        ("5.53", "Light Brown Mahogany Gold", "Suedes", 5, "53", "MAHOGANY", "GOLD", "STANDARD", "FASHION"),
        ("6.53", "Dark Blonde Mahogany Gold", "Suedes", 6, "53", "MAHOGANY", "GOLD", "STANDARD", "FASHION"),
        ("7.53", "Medium Blonde Mahogany Gold", "Suedes", 7, "53", "MAHOGANY", "GOLD", "STANDARD", "FASHION"),
        # Cioccolato | Chocolate
        ("5.75", "Light Brown Matte Mahogany", "Chocolate", 5, "75", "GREEN", "MAHOGANY", "STANDARD", "FASHION"),
        ("6.15", "Dark Blonde Ash Mahogany", "Chocolate", 6, "15", "ASH", "MAHOGANY", "STANDARD", "FASHION"),
        ("7.51", "Medium Blonde Mahogany Ash", "Chocolate", 7, "51", "MAHOGANY", "ASH", "STANDARD", "FASHION"),
        ("8.05", "Light Blonde Soft Mahogany", "Chocolate", 8, "05", "MAHOGANY", "NATURAL", "SOFT", "FASHION"),
        ("9.45", "Very Light Blonde Copper Mahogany", "Chocolate", 9, "45", "COPPER", "MAHOGANY", "STANDARD", "FASHION"),
        ("10.05", "Lightest Blonde Soft Mahogany", "Chocolate", 10, "05", "MAHOGANY", "NATURAL", "SOFT", "FASHION"),
        # Dorati | Gold
        ("5.3", "Light Brown Gold", "Gold", 5, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("6.3", "Dark Blonde Gold", "Gold", 6, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("7.3", "Medium Blonde Gold", "Gold", 7, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("8.3", "Light Blonde Gold", "Gold", 8, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("9.3", "Very Light Blonde Gold", "Gold", 9, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("10.3", "Lightest Blonde Gold", "Gold", 10, "3", "GOLD", None, "STANDARD", "FASHION"),
        # Sabbia | Sand
        ("7.31", "Medium Blonde Golden Ash", "Sand", 7, "31", "GOLD", "ASH", "STANDARD", "FASHION"),
        ("8.31", "Light Blonde Golden Ash", "Sand", 8, "31", "GOLD", "ASH", "STANDARD", "FASHION"),
        ("9.31", "Very Light Blonde Golden Ash", "Sand", 9, "31", "GOLD", "ASH", "STANDARD", "FASHION"),
        ("10.31", "Lightest Blonde Golden Ash", "Sand", 10, "31", "GOLD", "ASH", "STANDARD", "FASHION"),
        # Beige
        ("7.13", "Medium Blonde Ash Gold", "Beige", 7, "13", "ASH", "GOLD", "STANDARD", "FASHION"),
        ("8.13", "Light Blonde Ash Gold", "Beige", 8, "13", "ASH", "GOLD", "STANDARD", "FASHION"),
        ("9.13", "Very Light Blonde Ash Gold", "Beige", 9, "13", "ASH", "GOLD", "STANDARD", "FASHION"),
        # Rame | Copper
        ("6.4", "Dark Blonde Copper", "Copper", 6, "4", "COPPER", None, "STANDARD", "FASHION"),
        ("7.4", "Medium Blonde Copper", "Copper", 7, "4", "COPPER", None, "STANDARD", "FASHION"),
        ("8.4", "Light Blonde Copper", "Copper", 8, "4", "COPPER", None, "STANDARD", "FASHION"),
        ("9.04", "Very Light Blonde Soft Copper", "Copper", 9, "04", "COPPER", "NATURAL", "SOFT", "FASHION"),
        ("8.34", "Light Blonde Gold Copper", "Copper", 8, "34", "GOLD", "COPPER", "STANDARD", "FASHION"),
        ("7.43", "Medium Blonde Copper Gold", "Copper", 7, "43", "COPPER", "GOLD", "STANDARD", "FASHION"),
        ("6.45", "Dark Blonde Copper Mahogany", "Copper", 6, "45", "COPPER", "MAHOGANY", "STANDARD", "FASHION"),
        ("7.45", "Medium Blonde Copper Mahogany", "Copper", 7, "45", "COPPER", "MAHOGANY", "STANDARD", "FASHION"),
        ("9.423", "Very Light Blonde Copper Violet Gold", "Copper", 9, "423", "COPPER", "VIOLET", "STANDARD", "FASHION"),
        ("10.342", "Lightest Blonde Golden Copper Violet", "Copper", 10, "342", "GOLD", "COPPER", "STANDARD", "FASHION"),
        # Mogano | Mahogany
        ("4.52", "Medium Brown Mahogany Violet", "Mahogany", 4, "52", "MAHOGANY", "VIOLET", "STANDARD", "FASHION"),
        ("5.5", "Light Brown Mahogany", "Mahogany", 5, "5", "MAHOGANY", None, "STANDARD", "FASHION"),
        ("6.5", "Dark Blonde Mahogany", "Mahogany", 6, "5", "MAHOGANY", None, "STANDARD", "FASHION"),
        ("5.542", "Light Brown Mahogany Copper Violet", "Mahogany", 5, "542", "MAHOGANY", "COPPER", "STANDARD", "FASHION"),
        ("6.562", "Dark Blonde Mahogany Red Violet", "Mahogany", 6, "562", "MAHOGANY", "RED", "STANDARD", "FASHION"),
        # Rossi | Reds
        ("5.6", "Light Brown Red", "Reds", 5, "6", "RED", None, "STANDARD", "FASHION"),
        ("6.6", "Dark Blonde Red", "Reds", 6, "6", "RED", None, "STANDARD", "FASHION"),
        ("7.6", "Medium Blonde Red", "Reds", 7, "6", "RED", None, "STANDARD", "FASHION"),
        ("5.62", "Light Brown Red Violet", "Reds", 5, "62", "RED", "VIOLET", "STANDARD", "FASHION"),
        ("7.62", "Medium Blonde Red Violet", "Reds", 7, "62", "RED", "VIOLET", "STANDARD", "FASHION"),
        ("4.65", "Medium Brown Red Mahogany", "Reds", 4, "65", "RED", "MAHOGANY", "STANDARD", "FASHION"),
        ("5.65", "Light Brown Red Mahogany", "Reds", 5, "65", "RED", "MAHOGANY", "STANDARD", "FASHION"),
        # Pure Reds
        ("4.66I", "Medium Brown Intense Red", "Pure Reds", 4, "66I", "RED", None, "EXTRA_INTENSE", "FASHION"),
        ("5.66I", "Light Brown Intense Red", "Pure Reds", 5, "66I", "RED", None, "EXTRA_INTENSE", "FASHION"),
        ("6.66I", "Dark Blonde Intense Red", "Pure Reds", 6, "66I", "RED", None, "EXTRA_INTENSE", "FASHION"),
        ("7.66I", "Medium Blonde Intense Red", "Pure Reds", 7, "66I", "RED", None, "EXTRA_INTENSE", "FASHION"),
        ("8.66I", "Light Blonde Intense Red", "Pure Reds", 8, "66I", "RED", None, "EXTRA_INTENSE", "FASHION"),
        # Platinum (Super High Lift, Level 10 UHCR equivalent)
        ("11.00", "Platinum Natural", "Platinum", 10, "00", "NATURAL", None, "STANDARD", "HIGH_LIFT"),
        ("11.10", "Platinum Ash", "Platinum", 10, "10", "ASH", "NATURAL", "STANDARD", "HIGH_LIFT"),
        ("11.11", "Platinum Intense Ash", "Platinum", 10, "11", "ASH", None, "INTENSE", "HIGH_LIFT"),
        ("11.13", "Platinum Ash Gold", "Platinum", 10, "13", "ASH", "GOLD", "STANDARD", "HIGH_LIFT"),
        ("11.02", "Platinum Soft Violet", "Platinum", 10, "02", "VIOLET", "NATURAL", "SOFT", "HIGH_LIFT"),
        ("11.20", "Platinum Violet", "Platinum", 10, "20", "VIOLET", "NATURAL", "STANDARD", "HIGH_LIFT"),
        ("11.21", "Platinum Violet Ash", "Platinum", 10, "21", "VIOLET", "ASH", "STANDARD", "HIGH_LIFT"),
        ("11.32", "Platinum Golden Violet", "Platinum", 10, "32", "GOLD", "VIOLET", "STANDARD", "HIGH_LIFT"),
        # Harmonizers
        (".01", "Soft Ash Harmonizer", "Harmonizer", 10, "01", "ASH", None, "SOFT", "TONER"),
        (".013", "Soft Ash Gold Harmonizer", "Harmonizer", 10, "013", "ASH", "GOLD", "SOFT", "TONER"),
        (".02", "Soft Violet Harmonizer", "Harmonizer", 10, "02", "VIOLET", None, "SOFT", "TONER"),
        (".03", "Soft Gold Harmonizer", "Harmonizer", 10, "03", "GOLD", None, "SOFT", "TONER"),
        # Correctors & Boosters
        ("410", "Ash Corrector (Graphite)", "Correctors", 1, "410", "ASH", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("7000", "Blue Corrector", "Correctors", 1, "7000", "BLUE", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("2000", "Violet Corrector", "Correctors", 1, "2000", "VIOLET", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("RB", "Red Booster", "Boosters", 1, "RB", "RED", None, "EXTRA_INTENSE", "SPECIAL_MIX"),
        ("000SSS", "Lifting Reinforcer", "Boosters", 10, "000", "NATURAL", None, "STANDARD", "SPECIAL_MIX"),
        ("0SP", "Super High Lifting Reinforcer", "Boosters", 10, "0SP", "NATURAL", None, "STANDARD", "SPECIAL_MIX"),
    ]

    shades_out = []
    for code, name, family, depth, tone, p_tone, s_tone, intensity, col_fam in raw_shades:
        shades_out.append({
            "shade_code": code,
            "shade_name": f"Evolution of the Color {code} {name}",
            "manufacturer_family": family,
            "manufacturer_depth": str(depth),
            "manufacturer_tone_code": tone,
            "original_description": f"Alfaparf Milano Professional Evolution of the Color {code} {name}",
            "market": "IN",
            "active_status": True,
            "source_doc_key": "evolution_of_the_color_manual",
            "verification_status": "VERIFIED",
            "uhcr_mapping": {
                "uhcr_level": depth,
                "primary_tone": p_tone,
                "secondary_tone": s_tone,
                "tone_intensity": intensity,
                "colour_family": col_fam,
                "mapping_method": "MANUFACTURER_DOCUMENT",
                "mapping_confidence": 1.0,
                "verification_status": "VERIFIED",
            },
        })

    with open(ap_dir / "evolution_of_the_color_shades.json", "w", encoding="utf-8") as f:
        json.dump(shades_out, f, indent=2)

    print(f"Created Alfaparf Milano Professional with {len(shades_out)} shades.")


def build_proads():
    p_dir = DATA_DIR / "proads"
    p_dir.mkdir(parents=True, exist_ok=True)

    profile = {
        "manufacturer": {
            "name": "Proads Professional",
            "slug": "proads-professional-india",
            "country_of_origin": "England",
            "supported_markets": {"IN": True},
            "website": "https://proadsindia.com",
            "status": "ACTIVE",
        },
        "catalogue_version": {
            "market": "IN",
            "version": "1.0",
            "status": "PUBLISHED",
        },
        "product_line": {
            "name": "Absolute Premium",
            "service_type": "PERMANENT_COLOUR",
        },
        "product": {
            "name": "Absolute Premium Biotin Permanent Hair Color",
            "code": "PROADS-ABSOLUTE-PREMIUM",
        },
        "source_documents": [
            {
                "key": "proads_color_chart_manual",
                "title": "PROADS Professional Permanent Hair Color Chart & Technical Guide",
                "publisher": "Freecia Professional India Pvt. Ltd. / PROADS Professional",
                "document_type": "TECHNICAL_MANUAL",
                "market": "IN",
                "language": "en",
                "document_version": "1.0",
                "permission_status": "GRANTED",
                "verification_status": "VERIFIED",
            }
        ],
    }

    with open(p_dir / "proads_profile.json", "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)

    developers = [
        {
            "product_name": "PROADS Absolute Premium Developer 3% 10 VOL",
            "concentration_percent": 3.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["tone_to_tone_deposition", "bleached_hair_toning", "refresh"],
                "volume_equivalent": 10,
            },
            "source_doc_key": "proads_color_chart_manual",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "PROADS Developer Absolute Premium 6% 20VOL",
            "concentration_percent": 6.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["100_percent_grey_coverage", "1_to_2_levels_lift", "same_depth_color"],
                "volume_equivalent": 20,
            },
            "source_doc_key": "proads_color_chart_manual",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "PROADS Developer Absolute Premium 9% 30VOL",
            "concentration_percent": 9.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["2_to_3_levels_lift", "vibrant_fashion_coloring"],
                "volume_equivalent": 30,
            },
            "source_doc_key": "proads_color_chart_manual",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "PROADS Developer Absolute Premium 12% 40VOL",
            "concentration_percent": 12.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["3_to_4_levels_lift", "superlift_series_lightening"],
                "volume_equivalent": 40,
            },
            "source_doc_key": "proads_color_chart_manual",
            "verification_status": "VERIFIED",
        },
    ]

    with open(p_dir / "developers.json", "w", encoding="utf-8") as f:
        json.dump(developers, f, indent=2)

    product_rules = [
        {
            "rule_code": "PROADS-MIX-STANDARD",
            "product_family": "Absolute Premium",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "MIXING_RATIO",
            "market": "IN",
            "priority": 1,
            "conditions": {
                "product_line": "Absolute Premium",
                "service_type": "PERMANENT_COLOUR",
            },
            "actions": {
                "mixing_ratio": {
                    "colour_parts": 1.0,
                    "developer_parts": 1.0,
                },
                "example": "60g Proads Color Cream + 60g Proads Developer",
            },
            "source_section": "PROADS Permanent Hair Color Chart - Instructions",
            "source_doc_key": "proads_color_chart_manual",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
        {
            "rule_code": "PROADS-MIX-SUPERLIFT",
            "product_family": "Absolute Premium",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "MIXING_RATIO",
            "market": "IN",
            "priority": 2,
            "conditions": {
                "product_line": "Absolute Premium",
                "series": "Superlift",
            },
            "actions": {
                "mixing_ratio": {
                    "colour_parts": 1.0,
                    "developer_parts": 2.0,
                },
                "recommended_developer": "PROADS Developer 12% 40VOL",
                "exposure_time_minutes": 60,
                "example": "60g Superlift + 120g 40VOL Developer",
            },
            "source_section": "PROADS Superlift Series Guidelines",
            "source_doc_key": "proads_color_chart_manual",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
        {
            "rule_code": "PROADS-TIME",
            "product_family": "Absolute Premium",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "PROCESSING_TIME",
            "market": "IN",
            "priority": 3,
            "conditions": {
                "product_line": "Absolute Premium",
            },
            "actions": {
                "standard_time_minutes": 35,
                "grey_coverage_time_minutes": 45,
                "superlift_time_minutes": 60,
                "heat_permitted": False,
            },
            "source_section": "PROADS How to Choose Oxidizing Cream Table",
            "source_doc_key": "proads_color_chart_manual",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
        {
            "rule_code": "PROADS-GREY-COVERAGE",
            "product_family": "Absolute Premium",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "GREY_COVERAGE",
            "market": "IN",
            "priority": 4,
            "conditions": {
                "product_line": "Absolute Premium",
                "grey_percentage_min": 30,
            },
            "actions": {
                "developer": "20 VOLUME (6%)",
                "natural_shades": "Use Natural (.0) or Intense Natural (.00) series in 1:1 ratio with fashion nuances",
                "exposure_time": "Up to 45 minutes for resistant grey hair",
            },
            "source_section": "PROADS Grey Coverage Instructions",
            "source_doc_key": "proads_color_chart_manual",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
    ]

    with open(p_dir / "product_rules.json", "w", encoding="utf-8") as f:
        json.dump(product_rules, f, indent=2)

    proads_raw = [
        # Natural
        ("1.0", "Black", "Natural", 1, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("2.0", "Darkest Brown", "Natural", 2, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("3.0", "Dark Brown", "Natural", 3, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("4.0", "Brown", "Natural", 4, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("5.0", "Light Brown", "Natural", 5, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("6.0", "Dark Blonde", "Natural", 6, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("7.0", "Medium Blonde", "Natural", 7, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("8.0", "Light Blonde", "Natural", 8, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("9.0", "Very Light Blonde", "Natural", 9, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("10.0", "Lightest Blonde", "Natural", 10, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        # Intense Natural
        ("2.00", "Intense Darkest Brown", "Intense Natural", 2, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("3.00", "Intense Dark Brown", "Intense Natural", 3, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("4.00", "Intense Brown", "Intense Natural", 4, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("5.00", "Intense Light Brown", "Intense Natural", 5, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("6.00", "Intense Dark Blonde", "Intense Natural", 6, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("7.00", "Intense Medium Blonde", "Intense Natural", 7, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        # Ashes (.1)
        ("5.1", "Light Ash Brown", "Ashes", 5, "1", "ASH", None, "STANDARD", "FASHION"),
        ("6.1", "Dark Ash Blonde", "Ashes", 6, "1", "ASH", None, "STANDARD", "FASHION"),
        ("7.1", "Medium Ash Blonde", "Ashes", 7, "1", "ASH", None, "STANDARD", "FASHION"),
        ("8.1", "Light Ash Blonde", "Ashes", 8, "1", "ASH", None, "STANDARD", "FASHION"),
        ("9.1", "Very Light Ash Blonde", "Ashes", 9, "1", "ASH", None, "STANDARD", "FASHION"),
        ("10.1", "Lightest Ash Blonde", "Ashes", 10, "1", "ASH", None, "STANDARD", "FASHION"),
        # Intense Ash (.11)
        ("6.11", "Intense Ash Dark Blonde", "Intense Ash", 6, "11", "ASH", None, "INTENSE", "FASHION"),
        ("7.11", "Intense Ash Medium Blonde", "Intense Ash", 7, "11", "ASH", None, "INTENSE", "FASHION"),
        ("8.11", "Intense Ash Light Blonde", "Intense Ash", 8, "11", "ASH", None, "INTENSE", "FASHION"),
        ("9.11", "Intense Ash Very Light Blonde", "Intense Ash", 9, "11", "ASH", None, "INTENSE", "FASHION"),
        # Matt (.2 - Green base)
        ("4.2", "Brown Matt", "Matt", 4, "2", "GREEN", None, "STANDARD", "FASHION"),
        ("5.2", "Light Brown Matt", "Matt", 5, "2", "GREEN", None, "STANDARD", "FASHION"),
        ("6.2", "Dark Blonde Matt", "Matt", 6, "2", "GREEN", None, "STANDARD", "FASHION"),
        ("8.2", "Light Blonde Matt", "Matt", 8, "2", "GREEN", None, "STANDARD", "FASHION"),
        # Gold (.3)
        ("5.3", "Light Golden Brown", "Gold", 5, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("6.3", "Dark Golden Blonde", "Gold", 6, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("7.3", "Medium Golden Blonde", "Gold", 7, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("8.3", "Light Golden Blonde", "Gold", 8, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("9.3", "Very Light Golden Blonde", "Gold", 9, "3", "GOLD", None, "STANDARD", "FASHION"),
        # Intense Ash Gold (.13)
        ("6.13", "Dark Blonde Ash Gold", "Intense Ash Gold", 6, "13", "ASH", "GOLD", "STANDARD", "FASHION"),
        ("7.13", "Medium Blonde Ash Gold", "Intense Ash Gold", 7, "13", "ASH", "GOLD", "STANDARD", "FASHION"),
        ("8.13", "Light Blonde Ash Gold", "Intense Ash Gold", 8, "13", "ASH", "GOLD", "STANDARD", "FASHION"),
        # Beige (.32 - Gold Matt/Beige)
        ("7.32", "Medium Blonde Beige", "Beige", 7, "32", "BEIGE", "GOLD", "STANDARD", "FASHION"),
        ("8.32", "Light Blonde Beige", "Beige", 8, "32", "BEIGE", "GOLD", "STANDARD", "FASHION"),
        ("9.32", "Very Light Blonde Beige", "Beige", 9, "32", "BEIGE", "GOLD", "STANDARD", "FASHION"),
        ("10.32", "Lightest Blonde Beige", "Beige", 10, "32", "BEIGE", "GOLD", "STANDARD", "FASHION"),
        # Copper (.4)
        ("5.4", "Light Copper Brown", "Copper", 5, "4", "COPPER", None, "STANDARD", "FASHION"),
        ("6.4", "Dark Copper Blonde", "Copper", 6, "4", "COPPER", None, "STANDARD", "FASHION"),
        ("7.4", "Medium Copper Blonde", "Copper", 7, "4", "COPPER", None, "STANDARD", "FASHION"),
        ("8.4", "Light Copper Blonde", "Copper", 8, "4", "COPPER", None, "STANDARD", "FASHION"),
        # Copper Ash (.41)
        ("4.41", "Brown Copper Ash", "Copper Ash", 4, "41", "COPPER", "ASH", "STANDARD", "FASHION"),
        ("5.41", "Light Brown Copper Ash", "Copper Ash", 5, "41", "COPPER", "ASH", "STANDARD", "FASHION"),
        ("6.41", "Dark Blonde Copper Ash", "Copper Ash", 6, "41", "COPPER", "ASH", "STANDARD", "FASHION"),
        # Mahogany (.5)
        ("4.5", "Brown Mahogany", "Mahogany", 4, "5", "MAHOGANY", None, "STANDARD", "FASHION"),
        ("5.5", "Light Brown Mahogany", "Mahogany", 5, "5", "MAHOGANY", None, "STANDARD", "FASHION"),
        ("6.5", "Dark Blonde Mahogany", "Mahogany", 6, "5", "MAHOGANY", None, "STANDARD", "FASHION"),
        ("7.5", "Medium Blonde Mahogany", "Mahogany", 7, "5", "MAHOGANY", None, "STANDARD", "FASHION"),
        # Mahogany Ash (.51)
        ("4.51", "Brown Mahogany Ash", "Mahogany Ash", 4, "51", "MAHOGANY", "ASH", "STANDARD", "FASHION"),
        ("5.51", "Light Brown Mahogany Ash", "Mahogany Ash", 5, "51", "MAHOGANY", "ASH", "STANDARD", "FASHION"),
        ("6.51", "Dark Blonde Mahogany Ash", "Mahogany Ash", 6, "51", "MAHOGANY", "ASH", "STANDARD", "FASHION"),
        # Gold Mahogany (.35)
        ("4.35", "Brown Gold Mahogany", "Gold Mahogany", 4, "35", "GOLD", "MAHOGANY", "STANDARD", "FASHION"),
        ("5.35", "Light Brown Gold Mahogany", "Gold Mahogany", 5, "35", "GOLD", "MAHOGANY", "STANDARD", "FASHION"),
        ("6.35", "Dark Blonde Gold Mahogany", "Gold Mahogany", 6, "35", "GOLD", "MAHOGANY", "STANDARD", "FASHION"),
        # Red (.6)
        ("4.6", "Brown Red", "Red", 4, "6", "RED", None, "STANDARD", "FASHION"),
        ("5.6", "Light Brown Red", "Red", 5, "6", "RED", None, "STANDARD", "FASHION"),
        ("6.6", "Dark Blonde Red", "Red", 6, "6", "RED", None, "STANDARD", "FASHION"),
        ("7.6", "Medium Blonde Red", "Red", 7, "6", "RED", None, "STANDARD", "FASHION"),
        ("7.666", "Medium Blonde Intense Red", "Red", 7, "666", "RED", None, "EXTRA_INTENSE", "FASHION"),
        # Brown / Chocolate (.70)
        ("5.70", "Light Brown Chocolate", "Brown", 5, "70", "BEIGE", "MAHOGANY", "STANDARD", "FASHION"),
        ("6.70", "Dark Blonde Chocolate", "Brown", 6, "70", "BEIGE", "MAHOGANY", "STANDARD", "FASHION"),
        ("7.70", "Medium Blonde Chocolate", "Brown", 7, "70", "BEIGE", "MAHOGANY", "STANDARD", "FASHION"),
        # Ash Brown (.71)
        ("4.71", "Brown Ash Brown", "Ash Brown", 4, "71", "BEIGE", "ASH", "STANDARD", "FASHION"),
        ("5.71", "Light Brown Ash Brown", "Ash Brown", 5, "71", "BEIGE", "ASH", "STANDARD", "FASHION"),
        ("6.71", "Dark Blonde Ash Brown", "Ash Brown", 6, "71", "BEIGE", "ASH", "STANDARD", "FASHION"),
        ("7.71", "Medium Blonde Ash Brown", "Ash Brown", 7, "71", "BEIGE", "ASH", "STANDARD", "FASHION"),
        # Cool Brown (.72)
        ("5.72", "Light Cool Brown", "Cool Brown", 5, "72", "BEIGE", "GREEN", "STANDARD", "FASHION"),
        ("6.72", "Dark Blonde Cool Brown", "Cool Brown", 6, "72", "BEIGE", "GREEN", "STANDARD", "FASHION"),
        ("7.72", "Medium Blonde Cool Brown", "Cool Brown", 7, "72", "BEIGE", "GREEN", "STANDARD", "FASHION"),
        ("8.72", "Light Blonde Cool Brown", "Cool Brown", 8, "72", "BEIGE", "GREEN", "STANDARD", "FASHION"),
        # Hazelnut (.73)
        ("5.73", "Light Hazelnut Brown", "Hazelnut", 5, "73", "BEIGE", "GOLD", "STANDARD", "FASHION"),
        ("6.73", "Dark Blonde Hazelnut", "Hazelnut", 6, "73", "BEIGE", "GOLD", "STANDARD", "FASHION"),
        ("7.73", "Medium Blonde Hazelnut", "Hazelnut", 7, "73", "BEIGE", "GOLD", "STANDARD", "FASHION"),
        ("8.73", "Light Blonde Hazelnut", "Hazelnut", 8, "73", "BEIGE", "GOLD", "STANDARD", "FASHION"),
        # Intense Brown (.77)
        ("4.77", "Brown Intense Brown", "Intense Brown", 4, "77", "BEIGE", "MAHOGANY", "INTENSE", "FASHION"),
        ("5.77", "Light Brown Intense Brown", "Intense Brown", 5, "77", "BEIGE", "MAHOGANY", "INTENSE", "FASHION"),
        ("6.77", "Dark Blonde Intense Brown", "Intense Brown", 6, "77", "BEIGE", "MAHOGANY", "INTENSE", "FASHION"),
        ("7.77", "Medium Blonde Intense Brown", "Intense Brown", 7, "77", "BEIGE", "MAHOGANY", "INTENSE", "FASHION"),
        # Violet (.9 & .99)
        ("5.99", "Light Brown Intense Violet", "Violet", 5, "99", "VIOLET", None, "EXTRA_INTENSE", "FASHION"),
        ("6.99", "Dark Blonde Intense Violet", "Violet", 6, "99", "VIOLET", None, "EXTRA_INTENSE", "FASHION"),
        ("7.99", "Medium Blonde Intense Violet", "Violet", 7, "99", "VIOLET", None, "EXTRA_INTENSE", "FASHION"),
        ("9.99", "Very Light Blonde Intense Violet", "Violet", 9, "99", "VIOLET", None, "EXTRA_INTENSE", "FASHION"),
        ("6.9", "Dark Blonde Violet", "Violet", 6, "9", "VIOLET", None, "STANDARD", "FASHION"),
        # Violet Ash (.19, .91, .991)
        ("7.19", "Medium Blonde Violet Ash", "Violet Ash", 7, "19", "VIOLET", "ASH", "STANDARD", "FASHION"),
        ("10.19", "Lightest Blonde Violet Ash", "Violet Ash", 10, "19", "VIOLET", "ASH", "STANDARD", "FASHION"),
        ("7.991", "Medium Blonde Intense Violet Ash", "Violet Ash", 7, "991", "VIOLET", "ASH", "INTENSE", "FASHION"),
        ("8.91", "Light Blonde Violet Ash", "Violet Ash", 8, "91", "VIOLET", "ASH", "STANDARD", "FASHION"),
        # Superlift Series (Level 10 UHCR equivalent)
        ("11.0", "Superlift Natural Blonde", "Superlift", 10, "0", "NATURAL", None, "STANDARD", "HIGH_LIFT"),
        ("11.1", "Superlift Ash Blonde", "Superlift", 10, "1", "ASH", None, "STANDARD", "HIGH_LIFT"),
        ("11.2", "Superlift Beige Blonde", "Superlift", 10, "2", "BEIGE", None, "STANDARD", "HIGH_LIFT"),
        ("12.00", "Superlift Natural Extra Blonde", "Superlift", 10, "00", "NATURAL", None, "STANDARD", "HIGH_LIFT"),
        ("12.1", "Superlift Ash Extra Blonde", "Superlift", 10, "1", "ASH", None, "STANDARD", "HIGH_LIFT"),
        ("12.2", "Superlift Beige Extra Blonde", "Superlift", 10, "2", "BEIGE", None, "STANDARD", "HIGH_LIFT"),
        ("12.7", "Superlift Brown Extra Blonde", "Superlift", 10, "7", "BEIGE", None, "STANDARD", "HIGH_LIFT"),
        ("12.8", "Superlift Pearl Extra Blonde", "Superlift", 10, "8", "PEARL", None, "STANDARD", "HIGH_LIFT"),
        ("12.19", "Superlift Ash Violet Blonde", "Superlift", 10, "19", "ASH", "VIOLET", "STANDARD", "HIGH_LIFT"),
        ("12.91", "Superlift Violet Ash Blonde", "Superlift", 10, "91", "VIOLET", "ASH", "STANDARD", "HIGH_LIFT"),
        ("12.111", "Superlift Extreme Ash Blonde", "Superlift", 10, "111", "ASH", None, "EXTRA_INTENSE", "HIGH_LIFT"),
        ("13.00", "Superlift Ultra Platinum", "Superlift", 10, "00", "NATURAL", None, "STANDARD", "HIGH_LIFT"),
        # Rainbow Series
        ("Sakura Pink", "Rainbow Sakura Pink", "Rainbow", 10, "PINK", "PINK", None, "INTENSE", "FASHION"),
        ("Sand", "Rainbow Sand", "Rainbow", 9, "SAND", "BEIGE", "GOLD", "STANDARD", "FASHION"),
        ("Lilac", "Rainbow Lilac", "Rainbow", 10, "LILAC", "VIOLET", "PINK", "STANDARD", "FASHION"),
        ("Sky Blue", "Rainbow Sky Blue", "Rainbow", 9, "BLUE", "BLUE", None, "INTENSE", "FASHION"),
        ("Lake Blue Green", "Rainbow Lake Blue Green", "Rainbow", 8, "GREEN", "GREEN", "BLUE", "INTENSE", "FASHION"),
        ("Fuschia", "Rainbow Fuschia", "Rainbow", 7, "FUSCHIA", "PINK", "VIOLET", "EXTRA_INTENSE", "FASHION"),
        # Correctors
        ("BLUE", "Blue Corrector", "Correctors", 1, "BLUE", "BLUE", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("GREEN", "Green Corrector", "Correctors", 1, "GREEN", "GREEN", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("VIOLET", "Violet Corrector", "Correctors", 1, "VIOLET", "VIOLET", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("RED", "Red Corrector", "Correctors", 1, "RED", "RED", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("SILVER", "Silver Corrector", "Correctors", 10, "SILVER", "ASH", "PEARL", "STANDARD", "CORRECTOR"),
        ("YELLOW", "Yellow Corrector", "Correctors", 1, "YELLOW", "YELLOW", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("ORANGE", "Orange Corrector", "Correctors", 1, "ORANGE", "ORANGE", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("0.00", "Clear / Lightening Booster", "Correctors", 10, "00", "NATURAL", None, "STANDARD", "SPECIAL_MIX"),
    ]

    p_shades_out = []
    for code, name, family, depth, tone, p_tone, s_tone, intensity, col_fam in proads_raw:
        p_shades_out.append({
            "shade_code": code,
            "shade_name": f"Proads Absolute Premium {code} {name}",
            "manufacturer_family": family,
            "manufacturer_depth": str(depth),
            "manufacturer_tone_code": tone,
            "original_description": f"PROADS Professional Absolute Premium Biotin Hair Color {code} {name}",
            "market": "IN",
            "active_status": True,
            "source_doc_key": "proads_color_chart_manual",
            "verification_status": "VERIFIED",
            "uhcr_mapping": {
                "uhcr_level": depth,
                "primary_tone": p_tone,
                "secondary_tone": s_tone,
                "tone_intensity": intensity,
                "colour_family": col_fam,
                "mapping_method": "MANUFACTURER_DOCUMENT",
                "mapping_confidence": 1.0,
                "verification_status": "VERIFIED",
            },
        })

    with open(p_dir / "absolute_premium_shades.json", "w", encoding="utf-8") as f:
        json.dump(p_shades_out, f, indent=2)

    print(f"Created Proads Professional with {len(p_shades_out)} shades.")


def build_wella_illumina():
    w_dir = DATA_DIR / "wella_illumina"
    w_dir.mkdir(parents=True, exist_ok=True)

    profile = {
        "manufacturer": {
            "name": "Wella Professionals",
            "slug": "wella-india",
            "country_of_origin": "Germany",
            "supported_markets": {"IN": True},
            "website": "https://www.wella.com",
            "status": "ACTIVE",
        },
        "catalogue_version": {
            "market": "IN",
            "version": "1.0",
            "status": "PUBLISHED",
        },
        "product_line": {
            "name": "Illumina Color",
            "service_type": "PERMANENT_COLOUR",
        },
        "product": {
            "name": "Illumina Color Permanent Creme Hair Color",
            "code": "WELLA-ILLUMINA-MAIN",
        },
        "source_documents": [
            {
                "key": "illumina_color_shade_guide",
                "title": "Wella Professionals Illumina Color Technical Shade Card & Salon Guide",
                "publisher": "Wella Professionals",
                "document_type": "TECHNICAL_MANUAL",
                "market": "IN",
                "language": "en",
                "document_version": "1.0",
                "permission_status": "GRANTED",
                "verification_status": "VERIFIED",
            }
        ],
    }

    with open(w_dir / "wella_illumina_profile.json", "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)

    developers = [
        {
            "product_name": "Welloxon Perfect Pastel 1.9% (6 Vol)",
            "concentration_percent": 1.9,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["glossing", "pastel_toning", "grey_blending", "illumina_glossing"],
                "volume_equivalent": 6,
            },
            "source_doc_key": "illumina_color_shade_guide",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Welloxon Perfect 4% (13 Vol)",
            "concentration_percent": 4.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["same_depth_or_darker", "tone_on_tone", "gentle_deposit"],
                "volume_equivalent": 13,
            },
            "source_doc_key": "illumina_color_shade_guide",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Welloxon Perfect 6% (20 Vol)",
            "concentration_percent": 6.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["1_level_lift", "grey_coverage", "same_depth"],
                "volume_equivalent": 20,
            },
            "source_doc_key": "illumina_color_shade_guide",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Welloxon Perfect 9% (30 Vol)",
            "concentration_percent": 9.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["2_levels_lift"],
                "volume_equivalent": 30,
            },
            "source_doc_key": "illumina_color_shade_guide",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Welloxon Perfect 12% (40 Vol)",
            "concentration_percent": 12.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["3_levels_lift"],
                "volume_equivalent": 40,
            },
            "source_doc_key": "illumina_color_shade_guide",
            "verification_status": "VERIFIED",
        },
    ]

    with open(w_dir / "developers.json", "w", encoding="utf-8") as f:
        json.dump(developers, f, indent=2)

    product_rules = [
        {
            "rule_code": "WELLA-ILLUMINA-MIX",
            "product_family": "Illumina Color",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "MIXING_RATIO",
            "market": "IN",
            "priority": 1,
            "conditions": {
                "product_line": "Illumina Color",
                "service_type": "PERMANENT_COLOUR",
            },
            "actions": {
                "mixing_ratio": {
                    "colour_parts": 1.0,
                    "developer_parts": 1.0,
                },
                "glossing_ratio": {
                    "colour_parts": 1.0,
                    "developer_parts": 1.0,
                    "treatment_parts": 1.0,
                },
                "example": "60g Illumina Color + 60g Welloxon Perfect",
            },
            "source_section": "Illumina Color Mixing Guidelines",
            "source_doc_key": "illumina_color_shade_guide",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
        {
            "rule_code": "WELLA-ILLUMINA-TIME",
            "product_family": "Illumina Color",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "PROCESSING_TIME",
            "market": "IN",
            "priority": 2,
            "conditions": {
                "product_line": "Illumina Color",
            },
            "actions": {
                "standard_time_minutes": 35,
                "time_range": "30–40 min without heat, 15–25 min with Climazon",
                "glossing_time_minutes": 10,
                "heat_permitted": True,
            },
            "source_section": "Illumina Color Development Times",
            "source_doc_key": "illumina_color_shade_guide",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
    ]

    with open(w_dir / "product_rules.json", "w", encoding="utf-8") as f:
        json.dump(product_rules, f, indent=2)

    illumina_raw = [
        # Cool Palette
        ("10/1", "Lightest Ash Blonde", "Cool", 10, "1", "ASH", None, "STANDARD", "FASHION"),
        ("10/05", "Lightest Natural Mahogany Blonde", "Cool", 10, "05", "MAHOGANY", "NATURAL", "SOFT", "FASHION"),
        ("10/53", "Lightest Mahogany Gold Blonde", "Cool", 10, "53", "MAHOGANY", "GOLD", "STANDARD", "FASHION"),
        ("10/69", "Lightest Violet Cendré Blonde", "Cool", 10, "69", "VIOLET", "ASH", "STANDARD", "FASHION"),
        ("10/81", "Lightest Pearl Ash Blonde", "Cool", 10, "81", "PEARL", "ASH", "STANDARD", "FASHION"),
        ("10/93", "Lightest Cendré Gold Blonde", "Cool", 10, "93", "ASH", "GOLD", "STANDARD", "FASHION"),
        ("9/19", "Very Light Ash Cendré Blonde", "Cool", 9, "19", "ASH", "VIOLET", "STANDARD", "FASHION"),
        ("9/59", "Very Light Mahogany Cendré Blonde", "Cool", 9, "59", "MAHOGANY", "ASH", "STANDARD", "FASHION"),
        ("9/60", "Very Light Violet Natural Blonde", "Cool", 9, "60", "VIOLET", "NATURAL", "STANDARD", "FASHION"),
        ("8/05", "Light Natural Mahogany Blonde", "Cool", 8, "05", "MAHOGANY", "NATURAL", "SOFT", "FASHION"),
        ("8/1", "Light Ash Blonde", "Cool", 8, "1", "ASH", None, "STANDARD", "FASHION"),
        ("8/13", "Light Ash Gold Blonde", "Cool", 8, "13", "ASH", "GOLD", "STANDARD", "FASHION"),
        ("8/69", "Light Violet Cendré Blonde", "Cool", 8, "69", "VIOLET", "ASH", "STANDARD", "FASHION"),
        ("8/93", "Light Cendré Gold Blonde", "Cool", 8, "93", "ASH", "GOLD", "STANDARD", "FASHION"),
        ("7/53", "Medium Blonde Mahogany Gold", "Cool", 7, "53", "MAHOGANY", "GOLD", "STANDARD", "FASHION"),
        ("7/81", "Medium Blonde Pearl Ash", "Cool", 7, "81", "PEARL", "ASH", "STANDARD", "FASHION"),
        ("6/16", "Dark Blonde Ash Violet", "Cool", 6, "16", "ASH", "VIOLET", "STANDARD", "FASHION"),
        ("6/19", "Dark Blonde Ash Cendré", "Cool", 6, "19", "ASH", "VIOLET", "STANDARD", "FASHION"),
        ("5/02", "Light Brown Natural Matte", "Cool", 5, "02", "GREEN", "NATURAL", "SOFT", "FASHION"),
        ("5/81", "Light Brown Pearl Ash", "Cool", 5, "81", "PEARL", "ASH", "STANDARD", "FASHION"),
        # Warm Palette
        ("10/34", "Lightest Blonde Gold Red", "Warm", 10, "34", "GOLD", "RED", "STANDARD", "FASHION"),
        ("10/36", "Lightest Blonde Gold Violet", "Warm", 10, "36", "GOLD", "VIOLET", "STANDARD", "FASHION"),
        ("10/38", "Lightest Blonde Gold Pearl", "Warm", 10, "38", "GOLD", "PEARL", "STANDARD", "FASHION"),
        ("9/37", "Very Light Blonde Gold Brown", "Warm", 9, "37", "GOLD", "BEIGE", "STANDARD", "FASHION"),
        ("9/43", "Very Light Blonde Red Gold", "Warm", 9, "43", "RED", "GOLD", "STANDARD", "FASHION"),
        ("9/7", "Very Light Blonde Brown", "Warm", 9, "7", "BEIGE", None, "STANDARD", "FASHION"),
        ("8/36", "Light Blonde Gold Violet", "Warm", 8, "36", "GOLD", "VIOLET", "STANDARD", "FASHION"),
        ("8/37", "Light Blonde Gold Brown", "Warm", 8, "37", "GOLD", "BEIGE", "STANDARD", "FASHION"),
        ("8/38", "Light Blonde Gold Pearl", "Warm", 8, "38", "GOLD", "PEARL", "STANDARD", "FASHION"),
        ("7/3", "Medium Blonde Gold", "Warm", 7, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("7/31", "Medium Blonde Gold Ash", "Warm", 7, "31", "GOLD", "ASH", "STANDARD", "FASHION"),
        ("7/35", "Medium Blonde Gold Mahogany", "Warm", 7, "35", "GOLD", "MAHOGANY", "STANDARD", "FASHION"),
        ("7/42", "Medium Blonde Red Matte", "Warm", 7, "42", "RED", "GREEN", "STANDARD", "FASHION"),
        ("7/43", "Medium Blonde Red Gold", "Warm", 7, "43", "RED", "GOLD", "STANDARD", "FASHION"),
        ("7/7", "Medium Blonde Brown", "Warm", 7, "7", "BEIGE", None, "STANDARD", "FASHION"),
        ("7/75", "Medium Blonde Brown Mahogany", "Warm", 7, "75", "BEIGE", "MAHOGANY", "STANDARD", "FASHION"),
        ("6/37", "Dark Blonde Gold Brown", "Warm", 6, "37", "GOLD", "BEIGE", "STANDARD", "FASHION"),
        ("6/76", "Dark Blonde Brown Violet", "Warm", 6, "76", "BEIGE", "VIOLET", "STANDARD", "FASHION"),
        ("5/35", "Light Brown Gold Mahogany", "Warm", 5, "35", "GOLD", "MAHOGANY", "STANDARD", "FASHION"),
        ("5/43", "Light Brown Red Gold", "Warm", 5, "43", "RED", "GOLD", "STANDARD", "FASHION"),
        ("5/7", "Light Brown Brunette", "Warm", 5, "7", "BEIGE", None, "STANDARD", "FASHION"),
        # Neutral Palette
        ("10/", "Lightest Blonde Pure Natural", "Neutral", 10, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("9/", "Very Light Blonde Pure Natural", "Neutral", 9, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("8/", "Light Blonde Pure Natural", "Neutral", 8, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("7/", "Medium Blonde Pure Natural", "Neutral", 7, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("6/", "Dark Blonde Pure Natural", "Neutral", 6, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("5/", "Light Brown Pure Natural", "Neutral", 5, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("4/", "Medium Brown Pure Natural", "Neutral", 4, "0", "NATURAL", None, "STANDARD", "NATURAL"),
    ]

    illumina_out = []
    for code, name, family, depth, tone, p_tone, s_tone, intensity, col_fam in illumina_raw:
        illumina_out.append({
            "shade_code": code,
            "shade_name": f"Illumina Color {code} {name}",
            "manufacturer_family": family,
            "manufacturer_depth": str(depth),
            "manufacturer_tone_code": tone,
            "original_description": f"Wella Professionals Illumina Color {code} {name}",
            "market": "IN",
            "active_status": True,
            "source_doc_key": "illumina_color_shade_guide",
            "verification_status": "VERIFIED",
            "uhcr_mapping": {
                "uhcr_level": depth,
                "primary_tone": p_tone,
                "secondary_tone": s_tone,
                "tone_intensity": intensity,
                "colour_family": col_fam,
                "mapping_method": "MANUFACTURER_DOCUMENT",
                "mapping_confidence": 1.0,
                "verification_status": "VERIFIED",
            },
        })

    with open(w_dir / "illumina_shades.json", "w", encoding="utf-8") as f:
        json.dump(illumina_out, f, indent=2)

    print(f"Created Wella Illumina Color directory with {len(illumina_out)} shades.")


def build_wella_pure_perfection():
    w_dir = DATA_DIR / "wella_pure_perfection"
    w_dir.mkdir(parents=True, exist_ok=True)

    profile = {
        "manufacturer": {
            "name": "Wella Professionals",
            "slug": "wella-india",
            "country_of_origin": "Germany",
            "supported_markets": {"IN": True},
            "website": "https://www.wella.com",
            "status": "ACTIVE",
        },
        "catalogue_version": {
            "market": "IN",
            "version": "1.0",
            "status": "PUBLISHED",
        },
        "product_line": {
            "name": "Pure Perfection",
            "service_type": "PERMANENT_COLOUR",
        },
        "product": {
            "name": "Pure Perfection Ammonia-Free Permanent Cream Hair Color",
            "code": "WELLA-PURE-PERFECTION-MAIN",
        },
        "source_documents": [
            {
                "key": "pure_perfection_technical_folder",
                "title": "Wella Professionals Pure Perfection Ammonia-Free Permanent Cream Color Technical Folder",
                "publisher": "Wella Professionals",
                "document_type": "TECHNICAL_MANUAL",
                "market": "IN",
                "language": "en",
                "document_version": "1.0",
                "permission_status": "GRANTED",
                "verification_status": "VERIFIED",
            }
        ],
    }

    with open(w_dir / "wella_pure_perfection_profile.json", "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)

    developers = [
        {
            "product_name": "Welloxon Perfect Pastel 1.9% (6 Vol)",
            "concentration_percent": 1.9,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["refreshing_mid_ends", "toning"],
                "volume_equivalent": 6,
            },
            "source_doc_key": "pure_perfection_technical_folder",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Welloxon Perfect 4% (13 Vol)",
            "concentration_percent": 4.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["same_depth_or_darker"],
                "volume_equivalent": 13,
            },
            "source_doc_key": "pure_perfection_technical_folder",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Welloxon Perfect 6% (20 Vol)",
            "concentration_percent": 6.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["1_level_lift", "gray_coverage"],
                "volume_equivalent": 20,
            },
            "source_doc_key": "pure_perfection_technical_folder",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Welloxon Perfect 9% (30 Vol)",
            "concentration_percent": 9.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["2_levels_lift"],
                "volume_equivalent": 30,
            },
            "source_doc_key": "pure_perfection_technical_folder",
            "verification_status": "VERIFIED",
        },
        {
            "product_name": "Welloxon Perfect 12% (40 Vol)",
            "concentration_percent": 12.0,
            "concentration_type": "PERCENTAGE",
            "market": "IN",
            "intended_use": {
                "services": ["3_levels_lift"],
                "volume_equivalent": 40,
            },
            "source_doc_key": "pure_perfection_technical_folder",
            "verification_status": "VERIFIED",
        },
    ]

    with open(w_dir / "developers.json", "w", encoding="utf-8") as f:
        json.dump(developers, f, indent=2)

    product_rules = [
        {
            "rule_code": "WELLA-PURE-PERFECTION-MIX",
            "product_family": "Pure Perfection",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "MIXING_RATIO",
            "market": "IN",
            "priority": 1,
            "conditions": {
                "product_line": "Pure Perfection",
                "service_type": "PERMANENT_COLOUR",
            },
            "actions": {
                "mixing_ratio": {
                    "colour_parts": 1.0,
                    "developer_parts": 1.0,
                },
                "example": "60g Pure Perfection + 60g Welloxon Perfect",
            },
            "source_section": "Pure Perfection Mixing & Usage Guidelines",
            "source_doc_key": "pure_perfection_technical_folder",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
        {
            "rule_code": "WELLA-PURE-PERFECTION-TIME",
            "product_family": "Pure Perfection",
            "service_type": "PERMANENT_COLOUR",
            "rule_type": "PROCESSING_TIME",
            "market": "IN",
            "priority": 2,
            "conditions": {
                "product_line": "Pure Perfection",
            },
            "actions": {
                "standard_time_minutes": 35,
                "time_range": "30–40 min without heat, 15–25 min with heat",
                "grey_coverage_time_minutes": 40,
                "heat_permitted": True,
            },
            "source_section": "Pure Perfection Processing Time",
            "source_doc_key": "pure_perfection_technical_folder",
            "rule_version": "1.0",
            "verification_status": "VERIFIED",
        },
    ]

    with open(w_dir / "product_rules.json", "w", encoding="utf-8") as f:
        json.dump(product_rules, f, indent=2)

    pure_perf_raw = [
        # Natural
        ("2/0", "Black", "Natural", 2, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("3/0", "Dark Brown", "Natural", 3, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("4/0", "Medium Brown", "Natural", 4, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("44/0", "Intense Medium Brown", "Natural", 4, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("5/0", "Light Brown", "Natural", 5, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("55/0", "Intense Light Brown", "Natural", 5, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("6/0", "Dark Blonde", "Natural", 6, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("66/0", "Intense Dark Blonde", "Natural", 6, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("7/0", "Medium Blonde", "Natural", 7, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("77/0", "Intense Medium Blonde", "Natural", 7, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("8/0", "Light Blonde", "Natural", 8, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("88/0", "Intense Light Blonde", "Natural", 8, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("9/0", "Very Light Blonde", "Natural", 9, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("10/0", "Lightest Blonde", "Natural", 10, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        # Cool
        ("5/1", "Light Brown Ash", "Cool", 5, "1", "ASH", None, "STANDARD", "FASHION"),
        ("5/8", "Light Brown Pearl", "Cool", 5, "8", "PEARL", None, "STANDARD", "FASHION"),
        ("7/1", "Medium Blonde Ash", "Cool", 7, "1", "ASH", None, "STANDARD", "FASHION"),
        ("7/6", "Medium Blonde Violet", "Cool", 7, "6", "VIOLET", None, "STANDARD", "FASHION"),
        ("7/8", "Medium Blonde Pearl", "Cool", 7, "8", "PEARL", None, "STANDARD", "FASHION"),
        ("9/6", "Very Light Blonde Violet", "Cool", 9, "6", "VIOLET", None, "STANDARD", "FASHION"),
        ("10/1", "Lightest Blonde Ash", "Cool", 10, "1", "ASH", None, "STANDARD", "FASHION"),
        # Warm
        ("4/7", "Medium Brown Brunette", "Warm", 4, "7", "BEIGE", None, "STANDARD", "FASHION"),
        ("5/3", "Light Brown Gold", "Warm", 5, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("5/40", "Light Brown Intense Copper", "Warm", 5, "40", "COPPER", None, "INTENSE", "FASHION"),
        ("6/4", "Dark Blonde Red", "Warm", 6, "4", "RED", None, "STANDARD", "FASHION"),
        ("6/7", "Dark Blonde Brunette", "Warm", 6, "7", "BEIGE", None, "STANDARD", "FASHION"),
        ("7/3", "Medium Blonde Gold", "Warm", 7, "3", "GOLD", None, "STANDARD", "FASHION"),
        ("7/40", "Medium Blonde Intense Copper", "Warm", 7, "40", "COPPER", None, "INTENSE", "FASHION"),
        ("8/7", "Light Blonde Brunette", "Warm", 8, "7", "BEIGE", None, "STANDARD", "FASHION"),
        ("9/3", "Very Light Blonde Gold", "Warm", 9, "3", "GOLD", None, "STANDARD", "FASHION"),
    ]

    pure_perf_out = []
    for code, name, family, depth, tone, p_tone, s_tone, intensity, col_fam in pure_perf_raw:
        pure_perf_out.append({
            "shade_code": code,
            "shade_name": f"Pure Perfection {code} {name}",
            "manufacturer_family": family,
            "manufacturer_depth": str(depth),
            "manufacturer_tone_code": tone,
            "original_description": f"Wella Professionals Pure Perfection Ammonia-Free Permanent Cream Color {code} {name}",
            "market": "IN",
            "active_status": True,
            "source_doc_key": "pure_perfection_technical_folder",
            "verification_status": "VERIFIED",
            "uhcr_mapping": {
                "uhcr_level": depth,
                "primary_tone": p_tone,
                "secondary_tone": s_tone,
                "tone_intensity": intensity,
                "colour_family": col_fam,
                "mapping_method": "MANUFACTURER_DOCUMENT",
                "mapping_confidence": 1.0,
                "verification_status": "VERIFIED",
            },
        })

    with open(w_dir / "pure_perfection_shades.json", "w", encoding="utf-8") as f:
        json.dump(pure_perf_out, f, indent=2)

    print(f"Created Wella Pure Perfection directory with {len(pure_perf_out)} shades.")


def build_schwarzkopf_expansions():
    sk_dir = DATA_DIR / "schwarzkopf"

    sk_raw = [
        # Naturals
        ("1-0", "Black", "Naturals", 1, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("3-0", "Dark Brown", "Naturals", 3, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("4-0", "Medium Brown", "Naturals", 4, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("5-0", "Light Brown", "Naturals", 5, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("5-00", "Light Brown Natural Extra", "Naturals", 5, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("6-0", "Dark Blonde", "Naturals", 6, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("6-00", "Dark Blonde Natural Extra", "Naturals", 6, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("7-0", "Medium Blonde", "Naturals", 7, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("7-00", "Medium Blonde Natural Extra", "Naturals", 7, "00", "NATURAL", None, "INTENSE", "NATURAL"),
        ("8-0", "Light Blonde", "Naturals", 8, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("9-0", "Extra Light Blonde", "Naturals", 9, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("10-0", "Ultra Blonde", "Naturals", 10, "0", "NATURAL", None, "STANDARD", "NATURAL"),
        ("7-1", "Medium Blonde Cendré", "Naturals", 7, "1", "ASH", None, "STANDARD", "FASHION"),
        ("8-1", "Light Blonde Cendré", "Naturals", 8, "1", "ASH", None, "STANDARD", "FASHION"),
        ("9-1", "Extra Light Blonde Cendré", "Naturals", 9, "1", "ASH", None, "STANDARD", "FASHION"),
        # Cendrés & Cools
        ("6-16", "Dark Blonde Cendré Chocolate", "Cendrés & Cools", 6, "16", "ASH", "MAHOGANY", "STANDARD", "FASHION"),
        ("8-11", "Light Blonde Cendré Extra", "Cendrés & Cools", 8, "11", "ASH", None, "EXTRA_INTENSE", "FASHION"),
        ("8-19", "Light Blonde Cendré Violet", "Cendrés & Cools", 8, "19", "ASH", "VIOLET", "STANDARD", "FASHION"),
        ("8-21", "Light Blonde Ash Cendré", "Cendrés & Cools", 8, "21", "ASH", "ASH", "INTENSE", "FASHION"),
        ("7-13", "Medium Blonde Cendré Matt", "Cools", 7, "13", "ASH", "GREEN", "STANDARD", "FASHION"),
        ("6-23", "Dark Blonde Ash Matt", "Cools", 6, "23", "ASH", "GREEN", "STANDARD", "FASHION"),
        ("6-31", "Dark Blonde Matt Cendré", "Cools", 6, "31", "GREEN", "ASH", "STANDARD", "FASHION"),
        # Beiges & Golds
        ("5-4", "Light Brown Beige", "Beiges & Golds", 5, "4", "BEIGE", None, "STANDARD", "FASHION"),
        ("6-46", "Dark Blonde Beige Chocolate", "Beiges & Golds", 6, "46", "BEIGE", "MAHOGANY", "STANDARD", "FASHION"),
        ("6-5", "Dark Blonde Gold", "Beiges & Golds", 6, "5", "GOLD", None, "STANDARD", "FASHION"),
        ("5-57", "Light Brown Gold Copper", "Beiges & Golds", 5, "57", "GOLD", "COPPER", "STANDARD", "FASHION"),
        ("7-4", "Medium Blonde Beige", "Beiges & Golds", 7, "4", "BEIGE", None, "STANDARD", "FASHION"),
        ("7-5", "Medium Blonde Gold", "Beiges & Golds", 7, "5", "GOLD", None, "STANDARD", "FASHION"),
        ("7-55", "Medium Blonde Gold Extra", "Beiges & Golds", 7, "55", "GOLD", None, "INTENSE", "FASHION"),
        ("7-57", "Medium Blonde Gold Copper", "Beiges & Golds", 7, "57", "GOLD", "COPPER", "STANDARD", "FASHION"),
        ("8-46", "Light Blonde Beige Chocolate", "Beiges & Golds", 8, "46", "BEIGE", "MAHOGANY", "STANDARD", "FASHION"),
        ("9-55", "Extra Light Blonde Gold Extra", "Beiges & Golds", 9, "55", "GOLD", None, "INTENSE", "FASHION"),
        # Chocolates
        ("4-6", "Medium Brown Chocolate", "Chocolates", 4, "6", "MAHOGANY", "BEIGE", "STANDARD", "FASHION"),
        ("5-6", "Light Brown Chocolate", "Chocolates", 5, "6", "MAHOGANY", "BEIGE", "STANDARD", "FASHION"),
        ("5-65", "Light Brown Chocolate Gold", "Chocolates", 5, "65", "MAHOGANY", "GOLD", "STANDARD", "FASHION"),
        ("6-6", "Dark Blonde Chocolate", "Chocolates", 6, "6", "MAHOGANY", "BEIGE", "STANDARD", "FASHION"),
        ("6-63", "Dark Blonde Chocolate Matt", "Chocolates", 6, "63", "MAHOGANY", "GREEN", "STANDARD", "FASHION"),
        ("6-65", "Dark Blonde Chocolate Gold", "Chocolates", 6, "65", "MAHOGANY", "GOLD", "STANDARD", "FASHION"),
        ("6-68", "Dark Blonde Chocolate Red", "Chocolates", 6, "68", "MAHOGANY", "RED", "STANDARD", "FASHION"),
        ("7-65", "Medium Blonde Chocolate Gold", "Chocolates", 7, "65", "MAHOGANY", "GOLD", "STANDARD", "FASHION"),
        ("8-65", "Light Blonde Chocolate Gold", "Chocolates", 8, "65", "MAHOGANY", "GOLD", "STANDARD", "FASHION"),
        ("9-67", "Extra Light Blonde Chocolate Copper", "Chocolates", 9, "67", "MAHOGANY", "COPPER", "STANDARD", "FASHION"),
        ("4-68", "Medium Brown Chocolate Red", "Chocolates", 4, "68", "MAHOGANY", "RED", "STANDARD", "FASHION"),
        ("3-68", "Dark Brown Chocolate Red", "Chocolates", 3, "68", "MAHOGANY", "RED", "STANDARD", "FASHION"),
        # Reds
        ("5-7", "Light Brown Copper", "Reds", 5, "7", "COPPER", None, "STANDARD", "FASHION"),
        ("7-77", "Medium Blonde Copper Extra", "Reds", 7, "77", "COPPER", "COPPER", "EXTRA_INTENSE", "FASHION"),
        ("8-77", "Light Blonde Copper Extra", "Reds", 8, "77", "COPPER", "COPPER", "EXTRA_INTENSE", "FASHION"),
        ("4-88", "Medium Brown Red Extra", "Reds", 4, "88", "RED", "RED", "EXTRA_INTENSE", "FASHION"),
        ("6-88", "Dark Blonde Red Extra", "Reds", 6, "88", "RED", "RED", "EXTRA_INTENSE", "FASHION"),
        ("4-99", "Medium Brown Violet Extra", "Reds", 4, "99", "VIOLET", "VIOLET", "EXTRA_INTENSE", "FASHION"),
        ("5-99", "Light Brown Violet Extra", "Reds", 5, "99", "VIOLET", "VIOLET", "EXTRA_INTENSE", "FASHION"),
        ("6-99", "Dark Blonde Violet Extra", "Reds", 6, "99", "VIOLET", "VIOLET", "EXTRA_INTENSE", "FASHION"),
        ("9-98", "Extra Light Blonde Violet Red", "Reds", 9, "98", "VIOLET", "RED", "INTENSE", "FASHION"),
        # Absolutes (Anti-Age)
        ("4-60", "Medium Brown Chocolate Natural", "Absolutes", 4, "60", "MAHOGANY", "NATURAL", "STANDARD", "NATURAL"),
        ("5-50", "Light Brown Gold Natural", "Absolutes", 5, "50", "GOLD", "NATURAL", "STANDARD", "NATURAL"),
        ("5-60", "Light Brown Chocolate Natural", "Absolutes", 5, "60", "MAHOGANY", "NATURAL", "STANDARD", "NATURAL"),
        ("5-80", "Light Brown Red Natural", "Absolutes", 5, "80", "RED", "NATURAL", "STANDARD", "NATURAL"),
        ("6-460", "Dark Blonde Beige Chocolate Natural", "Absolutes", 6, "460", "BEIGE", "MAHOGANY", "STANDARD", "NATURAL"),
        ("6-50", "Dark Blonde Gold Natural", "Absolutes", 6, "50", "GOLD", "NATURAL", "STANDARD", "NATURAL"),
        ("6-60", "Dark Blonde Chocolate Natural", "Absolutes", 6, "60", "MAHOGANY", "NATURAL", "STANDARD", "NATURAL"),
        ("6-80", "Dark Blonde Red Natural", "Absolutes", 6, "80", "RED", "NATURAL", "STANDARD", "NATURAL"),
        ("7-450", "Medium Blonde Beige Gold Natural", "Absolutes", 7, "450", "BEIGE", "GOLD", "STANDARD", "NATURAL"),
        ("7-50", "Medium Blonde Gold Natural", "Absolutes", 7, "50", "GOLD", "NATURAL", "STANDARD", "NATURAL"),
        ("7-60", "Medium Blonde Chocolate Natural", "Absolutes", 7, "60", "MAHOGANY", "NATURAL", "STANDARD", "NATURAL"),
        ("8-60", "Light Blonde Chocolate Natural", "Absolutes", 8, "60", "MAHOGANY", "NATURAL", "STANDARD", "NATURAL"),
        ("9-460", "Extra Light Blonde Beige Chocolate Natural", "Absolutes", 9, "460", "BEIGE", "MAHOGANY", "STANDARD", "NATURAL"),
        # Highlifts & Pastels
        ("10-19", "Ultra Blonde Cendré Violet", "Highlifts", 10, "19", "ASH", "VIOLET", "STANDARD", "HIGH_LIFT"),
        ("10-21", "Ultra Blonde Ash Cendré", "Highlifts", 10, "21", "ASH", "ASH", "INTENSE", "HIGH_LIFT"),
        ("12-0", "Special Blonde Natural", "Highlifts", 10, "0", "NATURAL", None, "STANDARD", "HIGH_LIFT"),
        ("12-1", "Special Blonde Cendré", "Highlifts", 10, "1", "ASH", None, "STANDARD", "HIGH_LIFT"),
        ("12-19", "Special Blonde Cendré Violet", "Highlifts", 10, "19", "ASH", "VIOLET", "STANDARD", "HIGH_LIFT"),
        ("12-2", "Special Blonde Ash", "Highlifts", 10, "2", "ASH", None, "STANDARD", "HIGH_LIFT"),
        ("9,5-1", "Pastel Cendré", "Pastels", 10, "1", "ASH", None, "SOFT", "PASTEL"),
        ("9,5-49", "Pastel Beige Violet", "Pastels", 10, "49", "BEIGE", "VIOLET", "SOFT", "PASTEL"),
        # Specialities & Boosters
        ("0-00", "Clear Extractor", "Specialities", 10, "00", "NATURAL", None, "STANDARD", "SPECIAL_MIX"),
        ("0-11", "Anti-Yellow Neutraliser", "Specialities", 1, "11", "ASH", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("0-22", "Anti-Orange Neutraliser", "Specialities", 1, "22", "ASH", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("0-33", "Anti-Red Neutraliser", "Specialities", 1, "33", "GREEN", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("E-1", "Cendré Extract", "Specialities", 1, "E1", "ASH", None, "EXTRA_INTENSE", "CORRECTOR"),
        ("Pastelfier", "Pastel Modifier", "Specialities", 10, "0", "NATURAL", None, "SOFT", "SPECIAL_MIX"),
        ("0-55", "Gold Booster", "Specialities", 1, "55", "GOLD", None, "EXTRA_INTENSE", "SPECIAL_MIX"),
        ("0-77", "Copper Booster", "Specialities", 1, "77", "COPPER", None, "EXTRA_INTENSE", "SPECIAL_MIX"),
        ("0-88", "Red Booster", "Specialities", 1, "88", "RED", None, "EXTRA_INTENSE", "SPECIAL_MIX"),
        ("0-89", "Red Violet Booster", "Specialities", 1, "89", "RED", "VIOLET", "INTENSE", "SPECIAL_MIX"),
        ("0-99", "Violet Booster", "Specialities", 1, "99", "VIOLET", None, "EXTRA_INTENSE", "SPECIAL_MIX"),
        ("L-00", "Fashion Lights Extra Natural", "Fashion Lights", 10, "00", "NATURAL", None, "INTENSE", "HIGH_LIFT"),
        ("L-44", "Fashion Lights Beige", "Fashion Lights", 8, "44", "BEIGE", None, "INTENSE", "FASHION"),
        ("L-77", "Fashion Lights Copper", "Fashion Lights", 7, "77", "COPPER", None, "EXTRA_INTENSE", "FASHION"),
        ("L-88", "Fashion Lights Red", "Fashion Lights", 6, "88", "RED", None, "EXTRA_INTENSE", "FASHION"),
        ("L-89", "Fashion Lights Red Violet", "Fashion Lights", 6, "89", "RED", "VIOLET", "INTENSE", "FASHION"),
    ]

    sk_out = []
    for code, name, family, depth, tone, p_tone, s_tone, intensity, col_fam in sk_raw:
        sk_out.append({
            "shade_code": code,
            "shade_name": f"Igora Royal {code} {name}",
            "manufacturer_family": family,
            "manufacturer_depth": str(depth),
            "manufacturer_tone_code": tone,
            "original_description": f"Schwarzkopf Professional Igora Royal {code} {name}",
            "market": "IN",
            "active_status": True,
            "source_doc_key": "igora_royal_technical_manual",
            "verification_status": "VERIFIED",
            "uhcr_mapping": {
                "uhcr_level": depth,
                "primary_tone": p_tone,
                "secondary_tone": s_tone,
                "tone_intensity": intensity,
                "colour_family": col_fam,
                "mapping_method": "MANUFACTURER_DOCUMENT",
                "mapping_confidence": 1.0,
                "verification_status": "VERIFIED",
            },
        })

    with open(sk_dir / "igora_royal_shades.json", "w", encoding="utf-8") as f:
        json.dump(sk_out, f, indent=2)

    print(f"Updated Schwarzkopf Igora Royal with {len(sk_out)} shades.")


if __name__ == "__main__":
    build_alfaparf()
    build_proads()
    build_wella_illumina()
    build_wella_pure_perfection()
    build_schwarzkopf_expansions()
    print("All brand packages built successfully.")
