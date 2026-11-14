# Nirav Hairstorm — Production Deployment Guide

This guide covers deployment options for the **Nirav Hairstorm** Universal Hair Colour Intelligence Platform.

---

## 🏗️ Architecture Overview

The system consists of three main components:
1. **PostgreSQL 16**: Relational database with UUIDv4/v7, TIMESTAMPTZ, NUMERIC, and JSONB support.
2. **Backend API**: Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Uvicorn, and Alembic migrations.
3. **Frontend Application**: Next.js 16.4+, React 19, TypeScript, and Tailwind CSS.

---

## 🚀 Option 1: 1-Command Docker Compose (Recommended)

Ideal for VPS, DigitalOcean Droplets, AWS EC2, Linode, Hetzner, or local production environments.

### 1. Prerequisites
- Docker (version 24.0+)
- Docker Compose (v2.20+)
- Git

### 2. Clone Repository & Setup Environment
```bash
git clone <your-repo-url> nirav-hairstorm
cd nirav-hairstorm

# Copy sample environment configuration
cp .env.example .env
```

Edit `.env` to set your desired secure database password:
```ini
POSTGRES_USER=hairstorm_admin
POSTGRES_PASSWORD=YourStrongSecretPassword123!
POSTGRES_DB=hairstorm
```

### 3. Build & Launch Containers
```bash
docker compose up -d --build
```

### 4. What Happens Automatically on Startup
- PostgreSQL initializes with a health check.
- The backend container waits until PostgreSQL is ready.
- **Alembic migrations** (`alembic upgrade head`) execute automatically.
- **Catalogue Seeder** detects if the database is empty and automatically seeds **Wella**, **L'Oréal**, and **Schwarzkopf** shade catalogues.
- The Next.js frontend builds and serves production assets on port `3000`.

### 5. Verify Running Containers
```bash
docker compose ps
```
Services will be available at:
- **Web App:** `http://your-server-ip:3000`
- **Backend API:** `http://your-server-ip:8000/api/v1`
- **Interactive Swagger Docs:** `http://your-server-ip:8000/docs`
- **Health Check:** `http://your-server-ip:8000/health`

---

## 🌐 Setting Up Nginx Reverse Proxy with HTTPS (SSL)

To expose the application on standard port 80/443 with your custom domain (e.g. `hairstorm.example.com`):

### 1. Install Nginx & Certbot on Host
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Nginx Configuration
Create `/etc/nginx/sites-available/hairstorm`:
```nginx
# Frontend (Web Application)
server {
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend (API & Swagger)
server {
    server_name api.yourdomain.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable Site & Generate Free SSL Certificate
```bash
sudo ln -s /etc/nginx/sites-available/hairstorm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Generate Let's Encrypt SSL
sudo certbot --nginx -d app.yourdomain.com -d api.yourdomain.com
```

---

## ☁️ Option 2: Cloud Platform Deployment (Vercel + Render / Railway)

### A. Deploy Frontend on Vercel
1. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Connect your GitHub repository.
3. Configure project settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com/api/v1`
5. Click **Deploy**.

### B. Deploy Backend & Database on Render or Railway
1. **Create PostgreSQL Database**:
   - Create a managed PostgreSQL instance.
   - Copy the External Database Connection String (e.g. `postgres://user:pass@host/db`).
2. **Deploy FastAPI Backend**:
   - Create a new **Web Service** from repository.
   - **Root Directory:** `.`
   - **Runtime:** Python 3.11+
   - **Build Command:** `pip install -e .`
   - **Start Command:**
     ```bash
     alembic upgrade head && python -c "from backend.app.database.seed import seed_all; import asyncio; asyncio.run(seed_all())" && uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Environment Variables**:
     - `DATABASE_URL` = `postgresql+asyncpg://user:pass@host/db` *(replace postgres:// with postgresql+asyncpg://)*
     - `CORS_ORIGINS` = `["https://your-frontend.vercel.app"]`
     - `DEBUG` = `false`

---

## ⚙️ Environment Variables Reference

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URL with asyncpg driver | `postgresql+asyncpg://user:pass@localhost:5432/hairstorm` |
| `CORS_ORIGINS` | JSON list of allowed origins | `["http://localhost:3000","https://app.yourdomain.com"]` |
| `DEBUG` | Enable verbose SQL and error traces (disable in prod) | `false` |
| `NEXT_PUBLIC_API_URL` | Public API URL accessible by the user's browser | `https://api.yourdomain.com/api/v1` |

---

## 💾 Database Backup & Restore

### Backup Database
```bash
# Docker Compose
docker compose exec -t db pg_dump -U postgres -d hairstorm -F c -b -v -f /var/lib/postgresql/data/hairstorm_backup.dump

# Copy to host
docker cp hairstorm-db:/var/lib/postgresql/data/hairstorm_backup.dump ./hairstorm_backup_$(date +%Y%m%d).dump
```

### Restore Database
```bash
docker compose exec -i db pg_restore -U postgres -d hairstorm -v /var/lib/postgresql/data/hairstorm_backup.dump
```
