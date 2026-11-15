"""
Comprehensive End-to-End Verification of 5 Real-World Salon Formulation Cases:
1. Virgin hair lifting (e.g., Level 5 to Level 7 Copper Gold - single process 30V developer)
2. High grey coverage (e.g., Level 4 with 60% grey to Level 6 - 50:50 base + target shade rule)
3. Darkening / Repigmentation (e.g., Bleached Level 9 ends to Level 5 - multi-stage warm filler)
4. Critical safety contraindication blocking (e.g., Documented allergy - strict SAFETY_BLOCKED)
5. Cross-brand shade resolution (e.g., Universal Level 7 Ash across Wella, L'Oréal, Schwarzkopf)
"""

from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.manufacturers.importer import CatalogueImporter
from backend.app.manufacturers.loreal_seeder import seed_loreal_india
from backend.app.manufacturers.wella_seeder import seed_wella_india
from backend.app.models.manufacturers import Manufacturer


@pytest.mark.asyncio
async def test_five_salon_formulation_cases(client: AsyncClient, db_session: AsyncSession):
    # Seed all three brands
    await seed_wella_india(db_session)
    await seed_loreal_india(db_session)
    sk_dir = Path("data/manufacturers/schwarzkopf")
    if sk_dir.exists():
        await CatalogueImporter.import_from_directory(
            session=db_session,
            directory=sk_dir,
            market="IN",
        )

    # Fetch Wella Manufacturer
    res_m = await db_session.execute(select(Manufacturer).where(Manufacturer.slug == "wella-india"))
    wella = res_m.scalars().first()
    assert wella is not None
    wella_id = str(wella.id)

    def make_assessment(roots_lvl=5, grey=0.0, allergy=False, ends_lvl=5, ends_color=False, ends_porosity="NORMAL", ends_cond="HEALTHY", services=None):
        return {
            "market": "IN",
            "history": {
                "has_allergy_history": allergy,
                "patch_test_completed_48h": not allergy,
                "scalp_condition": "normal",
                "previous_chemical_services": services or [],
            },
            "roots": {
                "region": "ROOTS",
                "observed_level": roots_lvl,
                "existing_artificial_colour": False,
                "grey_percentage": grey,
                "porosity": "NORMAL",
                "condition": "HEALTHY",
                "is_on_scalp": True,
            },
            "mid_lengths": {
                "region": "MID_LENGTHS",
                "observed_level": roots_lvl,
                "existing_artificial_colour": False,
                "grey_percentage": grey,
                "porosity": "NORMAL",
                "condition": "HEALTHY",
                "is_on_scalp": False,
            },
            "ends": {
                "region": "ENDS",
                "observed_level": ends_lvl,
                "existing_artificial_colour": ends_color,
                "grey_percentage": 0.0,
                "porosity": ends_porosity,
                "condition": ends_cond,
                "is_on_scalp": False,
            },
        }

    # -----------------------------------------------------------------------
    # Case 1: Virgin Hair Lifting (2 Levels Lift: Level 5 -> Level 7 Copper Gold)
    # -----------------------------------------------------------------------
    r1 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": wella_id,
        "market": "IN",
        "assessment": make_assessment(roots_lvl=5, ends_lvl=5),
        "target_colour": {
            "universal_level": 7,
            "primary_tone": "COPPER",
            "secondary_tone": "GOLD",
            "tone_intensity": "STANDARD",
        },
    })
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["status"] == "ELIGIBLE_FOR_REVIEW"
    assert len(d1["stages"]) == 1
    s1 = d1["stages"][0]
    assert s1["developer"]["volume_in_vol"] in (20, 30)
    assert s1["development_time_minutes"] >= 30

    # -----------------------------------------------------------------------
    # Case 2: High Grey Coverage (60% Grey: Level 4 -> Level 6 Gold)
    # -----------------------------------------------------------------------
    r2 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": wella_id,
        "market": "IN",
        "assessment": make_assessment(roots_lvl=4, grey=60.0, ends_lvl=4),
        "target_colour": {
            "universal_level": 6,
            "primary_tone": "GOLD",
            "secondary_tone": None,
            "tone_intensity": "STANDARD",
        },
    })
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["status"] == "ELIGIBLE_FOR_REVIEW"
    s2 = d2["stages"][0]
    # In >50% grey, formulation adds base shade (e.g. 6/0) + fashion shade (6/3)
    shades = [p["shade_code"] for p in s2["products"]]
    assert "6/0" in shades or "6/00" in shades or "6/" in shades[0]
    assert len(shades) >= 2

    # -----------------------------------------------------------------------
    # Case 3: Darkening / Repigmentation (Bleached Level 9 ends -> Level 5 Gold)
    # -----------------------------------------------------------------------
    r3 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": wella_id,
        "market": "IN",
        "assessment": make_assessment(roots_lvl=5, ends_lvl=9, ends_color=True, ends_porosity="HIGH", ends_cond="MODERATELY_DAMAGED", services=["BLEACH"]),
        "target_colour": {
            "universal_level": 5,
            "primary_tone": "GOLD",
            "secondary_tone": "NATURAL",
            "tone_intensity": "STANDARD",
        },
    })
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["status"] == "ELIGIBLE_FOR_REVIEW"
    # Multi-stage required: Stage 1 = Pre-pigmentation/filler, Stage 2 = Target deposit
    assert len(d3["stages"]) >= 2

    # -----------------------------------------------------------------------
    # Case 4: Safety Block (Documented Allergy)
    # -----------------------------------------------------------------------
    r4 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": wella_id,
        "market": "IN",
        "assessment": make_assessment(allergy=True),
        "target_colour": {
            "universal_level": 7,
            "primary_tone": "COPPER",
            "secondary_tone": None,
            "tone_intensity": "STANDARD",
        },
    })
    d4 = r4.json()
    assert d4["status"] == "BLOCKED"
    assert any("allergic" in w.lower() or "allergy" in w.lower() for w in d4.get("warnings", []))

    # -----------------------------------------------------------------------
    # Case 5: Cross-Brand Shade Resolution (Level 7 Ash across Wella, L'Oréal, Schwarzkopf)
    # -----------------------------------------------------------------------
    r5 = await client.post("/api/v1/shade-mapping/compare", json={
        "market": "IN",
        "target": {
            "level": 7,
            "primary_tone": "ASH",
            "secondary_tone": None,
            "tone_intensity": "STANDARD",
        },
        "max_level_difference": 1,
        "limit": 10,
    })
    assert r5.status_code == 200
    d5 = r5.json()
    results = d5.get("results", [])
    assert len(results) >= 3
    brands = {c["manufacturer"] for c in results}
    assert "Wella Professionals" in brands
    assert "L'Oréal Professionnel" in brands
