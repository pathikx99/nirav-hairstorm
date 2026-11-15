"""
10 Additional Difficult Real-Life Salon Formulation Cases Evaluation Script (Cases 11–20)
Benchmarking Nirav Hairstorm Platform against Professional Colorist Standards
"""

import json
import requests

API_URL = "http://localhost:8000/api/v1/formulations/evaluate"
MFG_WELLA = "e7f4535aa52849eaa8aca5c8ec538991"

CASES_11_TO_20 = [
    {
        "id": "CASE_11",
        "title": "Compromised Scalp Barrier / Abraded Scalp with High-Lift Bleach Request",
        "source": "Dermatology & Cosmetology Trichological Scalp Safety Guidelines",
        "problem": "Client has open abrasions / inflamed scalp lesions requesting full-head bleach to Level 9 platinum.",
        "hair_science_rule": "Direct contact with alkaline persulfate lightener or high-volume developer on abraded scalp causes severe chemical burns, acute dermatitis, and rapid systemic dye intoxication. Service must be strictly BLOCKED until full epithelial healing.",
        "payload": {
            "mode": "PREFERRED_MANUFACTURER",
            "manufacturer_id": MFG_WELLA,
            "market": "IN",
            "assessment": {
                "market": "IN",
                "history": {
                    "has_allergy_history": False,
                    "patch_test_completed_48h": True,
                    "scalp_condition": "abraded",
                    "previous_chemical_services": []
                },
                "roots": {"region": "ROOTS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 9, "primary_tone": "ASH", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_12",
        "title": "Virgin Level 6 Lifted 4 Levels to Level 10 Platinum Blonde with Special Blonde Series",
        "source": "Wella Professionals Koleston Perfect Special Blonde (12/xx) Master Guide",
        "problem": "Client has virgin Level 6 medium blonde/light brown hair and desires Level 10 clean pale blonde without bleach powder.",
        "hair_science_rule": "Special Blonde (12/xx series) provides up to 4–5 levels of lift on virgin hair using 12% (40 Vol) developer at a 1:2 mixing ratio, lifting through yellow natural remaining pigment with violet/pearl counter-neutralizer.",
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
                "roots": {"region": "ROOTS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 10, "primary_tone": "ASH", "secondary_tone": "PEARL", "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_13",
        "title": "Hot Roots Prevention: Virgin Level 5 Scalp Regrowth with Colored L6 Mids to Target Level 7 Gold",
        "source": "Salon Geek & Modern Salon 'Eliminating Hot Roots on Regrowth Formulations'",
        "problem": "Client has 1.5 cm of virgin Level 5 regrowth near warm scalp, previously colored Level 6 mids, and faded Level 8 ends. Desires Level 7 Warm Honey Blonde.",
        "hair_science_rule": "Body heat radiating from scalp accelerates oxidative action within the first 1–1.5 cm. Applying high developer on scalp produces a glowing, over-lifted band ('hot roots'). Requires multi-bowl zonal technique: Bowl 1 (Roots) processed with 20V (6%) and Bowl 2 (Mid-lengths) balanced for tone deposit.",
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
                    "previous_chemical_services": ["permanent_colour"]
                },
                "roots": {"region": "ROOTS", "observed_level": 5, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 6, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 7, "primary_tone": "GOLD", "secondary_tone": "NATURAL", "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_14",
        "title": "Synthetic Direct Dye / Vivid Stain Contamination to Natural Warm Honey Blonde (Level 8)",
        "source": "Pulp Riot & Manic Panic Professional Color Removal Protocol",
        "problem": "Porous bleached hair stained with non-oxidative direct fashion dye (vivid turquoise/blue-green). Desires return to Level 8 natural warm gold.",
        "hair_science_rule": "Direct dyes are large cationic molecules deposited on the outer cuticle/cortex. Applying persulfate bleach drives semi-permanent pigment deeper into keratin, causing permanent greenish staining. Protocol requires non-ammonia clarifying/chelating de-colorization prep before oxidative toning.",
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
                    "previous_chemical_services": ["direct_dye", "bleach"]
                },
                "roots": {"region": "ROOTS", "observed_level": 7, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 8, "primary_tone": "GOLD", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_15",
        "title": "Post-Keratin Treatment (Formaldehyde / Glyoxylic Acid) Hair to Level 6 Vibrant Copper Red",
        "source": "Brazilian Blowout & Keratin Complex Chemical Service Sequencing Manual",
        "problem": "Client received high-heat formaldehyde/glyoxylic smoothing treatment 2 weeks ago; cuticle is sealed and flattened. Desires Level 6 rich copper red.",
        "hair_science_rule": "Cross-linked methylene glycol seals cuticle scales tight, dramatically slowing developer swelling and causing uneven patchy dye penetration. Formulation requires 20 Vol developer with full 35-minute development time for uniform oxidative coupling.",
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
                    "previous_chemical_services": ["keratin"]
                },
                "roots": {"region": "ROOTS", "observed_level": 5, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 5, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 5, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 6, "primary_tone": "COPPER", "secondary_tone": "RED", "tone_intensity": "INTENSE"}
        }
    },
    {
        "id": "CASE_16",
        "title": "Ultra-Fine Fragile Porous Hair Lifted 2 Levels to Level 9 Baby Blonde",
        "source": "Milady Standard Cosmetology 'Formulating for Fine Hair Diameter'",
        "problem": "Extremely fine hair fiber diameter with high porosity, natural Level 7, desires Level 9 soft baby blonde.",
        "hair_science_rule": "Fine hair has significantly smaller cortical surface area and melanin granule count per cross-section. Standard coarse-hair 30 Vol developer causes excessive cuticle erosion and breakage. On fine hair, 20 Vol (6%) developer achieves 2 levels of lift gently without fiber degradation.",
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
                    "hair_texture": "FINE",
                    "previous_chemical_services": []
                },
                "roots": {"region": "ROOTS", "observed_level": 7, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 7, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 7, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 9, "primary_tone": "GOLD", "secondary_tone": "NATURAL", "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_17",
        "title": "Salt-and-Pepper 30% Scattered Grey Hair with Translucent Low-Maintenance Blending",
        "source": "L'Oréal Professionnel Dia Light / Wella Color Touch Demi-Permanent Blending Guide",
        "problem": "Client has 30% scattered grey hair on natural Level 6 base. Wants grey camouflage without a solid, harsh line of regrowth demarcation.",
        "hair_science_rule": "When grey percentage is under 50% and client seeks soft blending, opaque permanent tint produces an unnatural grow-out line. Low-alkaline tone-on-tone formulation provides natural multi-tonal camouflage, blending whites into soft highlights.",
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
                "roots": {"region": "ROOTS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 30.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 20.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 10.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 6, "primary_tone": "NATURAL", "secondary_tone": "GOLD", "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_18",
        "title": "Over-Toned 'Muddy' Greenish-Grey Porous Ends Corrected to Clean Level 9 Champagne Blonde",
        "source": "Behind The Chair 'Correcting Over-Toned Ash Blonde and Removing Muddy Buildup'",
        "problem": "Bleached Level 9 client repeatedly used high-pigment blue/purple shampoo at home, resulting in dingy, muddy khaki-green ends. Desires clean, luminous Level 9 Champagne Beige.",
        "hair_science_rule": "Adding more ash or neutral dye worsens dingy darkness. Porous ends have oversaturated exogenous dye molecules. Formulation requires warm corrective counteracting tonal deposit (warm gold/peach) to neutralize the muddy cast without darkening.",
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
                    "previous_chemical_services": ["bleach", "toner"]
                },
                "roots": {"region": "ROOTS", "observed_level": 9, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 9, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 9, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 9, "primary_tone": "GOLD", "secondary_tone": "NATURAL", "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_19",
        "title": "Extreme 4-Level Darkening Drop: Bleached Platinum (L10) to Level 2 Deepest Espresso",
        "source": "Matrix Socolor & Redken Shades EQ 'Extreme Tint-Back and Filler Sequencing'",
        "problem": "Entire head bleached to Level 10 white platinum. Client demands immediate transformation to Level 2 deepest espresso/soft black.",
        "hair_science_rule": "Dropping 4+ levels on hollow, bleached hair without progressive repigmentation results in an eerie greenish-slate hue and rapid color sloughing. Hair requires two-step underlying pigment reconstruction: repigmentation filler restoring red/copper pheomelanin base, followed by target deep deposit with natural base.",
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
                "roots": {"region": "ROOTS", "observed_level": 10, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 10, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 10, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 2, "primary_tone": "NATURAL", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    },
    {
        "id": "CASE_20",
        "title": "Chemically Permed Hair (Ammonium Thioglycolate) Requesting High-Lift Bleach (Level 4 to Level 9)",
        "source": "Milady Standard 'Chemical Waving & Color Safety Contraindications'",
        "problem": "Client had an ammonium thioglycolate perm 3 months ago. Now wants full-head high-lift bleach from Level 4 dark brown to Level 9 blonde.",
        "hair_science_rule": "Perm chemistry cleaves disulfide cystine bonds to reshape keratin. Applying alkaline persulfate bleach lightener on permed hair destroys remaining cystine bridges, leading to catastrophic fiber dissolution and gelatinous melting. Must be strictly BLOCKED.",
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
                    "previous_chemical_services": ["perm", "thioglycolate"]
                },
                "roots": {"region": "ROOTS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
                "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
                "ends": {"region": "ENDS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
            },
            "target_colour": {"universal_level": 9, "primary_tone": "ASH", "secondary_tone": None, "tone_intensity": "STANDARD"}
        }
    }
]

def run_evaluation():
    results = []
    for c in CASES_11_TO_20:
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
    with open("data/10_more_difficult_cases_results.json", "w") as f:
        json.dump(res, f, indent=2)
    print(f"Successfully evaluated {len(res)} cases. Output saved to data/10_more_difficult_cases_results.json")
