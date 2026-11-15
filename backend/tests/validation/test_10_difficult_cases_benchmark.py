"""
10 Difficult Real-Life Salon Formulation Cases Automated Benchmark Test Suite
Validates safety gating, grey coverage developer capping, underlying pigment compensation,
multi-bowl zonal architecture, and chelation protocols against Master Colorist standards.
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
async def test_ten_difficult_salon_cases_benchmark(client: AsyncClient, db_session: AsyncSession):
    # Ensure seed catalogues
    await seed_wella_india(db_session)
    await seed_loreal_india(db_session)
    sk_dir = Path("data/manufacturers/schwarzkopf")
    if sk_dir.exists():
        await CatalogueImporter.import_from_directory(
            session=db_session,
            directory=sk_dir,
            market="IN",
        )

    res_m = await db_session.execute(select(Manufacturer).where(Manufacturer.slug == "wella-india"))
    wella = res_m.scalars().first()
    assert wella is not None
    mfg_wella = str(wella.id)

    # -------------------------------------------------------------------------
    # CASE 1: Dark Box Dye Black (L2) lifted to Warm Honey Caramel (L7)
    # -------------------------------------------------------------------------
    resp_1 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
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
    })
    assert resp_1.status_code == 200
    d1 = resp_1.json()
    assert d1["status"] in ("ELIGIBLE_FOR_REVIEW", "REQUIRES_PROFESSIONAL_REVIEW")
    assert len(d1["stages"]) == 2
    assert d1["stages"][0]["developer"]["volume_in_vol"] == 20
    assert d1["stages"][1]["developer"]["volume_in_vol"] == 6

    # -------------------------------------------------------------------------
    # CASE 2: 100% Resistant Coarse Grey Hair -> Developer MUST be capped at 20V
    # -------------------------------------------------------------------------
    resp_2 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"has_allergy_history": False, "patch_test_completed_48h": True, "scalp_condition": "normal", "previous_chemical_services": []},
            "roots": {"region": "ROOTS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 100.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": True},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 80.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
            "ends": {"region": "ENDS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 60.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
        },
        "target_colour": {"universal_level": 7, "primary_tone": "GOLD", "secondary_tone": None, "tone_intensity": "STANDARD"}
    })
    assert resp_2.status_code == 200
    d2 = resp_2.json()
    bowl_1 = d2["stages"][0]
    # Strict master-colorist check: 40V on 100% grey scalp is strictly prohibited!
    assert bowl_1["developer"]["volume_in_vol"] == 20
    assert any(p["shade_code"] == "7/0" for p in bowl_1["products"])

    # -------------------------------------------------------------------------
    # CASE 3: Drastic Darkening / Repigmentation (L10 to L5)
    # -------------------------------------------------------------------------
    resp_3 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"has_allergy_history": False, "patch_test_completed_48h": True, "scalp_condition": "normal", "previous_chemical_services": ["bleach"]},
            "roots": {"region": "ROOTS", "observed_level": 5, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
            "ends": {"region": "ENDS", "observed_level": 10, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
        },
        "target_colour": {"universal_level": 5, "primary_tone": "GOLD", "secondary_tone": "NATURAL", "tone_intensity": "STANDARD"}
    })
    assert resp_3.status_code == 200
    d3 = resp_3.json()
    assert len(d3["stages"]) == 2
    assert d3["stages"][0]["products"][0]["product_type"] == "FILLER"

    # -------------------------------------------------------------------------
    # CASE 4: Sodium Hydroxide Relaxer + Bleach -> MUST BE BLOCKED
    # -------------------------------------------------------------------------
    resp_4 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"has_allergy_history": False, "patch_test_completed_48h": True, "scalp_condition": "normal", "has_sodium_hydroxide_relaxer": True, "previous_chemical_services": ["relaxer"]},
            "roots": {"region": "ROOTS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": True},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
            "ends": {"region": "ENDS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
        },
        "target_colour": {"universal_level": 9, "primary_tone": "ASH", "secondary_tone": None, "tone_intensity": "STANDARD"}
    })
    assert resp_4.status_code == 200
    assert resp_4.json()["status"] == "BLOCKED"

    # -------------------------------------------------------------------------
    # CASE 5: Henna / Metallic Salts + Bleach -> MUST BE BLOCKED
    # -------------------------------------------------------------------------
    resp_5 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"has_allergy_history": False, "patch_test_completed_48h": True, "scalp_condition": "normal", "has_metallic_salts_or_henna": True, "previous_chemical_services": ["henna"]},
            "roots": {"region": "ROOTS", "observed_level": 3, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 3, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
            "ends": {"region": "ENDS", "observed_level": 3, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
        },
        "target_colour": {"universal_level": 8, "primary_tone": "GOLD", "secondary_tone": None, "tone_intensity": "STANDARD"}
    })
    assert resp_5.status_code == 200
    assert resp_5.json()["status"] == "BLOCKED"

    # -------------------------------------------------------------------------
    # CASE 6: Multi-Banding -> Zonal Bowls Generated
    # -------------------------------------------------------------------------
    resp_6 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"has_allergy_history": False, "patch_test_completed_48h": True, "scalp_condition": "normal", "previous_chemical_services": ["permanent_colour", "bleach"]},
            "roots": {"region": "ROOTS", "observed_level": 3, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 5, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
            "ends": {"region": "ENDS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
        },
        "target_colour": {"universal_level": 6, "primary_tone": "ASH", "secondary_tone": None, "tone_intensity": "STANDARD"}
    })
    assert resp_6.status_code == 200
    d6 = resp_6.json()
    assert d6["status"] in ("ELIGIBLE_FOR_REVIEW", "REQUIRES_PROFESSIONAL_REVIEW")
    assert len(d6["stages"]) >= 2

    # -------------------------------------------------------------------------
    # CASE 7: Known Allergy History -> MUST BE BLOCKED
    # -------------------------------------------------------------------------
    resp_7 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"has_allergy_history": True, "patch_test_completed_48h": False, "scalp_condition": "normal", "previous_chemical_services": []},
            "roots": {"region": "ROOTS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 40.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 40.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False},
            "ends": {"region": "ENDS", "observed_level": 4, "existing_artificial_colour": False, "grey_percentage": 40.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": False}
        },
        "target_colour": {"universal_level": 5, "primary_tone": "NATURAL", "secondary_tone": None, "tone_intensity": "STANDARD"}
    })
    assert resp_7.status_code == 200
    assert resp_7.json()["status"] == "BLOCKED"

    # -------------------------------------------------------------------------
    # CASE 8: Virgin Level 2 to Level 8 Ash (6 levels lift)
    # -------------------------------------------------------------------------
    resp_8 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"has_allergy_history": False, "patch_test_completed_48h": True, "scalp_condition": "normal", "previous_chemical_services": []},
            "roots": {"region": "ROOTS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": True},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": False},
            "ends": {"region": "ENDS", "observed_level": 2, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "LOW", "condition": "HEALTHY", "is_on_scalp": False}
        },
        "target_colour": {"universal_level": 8, "primary_tone": "ASH", "secondary_tone": None, "tone_intensity": "STANDARD"}
    })
    assert resp_8.status_code == 200
    d8 = resp_8.json()
    assert d8["status"] in ("ELIGIBLE_FOR_REVIEW", "REQUIRES_PROFESSIONAL_REVIEW")
    assert len(d8["stages"]) == 2

    # -------------------------------------------------------------------------
    # CASE 9: Hard water mineral green -> Chelation stage product must NOT be None
    # -------------------------------------------------------------------------
    resp_9 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"has_allergy_history": False, "patch_test_completed_48h": True, "scalp_condition": "normal", "has_hard_water": True, "previous_chemical_services": ["hard water"]},
            "roots": {"region": "ROOTS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
            "ends": {"region": "ENDS", "observed_level": 9, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False}
        },
        "target_colour": {"universal_level": 8, "primary_tone": "GOLD", "secondary_tone": "COPPER", "tone_intensity": "STANDARD"}
    })
    assert resp_9.status_code == 200
    d9 = resp_9.json()
    assert d9["stages"][0]["products"][0]["shade_code"] == "CHELATING-PREP"

    # -------------------------------------------------------------------------
    # CASE 10: Severely Damaged Snapping Ends (Deposit) -> Warning, NOT Blocked
    # -------------------------------------------------------------------------
    resp_10 = await client.post("/api/v1/formulations/evaluate", json={
        "mode": "PREFERRED_MANUFACTURER",
        "manufacturer_id": mfg_wella,
        "market": "IN",
        "assessment": {
            "market": "IN",
            "history": {"has_allergy_history": False, "patch_test_completed_48h": True, "scalp_condition": "normal", "previous_chemical_services": ["bleach"]},
            "roots": {"region": "ROOTS", "observed_level": 6, "existing_artificial_colour": False, "grey_percentage": 0.0, "porosity": "NORMAL", "condition": "HEALTHY", "is_on_scalp": True},
            "mid_lengths": {"region": "MID_LENGTHS", "observed_level": 7, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "MODERATELY_DAMAGED", "is_on_scalp": False},
            "ends": {"region": "ENDS", "observed_level": 8, "existing_artificial_colour": True, "grey_percentage": 0.0, "porosity": "HIGH", "condition": "SEVERELY_DAMAGED", "is_on_scalp": False}
        },
        "target_colour": {"universal_level": 7, "primary_tone": "NATURAL", "secondary_tone": "GOLD", "tone_intensity": "STANDARD"}
    })
    assert resp_10.status_code == 200
    d10 = resp_10.json()
    assert d10["status"] == "REQUIRES_PROFESSIONAL_REVIEW"
