---
id: "migrations"
title: "Schema 迁移 (Alembic)"
sidebar_label: "Schema 迁移"
description: "如何使用 Alembic 管理 Schema 迁移和 TimescaleDB 超级表策略"
---


# Schema 迁移 (Alembic)

Fonrex uses **Alembic** to manage database schema evolutions. Migrations run in an isolated environment prior to API service startup to ensure schema consistency.

## Migration History

| Revision ID | 说明描述 | Key Changes |
|---|---|---|
| `001_initial` | Initial schema | `assets`, `prices_eod`, `fundamentals` |
| `008_realtime` | Realtime streaming | `prices_intraday` hypertable, `realtime_subscriptions` |
| `009_isin_listings` | Asset & listing refactor | `asset_listings`, `asset_mappings`, partial ISIN unique index |
| `010_news_articles` | News aggregation | `news_articles` table with `url` unique constraint |
| `011_provider_monitoring` | Provider health suite | `provider_health_log` hypertable, `provider_health_daily`, `provider_alerts` |

## Migration Execution Flow

1. At container startup, `entrypoint.sh` executes `alembic upgrade head`.
2. `main.py` checks current schema status via `database/migrations.py`.
3. If the stored revision in `alembic_version` does not match `head`, `main.py` marks `app.state.db_available = False` to prevent queries against incomplete schemas.

## Creating a New Migration

To add a new table or column, generate a migration script inside the running container:

```bash
docker compose exec fonrex-api alembic revision -m "add_column_to_table"
```

Edit the generated file in `alembic/versions/` and apply it:

```bash
docker compose exec fonrex-api alembic upgrade head
```
