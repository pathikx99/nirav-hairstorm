"""
10 Difficult Real-Life Salon Formulation Cases Evaluation Script
Benchmarking Nirav Hairstorm Platform against Professional Colorist Standards
"""

import json
import requests

API_URL = "http://localhost:8000/api/v1/formulations/evaluate"
MFG_WELLA = "e7f4535aa52849eaa8aca5c8ec538991"
MFG_LOREAL = "6d6e25314f0840f29309848e648871b1"
MFG_SCHWARZKOPF = "8aecb983ad8b410490693c1a08554c0b"

CASES = [
    {
        "id": "CASE_1",
        "title": "Dark Box Dye Black (Level 2) Lifted to Warm Honey Caramel (Level 7)",
        "source": "Behind The Chair & Reddit r/hairstylist 'Box Dye Color Correction'",
        "problem": "Client dyed hair with dark supermarket box dye (Level 2) for 2 years. Wants Level 7 Warm Honey Blonde. Virgin Level 4 regrowth at roots (1.5 inches).",
        "hair_science_rule": "Tint does not lift tint. Artificial dark dye molecules must be stripped/lifted with lightener before depositing target tone. Risk of hot roots and banded orange.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "normal",
                    "previous_chemical_services": ["box dye", "permanent_colour"]
                },
                "roots": {"region": "ROOTS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 2, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 2, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 7, "primary_tone": "GOLD", "secondary_tone": "COPPER", "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_2",
        "title": "100% Resistant Coarse Grey Hair with Fashion Tone (Level 7 Golden Blonde)",
        "source": "Modern Salon 'Formulating for 100% Resistant Gray' & Salon Geek",
        "problem": "Mature client with 100% coarse, glass-like resistant grey hair at hairline/crown, wants vibrant Level 7 Golden Blonde instead of flat drab brown.",
        "hair_science_rule": "Unpigmented hair lacks underlying warmth and resistance requires 20V (6%) developer plus minimum 50% natural base (/0 or /00) mixed with fashion shade to prevent translucent neon hot-roots.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "normal",
                    "previous_chemical_services": []
                },
                "roots": {"region": "ROOTS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 100.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 80.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 60.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 7, "primary_tone": "GOLD", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_3",
        "title": "Drastic Darkening / Repigmentation: Bleached Platinum (L10) to Rich Chocolate (L5)",
        "source": "Guy Tang / Wella Education 'Filling and Repigmentation masterclass'",
        "problem": "Bleached blonde Level 10 porous ends wants to go back to natural Level 5 warm chocolate brown.",
        "hair_science_rule": "Dropping >3 levels on bleached hair removes natural underlying red/orange warmth. Applying Level 5 neutral/ash directly causes muddy swamp-green results. Requires multi-stage warm repigmentation filler (Stage 1) followed by target deposit (Stage 2).",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "normal",
                    "previous_chemical_services": ["bleach"]
                },
                "roots": {"region": "ROOTS", "observed_level": 5, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 10, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 5, "primary_tone": "GOLD", "secondary_tone": "NATURAL", "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_4",
        "title": "Chemical Relaxer (Sodium Hydroxide) + On-Scalp High-Lift Bleach Request",
        "source": "Cosmetology State Board Safety Cases & Trichology Clinical Case Study",
        "problem": "Client with chemical relaxer (sodium hydroxide/lye) treated hair requesting full on-scalp bleach to Level 9 platinum blonde.",
        "hair_science_rule": "Absolute hard contraindication. Lye alters cortex protein structure; persulfate lightener causes catastrophic structural breakage (melting/dissolving hair) and chemical scalp necrosis. Must be strictly BLOCKED.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "normal",
                    "has_sodium_hydroxide_relaxer": True,
                    "previous_chemical_services": ["relaxer", "sodium hydroxide"]
                },
                "roots": {"region": "ROOTS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 9, "primary_tone": "ASH", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_5",
        "title": "Henna & Metallic Salts Contamination with Bleach Highlighting Request",
        "source": "Professional Hairdresser Association & BehindTheChair 'Henna Nightmare'",
        "problem": "Client used store-bought compound black/brown henna (containing metallic mineral salts) 3 months ago. Now wants full foil blonde highlights.",
        "hair_science_rule": "Absolute hard contraindication. Metallic salts (copper, lead, silver) react violently with hydrogen peroxide in an exothermic chain reaction, causing smoking, boiling foil, and instant chemical melting of hair. Must be strictly BLOCKED.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "normal",
                    "has_metallic_salts_or_henna": True,
                    "previous_chemical_services": ["henna"]
                },
                "roots": {"region": "ROOTS", "observed_level": 3, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 3, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 3, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 8, "primary_tone": "GOLD", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_6",
        "title": "Tri-Color Multi-Banding: Virgin L3 Roots, Warm Faded L5 Mids, Porous L8 Blonde Ends",
        "source": "Reddit r/hairstylist 'Formulating for uneven banding' & BehindTheChair",
        "problem": "Client has 2 inches of virgin Level 3 regrowth, an orange-tinted artificial band at Level 5, and bleached high-porosity Level 8 ends. Desires uniform Level 6 Cool Ash Brown.",
        "hair_science_rule": "Each zone requires distinct chemical kinetics: roots need lift + ash neutralization (20V), mids need tone balancing, ends need low-volume deposit (demi-permanent 6V/1.9%) to prevent ash grab and darkening.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "normal",
                    "previous_chemical_services": ["permanent_colour", "bleach"]
                },
                "roots": {"region": "ROOTS", "observed_level": 3, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 5, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 6, "primary_tone": "ASH", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_7",
        "title": "Documented PPD / Oxidative Hair Dye Allergy History",
        "source": "UK Trichology Society & European Commission Cosmetics Safety Guidelines",
        "problem": "Client reports previous history of acute scalp dermatitis and facial swelling following permanent hair colour. Asking for grey coverage at Level 5.",
        "hair_science_rule": "Clinical hard contraindication. Any oxidative dye application poses life-threatening anaphylactic and severe contact dermatitis risks. Must be strictly BLOCKED.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": True,
                    "allergy_details": "Severe facial edema and scalp blistering after PPD tint in 2023",
                    "patch_test_completed_48h": False,
                    "scalp_condition": "normal",
                    "previous_chemical_services": []
                },
                "roots": {"region": "ROOTS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 40.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 40.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 40.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 5, "primary_tone": "NATURAL", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_8",
        "title": "Virgin Coarse Indian/Asian Hair (Level 2) Lifted to Cool Mushroom/Ash Blonde (Level 8)",
        "source": "BehindTheChair Asian Balayage & Master Colorist Hair Chemistry Forum",
        "problem": "Client with virgin coarse Indian black hair (Level 2) wants Level 8 cool ash blonde. 6 levels of lift required.",
        "hair_science_rule": "Permanent oxidative color cannot lift 6 levels (max 3-4 levels). High concentration of eumelanin exposes dense red-orange underlying pigment. Requires multi-stage: Stage 1 = On/off scalp bleaching (Blondor 20V max on scalp), Stage 2 = Violet/blue-ash toner to neutralize raw underlying yellow/orange.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "normal",
                    "previous_chemical_services": []
                },
                "roots": {"region": "ROOTS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 8, "primary_tone": "ASH", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_9",
        "title": "Chlorine / Hard Water Mineral Green Discoloration Corrected to Level 8 Honey Gold",
        "source": "Modern Salon 'Fixing Green Swimmer's Hair' & L'Oréal Metal Detox Protocols",
        "problem": "Bleached blonde swimmer with porous Level 9 ends has unwanted dull greenish cast due to oxidized copper/mineral buildup. Desires Level 8 warm honey gold.",
        "hair_science_rule": "Green cast is neutralized by red/copper warmth (complementary color wheel). Mineral buildup also destabilizes peroxide. Requires chelation/detox pre-treatment followed by warm corrective deposit.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "normal",
                    "has_hard_water": True,
                    "water_quality_notes": "Well water and frequent swimming pool exposure",
                    "previous_chemical_services": ["bleach", "hard water"]
                },
                "roots": {"region": "ROOTS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 9, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 8, "primary_tone": "GOLD", "secondary_tone": "COPPER", "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_10",
        "title": "Severely Damaged Snapping Bleached Ends Requiring Gentle Acidic/Demi Deposit",
        "source": "Hairbrained & BehindTheChair 'Dealing with Compromised Porous Hair'",
        "problem": "Client with healthy Level 6 roots, but bleached Level 8 ends that are severely compromised (snapping when wet, high porosity, cuticle degradation). Desires Level 7 Natural Warm Blonde.",
        "hair_science_rule": "High-volume alkaline tint on severely compromised ends will cause irreversible fiber breakage (chemical haircut). Professional protocol requires low-volume deposit (1.9% / 6 Vol or 4% / 13 Vol) with acidic or demi-permanent conditioning technology.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "normal",
                    "previous_chemical_services": ["bleach"]
                },
                "roots": {"region": "ROOTS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 7, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "SEVERELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 7, "primary_tone": "NATURAL", "secondary_tone": "GOLD", "tone_intensity": "STANDARD"}
        }
    }
]

def run_evaluation():
    results = []
    for c in CASES:
        resp = requests.post(API_URL, json=c["payload"])
        if resp.status_code != 200:
            results.append({
                "case_id": c["id"],
                "title": c["title"],
                "status": f"HTTP_ERROR_{resp.status_code}",
                "error": resp.text
            })
            continue

        data = resp.json()
        stages_summary = []
        for s in data.get("stages", []):
            dev = s.get("developer") or {}
            products = [f"{p.get('shade_code')} ({p.get('weight_grams')}g)" for p in s.get("products", [])]
            stages_summary.append({
                "stage_type": s.get("stage_type"),
                "developer_vol": dev.get("volume_in_vol"),
                "developer_pct": dev.get("concentration_percent"),
                "time_mins": s.get("development_time_minutes"),
                "products": products,
                "instructions": s.get("application_instructions")
            })

        safety_blocked = [ck for ck in data.get("safety_checks", []) if ck.get("status") == "BLOCKED"]
        safety_warnings = [ck for ck in data.get("safety_checks", []) if ck.get("status") == "WARNING"]

        results.append({
            "case_id": c["id"],
            "title": c["title"],
            "source": c["source"],
            "problem": c["problem"],
            "hair_science_rule": c["hair_science_rule"],
            "formulation_status": data.get("status"),
            "service_classification": data.get("service_classification"),
            "safety_blocked_count": len(safety_blocked),
            "safety_blocked_details": [b.get("detail") for b in safety_blocked],
            "safety_warnings_count": len(safety_warnings),
            "safety_warnings_titles": [w.get("title") for w in safety_warnings],
            "stages_count": len(data.get("stages", [])),
            "stages": stages_summary,
            "raw": data
        })

    return results

if __name__ == "__main__":
    res = run_evaluation()
    with open("data/10_difficult_cases_results.json", "w") as f:
        json.dump(res, f, indent=2)
    print(f"Successfully evaluated {len(res)} cases. Output saved to data/10_difficult_cases_results.json")
