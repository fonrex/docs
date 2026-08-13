---
id: "migrations"
title: "Migrations de schéma (Alembic)"
sidebar_label: "Migrations de schéma"
description: "Gestion des migrations de schéma et des politiques d'hypertables TimescaleDB avec Alembic"
---


# Migrations de schéma (Alembic)

Fonrex utilise **Alembic** pour gérer l'évolution des schémas de base de données. Les migrations s'exécutent dans un environnement isolé avant le démarrage de l'API.

## Historique des Migrations

| Revision ID | Description | Key Changes |
|---|---|---|
| `001_initial` | Initial schema | `assets`, `prices_eod`, `fundamentals` |
| `008_realtime` | Realtime streaming | `prices_intraday` hypertable, `realtime_subscriptions` |
| `009_isin_listings` | Asset & listing refactor | `asset_listings`, `asset_mappings`, partial ISIN unique index |
| `010_news_articles` | News aggregation | `news_articles` table with `url` unique constraint |
| `011_provider_monitoring` | Provider health suite | `provider_health_log` hypertable, `provider_health_daily`, `provider_alerts` |

## Flux d'Exécution des Migrations

1. At container startup, `entrypoint.sh` executes `alembic upgrade head`.
2. `main.py` checks current schema status via `database/migrations.py`.
3. If the stored revision in `alembic_version` does not match `head`, `main.py` marks `app.state.db_available = False` to prevent queries against incomplete schemas.

## Créer une Nouvelle Migration

To add a new table or column, generate a migration script inside the running container:

```bash
docker compose exec fonrex-api alembic revision -m "add_column_to_table"
```

Edit the generated file in `alembic/versions/` and apply it:

```bash
docker compose exec fonrex-api alembic upgrade head
```
