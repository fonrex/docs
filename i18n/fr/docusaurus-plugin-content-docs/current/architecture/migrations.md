---
id: "migrations"
title: "Migrations du schéma (Alembic)"
sidebar_label: "Migrations du schéma"
description: "La chaîne de migrations Alembic, son exécution et l'ajout d'une migration"
---

# Migrations du schéma (Alembic)

Alembic est maître du schéma, y compris les hypertables TimescaleDB, la compression et les agrégats continus. La chaîne est linéaire, avec une seule tête.

## Historique des migrations

| Révision | Fichier | Modifications |
|---|---|---|
| 001 | `001_initial_schema.py` | Schéma initial : `assets` (index unique sur l'ISIN), `asset_listings`, `asset_mappings`, `prices_eod`, `fundamentals`, `usage_logs`, et les anciennes tables `stock_data`, `data_requests`, `cache_status` |
| 002 | `002_refonte_fundamentals.py` | `fundamentals_highlights`, `financial_statements`, `earnings_history`, `analyst_ratings`, `etf_details`, `etf_holdings` |
| 003 | `003_index_constituents.py` | Table `index_constituents` (non utilisée par le code) |
| 004 | `004_fix_assets_columns.py` | Colonnes de profil de `assets` |
| 005 | `005_premium_fields.py` | Colonnes de positions vendeuses, TTM et croissance ; colonnes GICS ; `earnings_trend`, `esg_scores`, `outstanding_shares_history` |
| 006 | `006_prices_eod_resolution.py` | `resolution`, `adjusted`, `source` sur `prices_eod` ; `ingest_log` |
| 007 | `007_realtime_tables.py` | Hypertable `prices_intraday` (rétention de 30 jours), `realtime_subscriptions` |
| 008 | `008_drop_legacy_tables.py` | **Destructive** : supprime les anciennes tables de prix |
| 009 | `009_fix_assets_isin_unique.py` | Fusionne les doublons d'ISIN, index unique sur l'ISIN et contrainte d'identité des cotations |
| 010 | `010_news_articles.py` | `news_articles` (`url` unique) |
| 011 | `011_provider_health.py` | Hypertable `provider_health_log`, `provider_health_daily`, `provider_alerts` |
| 012 | `012_alembic_schema_authority.py` | Alembic prend en charge les hypertables, la compression et les agrégats hebdomadaires/mensuels |
| 013 | `013_solvency_ratios.py` | Ratios de solvabilité et coût de la dette ; `macro_rates_cache` |
| 014 | `014_prices_per_listing.py` | `prices_eod` reconstruite par cotation : clé `(asset_listing_id, resolution, time)`, lignes redatées à leur séance ; compression et agrégats par cotation |
| 015 | `015_dividend_yield_as_ratio.py` | Rendements du dividende enregistrés convertis de pourcentages en ratios |
| 016 | `016_price_series_adjustments.py` | `price_series_adjustments` : comment chaque série de prix enregistrée est ajustée et quand elle a été récupérée d'un seul tenant pour la dernière fois. Les séries enregistrées avant sont récupérées de nouveau en entier à leur prochaine ingestion |
| 017 | `017_macro_rates_source.py` | `macro_rates_cache` contient les séries de plusieurs sources : `series_id` plus long, nouvelle colonne `source` (`fred`, `ecb`) |
| 018 | `018_statements_currency_unknown.py` | `financial_statements.currency` perd sa valeur par défaut `USD` ; les lignes enregistrées deviennent inconnues (`NULL`) jusqu'au prochain enrichissement approfondi, qui enregistre la devise de Yahoo |
| 019 | `019_yahoo_epoch_dates.py` | `dividend_ex_date` et `shares_short_date` égales au 1970-01-01 (secondes de Yahoo lues comme des nanosecondes) deviennent `NULL` |

## Exécution des migrations

1. Le conteneur de l'API exécute `alembic upgrade head` dans `entrypoint.sh` avant de démarrer l'application. Le service `fonrex-migrate` (profil `migrate`) fait la même chose seul.
2. `main.py` compare la révision enregistrée dans `alembic_version` avec la tête. Une base en retard sur le code est marquée indisponible et les routes qui en ont besoin répondent `503` : l'application ne modifie jamais le schéma elle-même.

La migration 014 supprime d'abord les jobs TimescaleDB des tables de prix (en attendant la fin de celui qui tourne) et verrouille `prices_eod` : sinon, un job de compression ou de rafraîchissement exécuté en même temps provoquerait un interblocage. La migration recrée ensuite les jobs.

## Ajouter une migration

```bash
alembic revision -m "describe_the_change"
```

Renommez le nouveau fichier de `alembic/versions/` et placez ses identifiants après la dernière migration (`revision = "020"`, `down_revision = "019"`, fichier `020_describe_the_change.py`), puis :

```bash
alembic upgrade head
make migration-check     # one head only
```

- Ajoutez la migration au tableau des migrations de `ARCHITECTURE.md` (`tests/test_docs_consistency.py`).
- Une migration qui déplace ou réécrit des données s'accompagne d'un test dans `tests/test_timescale_integration.py`, exécuté sur un vrai TimescaleDB (`make test-db`).
- Écrivez aussi `downgrade()` : les tests d'intégration redescendent puis remontent.
