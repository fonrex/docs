---
id: "changelog"
title: "Historique des Versions de Fonrex"
sidebar_label: "Changelog"
description: "Historique du projet, ajouts de fonctionnalités, migrations de schéma et mises à jour de version"
---


# Historique des Versions de Fonrex

## v2.0.0 (2026-08)

### Major Fonctionnalités
- **Docusaurus v3 Documentation Suite**: Complete technical documentation structure generated under `documentation/`.
- **Provider Health Monitoring (Phase 12)**: Implemented `ValidationLayer`, `CanaryMonitor`, `provider_health_log` TimescaleDB hypertable, daily consensus aggregation, and 7 REST health endpoints (`/health/*`).
- **Valuation & DCF Engine (Phase 11)**: Integrated FCF, EPS, and DDM intrinsic value models with dynamic WACC calculation and sensitivity matrices (`/dcf/*`).
- **Agrégateur d'Actualités (Phase 10)**: Multi-provider scraping engine (`NewsService`) across 7 sources with `ON CONFLICT (url)` deduplication and Redis caching (`/news/*`).
- **ISIN Asset Architecture (Phase 9)**: Refactored asset database schema into `assets`, `asset_listings`, and `asset_mappings` with partial unique ISIN index.

### 🐛 Bug Fixes & Refactoring
- Legacy codebase cleanup (`eod/`, `record/`, `seed_assets.py` purged).
- Standalone ISIN deduplication tool `scripts/clean_isin_duplicates.py`.
- Thread pool executor concurrency boundaries via `concurrency.py`.
