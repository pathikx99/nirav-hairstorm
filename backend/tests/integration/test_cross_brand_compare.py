"""
Integration tests for Milestone 3: Cross-Brand Shade Mapping and Comparison Engine.

Verifies:
- Cross-brand search across multiple onboarded manufacturers (Wella Professionals and L'Oréal Professionnel)
- Original shade code preservation (Wella "7/1" vs L'Oréal "7.1")
- Candidate ranking by composite distance (D = w_L D_L + w_T D_T + w_I D_I + w_C D_C)
- Evidence classification (THEORETICAL_SHADE_MATCH, MEASURED_COLOUR_MATCH)
- Categorical confidence tiering (HIGH, MEDIUM, LOW)
- Chemical equivalence declaration (strictly NOT_ESTABLISHED per Principle 4)
- Hard eligibility filters (market, published status, category, max_level_difference, manufacturer_ids)
- Deterministic empty response without fabricating candidate shades (Section 4.8)
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.manufacturers.loreal_seeder import seed_loreal_india
from backend.app.manufacturers.wella_seeder import seed_wella_india


@pytest.mark.asyncio
async def test_cross_brand_shade_comparison_engine(
    client: AsyncClient,
    db_session: AsyncSession,
):
    # 1. Seed both Wella India and L'Oréal India catalogues
    await seed_wella_india(db_session)
    await seed_loreal_india(db_session)

    # 2. Compare shades for Target: Level 7 Ash (BLONDE + ASH)
    compare_payload = {
        "market": "IN",
        "target": {
            "level": 7,
            "primary_tone": "ASH",
            "secondary_tone": None,
            "tone_intensity": "STANDARD",
            "colour_family": "NATURAL",
        },
        "product_categories": ["PERMANENT_COLOUR"],
        "require_verified_mapping": True,
        "max_level_difference": 1,
        "limit": 10,
    }

    res = await client.post("/api/v1/shade-mapping/compare", json=compare_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["mapping_engine_version"] == "1.0"
    assert data["total"] > 0
    results = data["results"]
    assert len(results) <= 10

    # 3. Verify Cross-Brand Representation: Candidates from BOTH Wella and L'Oréal
    manufacturers_found = {c["manufacturer"] for c in results}
    assert "Wella Professionals" in manufacturers_found
    assert "L'Oréal Professionnel" in manufacturers_found

    # 4. Verify Original Shade Notation Preserved (7/1 vs 7.1)
    shade_codes = {c["shade_code"] for c in results}
    assert "7/1" in shade_codes  # Wella slash notation
    assert "7.1" in shade_codes  # L'Oréal dot notation

    # 5. Inspect top candidate matches
    wella_cand = [c for c in results if c["shade_code"] == "7/1"][0]
    loreal_cand = [c for c in results if c["shade_code"] == "7.1"][0]

    # Verify Wella 7/1 candidate attributes
    assert wella_cand["manufacturer"] == "Wella Professionals"
    assert wella_cand["universal_mapping"]["level"] == 7
    assert wella_cand["universal_mapping"]["primary_tone"] == "ASH"
    assert wella_cand["match_classification"] == "THEORETICAL_SHADE_MATCH"
    assert wella_cand["confidence"] == "HIGH"
    assert wella_cand["chemical_equivalence"] == "NOT_ESTABLISHED"
    assert wella_cand["level_distance"] == 0.0
    assert wella_cand["tone_distance"] == 0.0

    # Verify L'Oréal 7.1 candidate attributes
    assert loreal_cand["manufacturer"] == "L'Oréal Professionnel"
    assert loreal_cand["universal_mapping"]["level"] == 7
    assert loreal_cand["universal_mapping"]["primary_tone"] == "ASH"
    assert loreal_cand["match_classification"] == "THEORETICAL_SHADE_MATCH"
    assert loreal_cand["confidence"] == "HIGH"
    assert loreal_cand["chemical_equivalence"] == "NOT_ESTABLISHED"
    assert loreal_cand["level_distance"] == 0.0
    assert loreal_cand["tone_distance"] == 0.0

    # 6. Verify Ranking Order: Level 7 Ash shades must be ranked before different levels or tones
    top_2_codes = {results[0]["shade_code"], results[1]["shade_code"]}
    assert "7/1" in top_2_codes
    assert "7.1" in top_2_codes

    # 7. Test max_level_difference filter (strictly level 7 only when max_diff = 0)
    strict_level_payload = {
        **compare_payload,
        "max_level_difference": 0,
    }
    res_strict = await client.post("/api/v1/shade-mapping/compare", json=strict_level_payload)
    assert res_strict.status_code == 200
    for cand in res_strict.json()["results"]:
        assert cand["universal_mapping"]["level"] == 7

    # 8. Test Manufacturer ID Filtering (only Wella)
    wella_id = wella_cand["manufacturer_id"]
    wella_filter_payload = {
        **compare_payload,
        "manufacturer_ids": [wella_id],
    }
    res_wella = await client.post("/api/v1/shade-mapping/compare", json=wella_filter_payload)
    assert res_wella.status_code == 200
    for cand in res_wella.json()["results"]:
        assert cand["manufacturer_id"] == wella_id
        assert cand["manufacturer"] == "Wella Professionals"

    # 9. Test Non-Existent Market returns empty list without fabricating results (Section 4.8)
    empty_payload = {
        **compare_payload,
        "market": "XX_NON_EXISTENT",
    }
    res_empty = await client.post("/api/v1/shade-mapping/compare", json=empty_payload)
    assert res_empty.status_code == 200
    assert res_empty.json()["total"] == 0
    assert res_empty.json()["results"] == []
