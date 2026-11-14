#!/bin/bash
set -e

echo "Waiting for PostgreSQL database to be reachable..."
until python -c "
import asyncio
from backend.app.database.session import async_session_factory
from sqlalchemy import text

async def check():
    async with async_session_factory() as s:
        await s.execute(text('SELECT 1'))

asyncio.run(check())
" 2>/dev/null; do
    echo "PostgreSQL is unavailable - sleeping 1s..."
    sleep 1
done

echo "✅ PostgreSQL is reachable!"

echo "Running database migrations (alembic upgrade head)..."
alembic upgrade head

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
