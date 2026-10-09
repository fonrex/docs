---
id: "changelog"
title: "Fonrex Version Changelog"
sidebar_label: "Changelog"
description: "Project history, feature additions, schema migrations, and version updates"
---

# Fonrex Version Changelog

## Next release

### Prices
- **`close` is the traded close again**, adjusted for splits only; **`adj_close`** is adjusted for splits and dividends. Before, both held the dividend-adjusted price.
- **One adjustment per series.** A split or a dividend after the last ingestion used to leave a false return where the stored and the new bars met (about minus the dividend yield, -75 % after a 4-for-1 split). The ingestion now compares the last stored bars with the source and fetches the whole series again when they differ. Migration 016 adds `price_series_adjustments`; series stored before are fetched again at their next ingestion (`scripts/ingest_all.py --force` for all at once).
- **`isin` parameter** on `GET /eod/{ticker}`, `GET /ticker/{symbol}/history` and `POST /historical/ingest`: names the instrument when several share a ticker. The answers give the `listing` they read.

## October 2026 — Secure defaults, per-listing prices, verified provider data

Merged on `main` on 8 October 2026 (pull request #15).

### ⚠️ Breaking changes
- **An API key is required by default.** Every route except `/health`, the documentation, `/widgets.json`, `/apps.json` and `/static` answers `401` until `FONREX_API_KEY` is set. `FONREX_AUTH_REQUIRED=false` only opens an instance with no key configured. New **read-only keys** (`FONREX_READ_ONLY_API_KEYS`) for clients outside the machine.
- **`GET /quote` and `GET /openbb/quote` no longer start a realtime stream.** Use `POST /realtime/subscribe`; `subscribe_if_missing=true` remains on `/quote` for full-access keys.
- **Prices are stored per listing** (migration 014): `prices_eod` is keyed by `(asset_listing_id, resolution, time)` and dated by trading session. The migration converts existing rows; back up before upgrading.
- **Dividend yields are ratios** everywhere, including stored values (migration 015).

### Security and operations
- Docker Compose loads `.env` and overrides the service addresses; PostgreSQL and Redis published on `127.0.0.1` only; database volume mounted on the right data directory.
- Usage log written in background batches, without the caller's IP by default (`USAGE_LOG_IP`), purged after `USAGE_LOG_RETENTION_DAYS`.
- `POST /database/cleanup` bounded (`days_to_keep` ≥ 30) with a `dry_run`.
- Redis cache entries are JSON only.

### Data quality
- Prices and fundamentals of a listing are fetched with a **Yahoo symbol verified** from the ISIN and the currency of the listing; a listing without one is not ingested, and the answer says why.
- Providers read the figures their pages really display (`financials/numbers.py`); percentages are normalised before validation; an answer about another ISIN is rejected.
- `/fundamental` builds each figure from Yahoo, then the stored figures, then the scraped providers, and names the source in a `Sources` section.
- Financial statements are read by fiscal year (DCF, solvency ratios).
- Every request parameter is part of its cache key (fundamentals, news, insider transactions, technical indicators per listing).
- The stored risk-free rate is refreshed from FRED; each realtime tick reaches each WebSocket client once.
- Migration 014 waits for running TimescaleDB jobs instead of deadlocking with them.

### Quality
- Locked, hash-checked dependencies; a coverage floor per module (global 70 %); database tests on TimescaleDB in the CI; guards keeping `ARCHITECTURE.md` and `AGENTS.md` in step with the code.


## v1.6.0 (2026-09)

### Major Features
- **OpenBB Workspace Integration**: Native backend adapter router (`/openbb`) supporting 19 interactive widgets and 2 pre-assembled application dashboards (`Fonrex — EU Markets` & `Fonrex — Screener & Macro`).
- **Dual Header Authentication**: Added support for OpenBB's native `X-API-KEY` custom header alongside standard `Authorization: Bearer` token validation (`auth/dependencies.py`).
- **Plotly & AgGrid Adapters**: Standardized data transformations for Plotly figures (candlestick charts, technical indicator overlays) and AgGrid tables (deep fundamentals, DCF sensitivity matrix, news, index constituents).

### 🐛 Bug Fixes & Improvements
- **Docker Volume Logging**: Solved volume permission issues on host environments by ensuring `mkdir -p logs` setup step and added permission troubleshooting guides.
- **DCF & Provider Updates**: Improved caching and data normalization for DCF valuation models and index constituent providers.

## v2.0.0 (2026-08)


### Major Features
- **Docusaurus v3 Documentation Suite**: Complete technical documentation structure generated under `documentation/`.
- **Provider Health Monitoring (Phase 12)**: Implemented `ValidationLayer`, `CanaryMonitor`, `provider_health_log` TimescaleDB hypertable, daily consensus aggregation, and 7 REST health endpoints (`/health/*`).
- **Valuation & DCF Engine (Phase 11)**: Integrated FCF, EPS, and DDM intrinsic value models with dynamic WACC calculation and sensitivity matrices (`/dcf/*`).
- **News Aggregator (Phase 10)**: Multi-provider scraping engine (`NewsService`) across 7 sources with `ON CONFLICT (url)` deduplication and Redis caching (`/news/*`).
- **ISIN Asset Architecture (Phase 9)**: Refactored asset database schema into `assets`, `asset_listings`, and `asset_mappings` with partial unique ISIN index.

### 🐛 Bug Fixes & Refactoring
- Legacy codebase cleanup (`eod/`, `record/`, `seed_assets.py` purged).
- Standalone ISIN deduplication tool `scripts/clean_isin_duplicates.py`.
- Thread pool executor concurrency boundaries via `concurrency.py`.
