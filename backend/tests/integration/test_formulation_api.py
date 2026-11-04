"""
Integration tests for Milestone 4: Formulation Engine API.

Verifies end-to-end:
- Feasibility classification (Lifting, Multi-Stage, Darkening)
- Deterministic developer strength calculation based on lift delta
- Grey coverage formulation adjustment (adding Pure Naturals)
- Critical safety contraindication blocking (documented allergy blocks execution)
- Pre-coloured hair multi-stage process (lightening + toning)
- Preferred-manufacturer and Cross-brand comparison modes
- Conformance to Technical Specification §5.12 and §5.13 contracts
"""

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.manufacturers.loreal_seeder import seed_loreal_india
from backend.app.manufacturers.wella_seeder import seed_wella_india
from backend.app.models.manufacturers import Manufacturer


@pytest.mark.asyncio
async def test_formulation_api_virgin_hair_lifting(
    client: AsyncClient,
    db_session: AsyncSession,
):
    # 1. Seed Wella database
    await seed_wella_india(db_session)

    # Fetch Wella Manufacturer ID
    res_mfg = await db_session.execute(
        select(Manufacturer).where(Manufacturer.slug == "wella-india")
    )
    wella = res_mfg.scalars().first()
    assert wella is not None

    # 2. Evaluate request: Virgin level 5 wanting level 7 Copper Gold (7/43) -> 2 levels lift
    payload = {
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": str(wella.id),
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {
                "has_allergy_history": False,
                "patch_test_completed_48h": True,
                "scalp_condition": "normal",
                "previous_chemical_services": [],
            },
            "roots": {
                "region": "ROOTS",
                "observed_level": 5,
                "existing_artificial_colour": False,
                "grey_percentage": 0.0,
                "porosity": "NORMAL",
                "condition": "HEALTHY",
                "is_on_scalp": True,
            },
            "mid_lengths": {
                "region": "MID_LENGTHS",
                "observed_level": 5,
                "existing_artificial_colour": False,
                "grey_percentage": 0.0,
                "porosity": "NORMAL",
                "condition": "HEALTHY",
                "is_on_scalp": False,
            },
            "ends": {
                "region": "ENDS",
                "observed_level": 5,
                "existing_artificial_colour": False,
                "grey_percentage": 0.0,
                "porosity": "NORMAL",
                "condition": "HEALTHY",
                "is_on_scalp": False,
            },
        },
        "target_colour": {
            "universal_level": 7,
            "primary_tone": "RED",
            "secondary_tone": "GOLD",
            "tone_intensity": "STANDARD",
        },
    }

    res = await client.post("/api/v1/formulations/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["engine_version"] == "1.0"
    assert data["status"] in ("ELIGIBLE_FOR_REVIEW", "REQUIRES_PROFESSIONAL_REVIEW")
    assert data["service_classification"] == "LIFTING"
    assert data["chemical_equivalence"] == "NOT_ESTABLISHED"
    assert len(data["stages"]) == 1

    stage1 = data["stages"][0]
    assert stage1["mixing_ratio_text"] == "1:1"
    # 2 levels lift on Wella requires 9% (30 Vol) developer
    assert float(stage1["developer"]["concentration_percent"]) == 9.0
    assert stage1["developer"]["volume_in_vol"] == 30

    # Verify target shade
    prod_codes = [p["shade_code"] for p in stage1["products"]]
    assert "7/43" in prod_codes


@pytest.mark.asyncio
async def test_formulation_api_grey_coverage(
    client: AsyncClient,
    db_session: AsyncSession,
):
    await seed_wella_india(db_session)
    res_mfg = await db_session.execute(
        select(Manufacturer).where(Manufacturer.slug == "wella-india")
    )
    wella = res_mfg.scalars().first()
    assert wella is not None

    # Roots have 50% white hair -> requires Pure Naturals addition
    payload = {
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": str(wella.id),
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {
                "has_allergy_history": False,
                "patch_test_completed_48h": True,
            },
            "roots": {
                "region": "ROOTS",
                "observed_level": 6,
                "existing_artificial_colour": False,
                "grey_percentage": 50.0,  # 50% white hair
                "porosity": "NORMAL",
                "condition": "HEALTHY",
                "is_on_scalp": True,
            },
            "mid_lengths": {
                "region": "MID_LENGTHS",
                "observed_level": 6,
                "existing_artificial_colour": False,
                "grey_percentage": 0.0,
                "porosity": "NORMAL",
                "condition": "HEALTHY",
                "is_on_scalp": False,
            },
            "ends": {
                "region": "ENDS",
                "observed_level": 6,
                "existing_artificial_colour": False,
                "grey_percentage": 0.0,
                "porosity": "NORMAL",
                "condition": "HEALTHY",
                "is_on_scalp": False,
            },
        },
        "target_colour": {
            "universal_level": 7,
            "primary_tone": "RED",
            "secondary_tone": "GOLD",
            "tone_intensity": "STANDARD",
        },
    }

    res = await client.post("/api/v1/formulations/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()

    stage1 = data["stages"][0]
    prod_codes = {p["shade_code"] for p in stage1["products"]}
    # Must include Pure Naturals (7/0) for 50% grey coverage
    assert "7/0" in prod_codes
    assert "7/43" in prod_codes


@pytest.mark.asyncio
async def test_formulation_api_blocked_safety_case(
    client: AsyncClient,
    db_session: AsyncSession,
):
    await seed_wella_india(db_session)
    res_mfg = await db_session.execute(
        select(Manufacturer).where(Manufacturer.slug == "wella-india")
    )
    wella = res_mfg.scalars().first()
    assert wella is not None

    # Client with allergy history -> MUST BLOCK executable formula
    payload = {
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": str(wella.id),
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {
                "has_allergy_history": True,  # ALLERGY
                "allergy_details": "Prior severe swelling with PPD dye",
            },
            "roots": {"region": "ROOTS", "observed_level": 5},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 5},
            "ends": {"region": "ENDS", "observed_level": 5},
        },
        "target_colour": {
            "universal_level": 7,
            "primary_tone": "ASH",
        },
    }

    res = await client.post("/api/v1/formulations/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "BLOCKED"
    assert len(data["stages"]) == 0  # No executable stages permitted!
    assert any(
        c["check_code"] == "SAFETY_ALLERGY_KNOWN_HISTORY" and c["status"] == "BLOCKED"
        for c in data["safety_checks"]
    )


@pytest.mark.asyncio
async def test_formulation_api_precoloured_hair_multi_stage(
    client: AsyncClient,
    db_session: AsyncSession,
):
    await seed_wella_india(db_session)
    res_mfg = await db_session.execute(
        select(Manufacturer).where(Manufacturer.slug == "wella-india")
    )
    wella = res_mfg.scalars().first()
    assert wella is not None

    # Existing artificial colour on hair wanting 2 levels of lift
    # "Color does not lift color" -> Multi-stage process required
    payload = {
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": str(wella.id),
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"patch_test_completed_48h": True},
            "roots": {"region": "ROOTS", "observed_level": 5, "existing_artificial_colour": True},
            "mid_lengths": {
                "region": "MID_LENGTHS",
                "observed_level": 5,
                "existing_artificial_colour": True,
            },
            "ends": {"region": "ENDS", "observed_level": 5, "existing_artificial_colour": True},
        },
        "target_colour": {
            "universal_level": 7,
            "primary_tone": "COPPER",
            "secondary_tone": "GOLD",
        },
    }

    res = await client.post("/api/v1/formulations/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["service_classification"] == "MULTI_STAGE_PROCESS"
    assert len(data["stages"]) == 2
    assert data["stages"][0]["service_type"] == "LIGHTENING"
    assert data["stages"][1]["service_type"] == "TONING"


@pytest.mark.asyncio
async def test_formulation_api_cross_brand_comparison(
    client: AsyncClient,
    db_session: AsyncSession,
):
    await seed_wella_india(db_session)
    await seed_loreal_india(db_session)

    payload = {
        "mode": "CROSS_BRAND_COMPARISON",
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"patch_test_completed_48h": True},
            "roots": {"region": "ROOTS", "observed_level": 5},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 5},
            "ends": {"region": "ENDS", "observed_level": 5},
        },
        "target_colour": {
            "universal_level": 7,
            "primary_tone": "ASH",
        },
    }

    res = await client.post("/api/v1/formulations/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] in ("ELIGIBLE_FOR_REVIEW", "REQUIRES_PROFESSIONAL_REVIEW")
    assert any("Cross-brand evaluation performed across" in w for w in data["warnings"])
