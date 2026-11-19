"""Database seeder CLI script for Nirav Hairstorm."""

from __future__ import annotations

import asyncio
from pathlib import Path

from backend.app.database.base import Base
from backend.app.database.session import async_session_factory, engine
from backend.app.manufacturers.importer import CatalogueImporter
from backend.app.manufacturers.loreal_seeder import seed_loreal_india
from backend.app.manufacturers.wella_seeder import seed_wella_india


async def seed_all() -> None:
    print("🌱 Seeding database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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

        alfaparf_dir = Path("data/manufacturers/alfaparf")
        if alfaparf_dir.exists():
            print("  → Importing Alfaparf Milano Professional India...")
            ap_result = await CatalogueImporter.import_from_directory(
                session=session,
                directory=alfaparf_dir,
                market="IN",
            )
            ap_counts = ap_result["counts"]
            print(
                f"    Alfaparf seeded: {ap_counts['shades']} shades, "
                f"{ap_counts['developers']} developers, "
                f"{ap_counts['product_rules']} rules."
            )

        proads_dir = Path("data/manufacturers/proads")
        if proads_dir.exists():
            print("  → Importing Proads Professional India...")
            pr_result = await CatalogueImporter.import_from_directory(
                session=session,
                directory=proads_dir,
                market="IN",
            )
            pr_counts = pr_result["counts"]
            print(
                f"    Proads seeded: {pr_counts['shades']} shades, "
                f"{pr_counts['developers']} developers, "
                f"{pr_counts['product_rules']} rules."
            )

        illumina_dir = Path("data/manufacturers/wella_illumina")
        if illumina_dir.exists():
            print("  → Importing Wella Illumina Color India...")
            il_result = await CatalogueImporter.import_from_directory(
                session=session,
                directory=illumina_dir,
                market="IN",
            )
            il_counts = il_result["counts"]
            print(
                f"    Wella Illumina seeded: {il_counts['shades']} shades, "
                f"{il_counts['developers']} developers, "
                f"{il_counts['product_rules']} rules."
            )

        pure_perfection_dir = Path("data/manufacturers/wella_pure_perfection")
        if pure_perfection_dir.exists():
            print("  → Importing Wella Pure Perfection India...")
            pp_result = await CatalogueImporter.import_from_directory(
                session=session,
                directory=pure_perfection_dir,
                market="IN",
            )
            pp_counts = pp_result["counts"]
            print(
                f"    Wella Pure Perfection seeded: {pp_counts['shades']} shades, "
                f"{pp_counts['developers']} developers, "
                f"{pp_counts['product_rules']} rules."
            )

    print("✅ All catalogues seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_all())
