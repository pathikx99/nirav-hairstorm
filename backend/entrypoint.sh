#!/bin/bash
set -e

echo "Starting Nirav Hairstorm entrypoint..."

# If using PostgreSQL, wait until reachable
python -c "
import asyncio
from backend.app.config import get_settings
from backend.app.database.session import async_session_factory
from sqlalchemy import text

async def wait_db():
    settings = get_settings()
    if 'sqlite' in settings.async_database_url:
        print('Using local SQLite - no external database wait needed.')
        return
    print('Waiting for database to be reachable...')
    for i in range(30):
        try:
            async with async_session_factory() as s:
                await s.execute(text('SELECT 1'))
            print('✅ Database reachable!')
            return
        except Exception as e:
            print(f'Waiting... ({e})')
            await asyncio.sleep(1)
    raise RuntimeError('Database unreachable after 30 attempts')

asyncio.run(wait_db())
"

echo "Checking catalogue seed status..."
python -c "
import asyncio
from backend.app.database.session import async_session_factory
from backend.app.models.manufacturers import ManufacturerShade
from sqlalchemy import select, func
from backend.app.database.seed import seed_all

async def ensure_seeded():
    async with async_session_factory() as s:
        count = await s.scalar(select(func.count(ManufacturerShade.id)))
        if count == 0:
            print('🌱 Database empty, automatically seeding manufacturer catalogues...')
            await seed_all()
        else:
            print(f'✅ Database already populated ({count} shades). Skipping seed.')

asyncio.run(ensure_seeded())
"

echo "🚀 Starting Nirav Hairstorm Backend API..."
exec "$@"
