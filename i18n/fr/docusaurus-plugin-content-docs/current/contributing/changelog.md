---
id: "changelog"
title: "Historique des Versions de Fonrex"
sidebar_label: "Changelog"
description: "Historique du projet, ajouts de fonctionnalités, migrations de schéma et mises à jour de version"
---


# Historique des Versions de Fonrex

## v1.6.0 (2026-09)

### Fonctionnalités Majeures
- **Intégration OpenBB Workspace** : Routeur d'adaptateurs backend natif (`/openbb`) prenant en charge 19 widgets interactifs et 2 applications pré-configurées (`Fonrex — EU Markets` & `Fonrex — Screener & Macro`).
- **Authentification Double En-tête** : Prise en charge de l'en-tête personnalisé natif d'OpenBB `X-API-KEY` aux côtés du jeton standard `Authorization: Bearer` (`auth/dependencies.py`).
- **Adaptateurs Plotly & AgGrid** : Normalisation des données pour figures Plotly (chandeliers, indicateurs surimposés) et tableaux AgGrid (fondamentaux approfondis, matrice de sensibilité DCF, actualités, composants d'indices).

### 🐛 Correctifs & Améliorations
- **Logging des Volumes Docker** : Résolution des erreurs de permission sur les volumes hôtes via l'étape `mkdir -p logs` et ajout des guides de dépannage.
- **Mises à Jour DCF & Fournisseurs** : Amélioration du cache et de la normalisation pour les modèles d'évaluation DCF et les composants d'indices.

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
