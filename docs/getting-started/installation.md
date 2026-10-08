---
id: "installation"
title: "Installation Guide"
sidebar_label: "Installation"
description: "Install and run a self-hosted Fonrex instance with Docker Compose"
---

# Installation Guide

This guide sets up a self-hosted Fonrex instance with Docker Compose.

## Requirements

- Docker Engine and Docker Compose v2
- Linux, macOS, or Windows with WSL2
- 4 GB of RAM at least, 8 GB recommended for large ingestions
- Disk space for the price history you ingest (a first ingestion fetches about ten years per listing)

## 1. Clone the repository

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
```

## 2. Create `.env`

```bash
cp .env.example .env
```

Docker Compose loads `.env` into the API container. Two settings must be set **before the first start**:

**An API key.** Authentication is on by default: until a key is configured, every route except `/health`, the documentation and the OpenBB discovery files answers `401`.

```bash
export FONREX_API_KEY="frx_live_$(openssl rand -hex 24)"
sed -i.bak "s/^FONREX_API_KEY=.*/FONREX_API_KEY=$FONREX_API_KEY/" .env && rm .env.bak
```

**The database password.** Change `POSTGRES_PASSWORD` (letters, digits, `-` and `_` only — it is embedded in a URL). It is stored in the database volume when the database is created; changing it later requires `ALTER USER fonrex PASSWORD '...'` or a new volume.

Keep one `KEY=value` per line and put comments on their own lines: Docker Compose reads a comment placed after an empty value as the value itself.

See [Configuration](configuration.md) for every setting.

## 3. Start the stack

```bash
mkdir -p logs
docker compose up -d
```

This starts three containers:

| Container | Role | Published on |
|---|---|---|
| `fonrex-api` | FastAPI served by Gunicorn | `0.0.0.0:5000` |
| `fonrex-db` | PostgreSQL 16 + TimescaleDB (`timescale/timescaledb-ha:pg16`) | `127.0.0.1:5432` only |
| `fonrex-redis` | Redis 7 (cache and Pub/Sub) | `127.0.0.1:6379` only |

The API container applies the database migrations (`alembic upgrade head`) before starting. A fourth service, `fonrex-migrate`, runs the migrations alone; it belongs to the `migrate` profile and does not start by default.

## 4. Check the instance

```bash
curl http://localhost:5000/health
curl -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/listings?ticker=AIR.PA"
```

`/health` answers without a key; the second request checks that your key is accepted.

## 5. Import instruments

The image contains two catalogues, `data/etf.csv` and `data/stocks.csv`:

```bash
docker compose exec fonrex-api python import_assets.py --file data/etf.csv
```

Alternatives:

- `make db-seed` imports the default catalogue and enriches it from Yahoo Finance.
- `SEED_ON_FIRST_RUN=true` in `.env` imports `data/etf.csv` at the first start when the database is empty.

Prices are ingested the first time a listing is asked for (`GET /eod/{ticker}`), or for the whole catalogue with `scripts/ingest_all.py` — see [Ingesting historical data](../guides/ingest-historical-data.md).

## Updating

```bash
git pull
docker compose up -d --build
```

The image holds the code, the migrations and the seed files: rebuild it after every update. Migrations run at the next start. Back the database up before an upgrade — see [Database migrations in production](../deployment/database-migrations.md).

For development, `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` runs the code of your folder without rebuilding the image.
