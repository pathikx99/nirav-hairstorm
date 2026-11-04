"""
Integration tests for Wella India HTTP API endpoints:
- List manufacturers
- Retrieve manufacturer by ID
- List products and shades
- Query shade mapping
- Resolve shade mapping endpoint (POST /api/v1/shade-mapping/resolve)
- Query developers and product rules
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.manufacturers.wella_seeder import seed_wella_india


@pytest.mark.asyncio
async def test_wella_api_endpoints(client: AsyncClient, db_session: AsyncSession):
    # Seed database first
    await seed_wella_india(db_session)

    # 1. List manufacturers
    res = await client.get("/api/v1/manufacturers")
    assert res.status_code == 200
    m_list = res.json()
    assert len(m_list) >= 1
    wella = [m for m in m_list if m["slug"] == "wella-india"][0]
    wella_id = wella["id"]
    assert wella["name"] == "Wella Professionals"

    # Filter by market IN
    res_in = await client.get("/api/v1/manufacturers?market=IN")
    assert res_in.status_code == 200
    assert any(m["id"] == wella_id for m in res_in.json())

    # 2. Get manufacturer by ID
    res_m = await client.get(f"/api/v1/manufacturers/{wella_id}")
    assert res_m.status_code == 200
    assert res_m.json()["slug"] == "wella-india"

    # 3. List products under manufacturer
    res_prods = await client.get(f"/api/v1/manufacturers/{wella_id}/products")
    assert res_prods.status_code == 200
    prods = res_prods.json()
    assert len(prods) >= 6

    # 4. Query shade by exact code (7/1)
    res_shades = await client.get("/api/v1/shades?shade_code=7/1&market=IN")
    assert res_shades.status_code == 200
    shades_7_1 = res_shades.json()
    assert len(shades_7_1) == 1
    shade_7_1 = shades_7_1[0]
    assert shade_7_1["shade_code"] == "7/1"
    shade_id = shade_7_1["id"]

    # 5. Query UHCR mapping for shade 7/1
    res_map = await client.get(f"/api/v1/shades/{shade_id}/mapping")
    assert res_map.status_code == 200
    mapping = res_map.json()
    assert mapping["uhcr_level"] == 7
    assert mapping["primary_tone"] == "ASH"
    assert mapping["verification_status"] == "VERIFIED"

    # 6. Test POST /api/v1/shade-mapping/resolve with exact code "7/1"
    res_resolve = await client.post(
        "/api/v1/shade-mapping/resolve",
        json={"shade_code": "7/1", "market": "IN"},
    )
    assert res_resolve.status_code == 200
    resolve_data = res_resolve.json()
    assert resolve_data["original_shade_code"] == "7/1"
    assert resolve_data["mapping"]["level"] == 7
    assert resolve_data["mapping"]["primary_tone"] == "ASH"
    assert resolve_data["verification_status"] == "VERIFIED"

    # 7. Test POST /api/v1/shade-mapping/resolve with Special Blonde "12/89"
    res_resolve_sb = await client.post(
        "/api/v1/shade-mapping/resolve",
        json={"shade_code": "12/89", "market": "IN"},
    )
    assert res_resolve_sb.status_code == 200
    resolve_sb = res_resolve_sb.json()
    assert resolve_sb["original_shade_code"] == "12/89"
    assert resolve_sb["mapping"]["level"] == 10
    assert resolve_sb["mapping"]["primary_tone"] == "PEARL"
    assert resolve_sb["mapping"]["secondary_tone"] == "VIOLET"
    assert resolve_sb["mapping"]["colour_family"] == "SPECIAL_BLONDE"

    # 8. Query developers endpoint
    res_devs = await client.get("/api/v1/developers?market=IN")
    assert res_devs.status_code == 200
    devs = res_devs.json()
    assert len(devs) >= 8

    # 9. Query product rules endpoint
    res_rules = await client.get("/api/v1/product-rules?market=IN")
    assert res_rules.status_code == 200
    rules = res_rules.json()
    assert len(rules) >= 14
    rule_types = {r["rule_type"] for r in rules}
    assert "MIXING_RATIO" in rule_types
    assert "DEVELOPER_COMPATIBILITY" in rule_types
    assert "CONTRAINDICATION" in rule_types
