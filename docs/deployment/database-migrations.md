---
id: "database-migrations"
title: "Database Migrations in Production"
sidebar_label: "Database Migrations"
description: "Upgrade an instance safely: back up, migrate, check, and restore if needed"
---

# Database Migrations in Production

The API container applies `alembic upgrade head` at every start. An upgrade of Fonrex is therefore an upgrade of the schema: prepare it.

## Upgrade procedure

1. **Back up the database**:

   ```bash
   docker compose exec -T db pg_dump -U fonrex -d fonrex -Fc > fonrex-$(date +%F).dump
   ```

2. **Update the code**: `git pull`.
3. **Migrate alone** (optional, to see the migrations run before the API starts):

   ```bash
   docker compose --profile migrate build fonrex-migrate
   docker compose --profile migrate run --rm fonrex-migrate
   ```

4. **Start the new version**: `docker compose up -d --build`.
5. **Check**: `docker compose logs fonrex-api` shows the migrations applied, then `curl http://localhost:5000/health` and a few requests with your key. A database left behind the code makes its routes answer `503`.

## Rolling back

Restore the backup taken in step 1 with the previous version of the code (see [Docker Compose](../getting-started/docker-compose.md#backing-up-the-database)). Prefer it to `alembic downgrade`: some downgrades cannot give back what the upgrade removed (migration 008 drops tables; migration 014 keeps one bar per instrument and date when going back).

## Notable migrations

| Migration | What to know |
|---|---|
| 014 — prices per listing | Rebuilds `prices_eod` with one series per listing and re-dates the existing bars to their trading session. Runs by itself; nothing is downloaded again. If a series looks wrong afterwards: `POST /historical/ingest?ticker=<ticker>&force_refresh=true` |
| 015 — dividend yields as ratios | Converts stored dividend yields from percentages to ratios |
| 016 — adjustment of price series | Creates `price_series_adjustments`. Prices are not touched: each series stored before is fetched again in full at its next ingestion, with the traded close in `close` and the dividend-adjusted close in `adj_close`. To do it at once: `docker compose exec fonrex-api python scripts/ingest_all.py --force` |

The full list is in [Schema migrations](../architecture/migrations.md).

## Testing migrations

The database tests apply the migrations to a real TimescaleDB, on existing data, down and up again:

```bash
make test-db     # throwaway container of the image of docker-compose.yml, port 54329
```

To run them against your own server (a temporary database is created and dropped):

```bash
FONREX_TEST_DATABASE_URL=postgresql://fonrex:<password>@localhost:5432/fonrex \
    pytest tests/test_timescale_integration.py
```
