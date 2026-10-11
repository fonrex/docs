---
id: "migrations"
title: "Schema Migrations (Alembic)"
sidebar_label: "Schema Migrations"
description: "The Alembic migration chain, how it runs and how to add a migration"
---

# Schema Migrations (Alembic)

Alembic owns the schema, including the TimescaleDB hypertables, compression and continuous aggregates. The chain is linear, with a single head.

## Migration history

| Revision | File | Changes |
|---|---|---|
| 001 | `001_initial_schema.py` | Initial schema: `assets` (unique ISIN index), `asset_listings`, `asset_mappings`, `prices_eod`, `fundamentals`, `usage_logs`, and the legacy tables `stock_data`, `data_requests`, `cache_status` |
| 002 | `002_refonte_fundamentals.py` | `fundamentals_highlights`, `financial_statements`, `earnings_history`, `analyst_ratings`, `etf_details`, `etf_holdings` |
| 003 | `003_index_constituents.py` | `index_constituents` table (not used by the code) |
| 004 | `004_fix_assets_columns.py` | Profile columns of `assets` |
| 005 | `005_premium_fields.py` | Short interest, TTM and growth columns; GICS columns; `earnings_trend`, `esg_scores`, `outstanding_shares_history` |
| 006 | `006_prices_eod_resolution.py` | `resolution`, `adjusted`, `source` on `prices_eod`; `ingest_log` |
| 007 | `007_realtime_tables.py` | `prices_intraday` hypertable (30-day retention), `realtime_subscriptions` |
| 008 | `008_drop_legacy_tables.py` | **Destructive**: drops the legacy price tables |
| 009 | `009_fix_assets_isin_unique.py` | Merges ISIN duplicates, unique ISIN index and listing identity constraint |
| 010 | `010_news_articles.py` | `news_articles` (unique `url`) |
| 011 | `011_provider_health.py` | `provider_health_log` hypertable, `provider_health_daily`, `provider_alerts` |
| 012 | `012_alembic_schema_authority.py` | Alembic takes over hypertables, compression and weekly/monthly aggregates |
| 013 | `013_solvency_ratios.py` | Solvency ratios and cost of debt; `macro_rates_cache` |
| 014 | `014_prices_per_listing.py` | `prices_eod` rebuilt per listing: key `(asset_listing_id, resolution, time)`, rows re-dated to their session; compression and aggregates per listing |
| 015 | `015_dividend_yield_as_ratio.py` | Stored dividend yields converted from percentages to ratios |
| 016 | `016_price_series_adjustments.py` | `price_series_adjustments`: how each stored price series is adjusted and when it was last fetched in one piece. Series stored before are fetched again in full at their next ingestion |
| 017 | `017_macro_rates_source.py` | `macro_rates_cache` holds series of several sources: longer `series_id`, new `source` column (`fred`, `ecb`) |
| 018 | `018_statements_currency_unknown.py` | `financial_statements.currency` loses its `USD` default; the stored rows become unknown (`NULL`) until the next deep enrichment records Yahoo's currency |
| 019 | `019_yahoo_epoch_dates.py` | `dividend_ex_date` and `shares_short_date` equal to 1970-01-01 (Yahoo seconds read as nanoseconds) become `NULL` |
| 020 | `020_factor_returns.py` | `factor_returns` and `factor_dataset_loads`: the Fama/French factor files |
| 021 | `021_fx_rates.py` | `fx_rates` and `fx_rate_loads`: the ECB reference exchange rates |

## How migrations run

1. The API container runs `alembic upgrade head` in `entrypoint.sh` before starting the application. The `fonrex-migrate` service (profile `migrate`) does the same alone.
2. `main.py` compares the revision stored in `alembic_version` with the head. A database behind the code is marked unavailable and the routes that need it answer `503` — the application never changes the schema itself.

Migration 014 first deletes the TimescaleDB jobs of the price tables (waiting for one that is running) and locks `prices_eod`: a compression or refresh job running at the same time would otherwise deadlock with it. The jobs are created again by the migration.

## Adding a migration

```bash
alembic revision -m "describe_the_change"
```

Rename the new file of `alembic/versions/` and set its identifiers after the last migration (`revision = "022"`, `down_revision = "021"`, file `022_describe_the_change.py`), then:

```bash
alembic upgrade head
make migration-check     # one head only
```

- Add the migration to the migrations table of `ARCHITECTURE.md` (`tests/test_docs_consistency.py`).
- A migration that moves or rewrites data comes with a test in `tests/test_timescale_integration.py`, run on a real TimescaleDB (`make test-db`).
- Write `downgrade()` too: the integration tests go down and up again.
