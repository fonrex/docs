---
id: "changelog"
title: "Fonrex Version Changelog"
sidebar_label: "Changelog"
description: "Project history, feature additions, schema migrations, and version updates"
---

# Fonrex Version Changelog

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
