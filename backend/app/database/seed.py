"""Database seeder CLI script for Nirav Hairstorm."""

from __future__ import annotations

import asyncio
from pathlib import Path

from backend.app.database.session import async_session_factory
from backend.app.manufacturers.importer import CatalogueImporter
from backend.app.manufacturers.loreal_seeder import seed_loreal_india
from backend.app.manufacturers.wella_seeder import seed_wella_india


async def seed_all() -> None:
    print("🌱 Seeding database...")
    async with async_session_factory() as session:
        print("  → Seeding Wella Professionals India...")
        wella_counts = await seed_wella_india(session)
        print(
            f"    Wella seeded: {wella_counts['shades']} shades, "
            f"{wella_counts['developers']} developers, "
            f"{wella_counts['product_rules']} rules."
        )

        print("  → Seeding L'Oréal Professionnel India...")
        loreal_counts = await seed_loreal_india(session)
        print(
            f"    L'Oréal seeded: {loreal_counts['shades']} shades, "
            f"{loreal_counts['developers']} developers, "
            f"{loreal_counts['product_rules']} rules."
        )

        schwarzkopf_dir = Path("data/manufacturers/schwarzkopf")
        if schwarzkopf_dir.exists():
            print("  → Importing Schwarzkopf Professional India...")
            sk_result = await CatalogueImporter.import_from_directory(
                session=session,
                directory=schwarzkopf_dir,
                market="IN",
            )
            sk_counts = sk_result["counts"]
            print(
                f"    Schwarzkopf seeded: {sk_counts['shades']} shades, "
                f"{sk_counts['developers']} developers, "
                f"{sk_counts['product_rules']} rules."
            )

    print("✅ All catalogues seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_all())
