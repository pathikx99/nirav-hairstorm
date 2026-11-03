# Nirav Hairstorm
## Universal Hair Colour Intelligence Platform

**Technical Specification — Version 1.0**  
**Initial Market:** India  
**Product Category:** Professional hair colour assessment and formulation intelligence  
**Architecture:** Manufacturer-independent colour intelligence with manufacturer-specific technical systems

---

## Architecture Overview

1. **UHCR (Universal Hair Colour Representation v1.0):** Standardised depth (1–10 ICC), tone taxonomies, CIELAB/CIELCh metrics, and CIEDE2000 distance.
2. **Manufacturer Data Schema:** Independent namespaces for each brand preserving original shade notation (e.g. 7/1, 7.1, 7A) without loss.
3. **Shade Mapping Engine:** Deterministic mapping to UHCR with evidence classification and candidate ranking.
4. **Formulation Engine:** Constraint-based, safety-first evaluation of process feasibility across hair regions (roots, mid-lengths, ends).

---

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2
- **Database:** PostgreSQL (with UUIDv7/v4, TIMESTAMPTZ, NUMERIC, JSONB)
- **Frontend:** Next.js + TypeScript
- **Colour Science:** CIELAB, CIELCh, CIEDE2000 (Sharma et al. 2005)

---

## Getting Started

### 1. Prerequisites
- **Python:** 3.11+ (virtual environment available in `.venv`)
- **Node.js:** 18+ (tested with v20+)
- **Docker:** (recommended for PostgreSQL) or a local PostgreSQL 16 instance

---

### 2. Start PostgreSQL Database

Using Docker (recommended):
```bash
docker compose up -d db
```
*Database credentials default to: `postgresql://postgres:postgres@localhost:5432/hairstorm`.*

---

### 3. Run Database Migrations & Seed Data

Activate the virtual environment:
```bash
source .venv/bin/activate
```

Apply Alembic migrations:
```bash
alembic upgrade head
```

Seed initial manufacturer catalogues (Wella Professionals, L'Oréal Professionnel, Schwarzkopf):
```bash
python -m backend.app.database.seed
```

---

### 4. Run the Backend API

Start the FastAPI development server:
```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

- **API Base URL:** `http://localhost:8000/api/v1`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

---

### 5. Run the Frontend (Next.js)

In a new terminal window:
```bash
cd frontend
npm run dev
```

- **Web Application:** `http://localhost:3000`

---

### 6. Run the Test Suite

Run all unit, integration, and validation tests (uses fast in-memory SQLite):
```bash
pytest
```
Run with coverage:
```bash
pytest --cov=backend
```

# nirav-hairstorm
