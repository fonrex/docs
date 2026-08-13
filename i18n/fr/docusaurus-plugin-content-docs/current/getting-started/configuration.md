---
id: "configuration"
title: "Configuration système"
sidebar_label: "Configuration"
description: "Référence complète des variables d'environnement et paramètres de Fonrex"
---


# Configuration système

Fonrex se configure à l'aide des variables d'environnement définies dans `.env`. Ci-dessous se trouve le tableau complet des variables prises en charge par sous-système.

## Base de Données & Cache

| Variable | Valeur par Défaut | Requis | Description |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://fonrex:fonrex_password@localhost:5432/fonrex` | ✅ | Chaîne de connexion principale PostgreSQL/TimescaleDB |
| `ASYNC_DATABASE_URL` | Auto-derived from `DATABASE_URL` | ❌ | Chaîne de connexion AsyncPG pour les workers asynchrones |
| `POSTGRES_DB` | `fonrex` | ✅ | Nom de la base de données PostgreSQL |
| `POSTGRES_USER` | `fonrex` | ✅ | Nom d'utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | `fonrex_password` | ✅ | Mot de passe PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379/0` | ✅ | URL de l'instance Redis |
| `CACHE_TTL` | `300` | ❌ | Défaut API cache TTL in seconds (5 minutes) |

## Providers de Données Spécialisés

| Variable | Valeur par Défaut | Requis | Description |
|---|---|---|---|
| `OPENFIGI_API_KEY` | `""` | ❌ | Clé API OpenFIGI optionnelle pour des limites de requêtes supérieures |
| `SEC_EDGAR_EMAIL` | `contact@fonrex.io` | ✅ | E-mail de contact envoyé dans l'en-tête HTTP User-Agent vers la SEC EDGAR |

## Ingestion Historique

| Variable | Valeur par Défaut | Requis | Description |
|---|---|---|---|
| `INGEST_CONCURRENCY` | `5` | ❌ | Nombre de threads workers parallèles pendant l'ingestion en masse |
| `INGEST_YF_DELAY` | `0.5` | ❌ | Délai en secondes entre deux requêtes consécutives vers Yahoo Finance |
| `INGEST_TV_DELAY` | `2.0` | ❌ | Délai en secondes entre les requêtes historiques TradingView |
| `INGEST_BATCH_SIZE` | `1000` | ❌ | Taille de lot pour les instructions SQL `INSERT ... ON CONFLICT` |

## Streaming Temps Réel

| Variable | Valeur par Défaut | Requis | Description |
|---|---|---|---|
| `TV_MAX_CONNECTIONS` | `10` | ❌ | Nombre maximum de connexions WebSocket simultanées vers TradingView |
| `TV_RECONNECT_DELAY` | `5` | ❌ | Délai initial de reconnexion en secondes (backoff exponentiel) |
| `REALTIME_QUOTE_TTL` | `60` | ❌ | TTL Redis pour les snapshots de cotation en temps réel (secondes) |
| `REALTIME_AUTO_SUBSCRIBE` | `true` | ❌ | Démarrer automatiquement le stream WebSocket lors de la requête `/quote/{ticker}` |

## Indicateurs Techniques

| Variable | Valeur par Défaut | Requis | Description |
|---|---|---|---|
| `TECHNICAL_CACHE_ENABLED` | `true` | ❌ | Activer le cache Redis pour le calcul des indicateurs techniques |
| `TECHNICAL_DEFAULT_LIMIT` | `500` | ❌ | Nombre de bougies récupérées par défaut pour les calculs d'indicateurs |
| `TECHNICAL_MAX_BATCH_TICKERS` | `20` | ❌ | Nombre maximum de tickers par requête `/technical/batch` |
| `TECHNICAL_MAX_BATCH_INDICATORS` | `10` | ❌ | Nombre maximum d'indicateurs par requête `/technical/batch` |

## Agrégateur d'Actualités

| Variable | Valeur par Défaut | Requis | Description |
|---|---|---|---|
| `NEWS_CACHE_TTL` | `1800` | ❌ | TTL Redis pour les résultats du flux d'actualités en secondes (30 min) |
| `NEWS_DEFAULT_LIMIT` | `20` | ❌ | Limite d'articles par défaut par requête d'actualités |
| `NEWS_MAX_LIMIT` | `100` | ❌ | Nombre maximum d'articles autorisés par requête |
| `NEWS_PROVIDERS_TIMEOUT` | `10` | ❌ | Timeout global des requêtes de scraping providers en secondes |
| `NEWS_DEDUP_SIMILARITY` | `0.85` | ❌ | Seuil de similarité SequenceMatcher pour la déduplication des titres |

## Valorisation (DCF)

| Variable | Valeur par Défaut | Requis | Description |
|---|---|---|---|
| `DCF_CACHE_TTL` | `21600` | ❌ | TTL Redis pour les valorisations DCF en secondes (6 heures) |
| `DCF_DEFAULT_PROJECTION_YEARS` | `5` | ❌ | Défaut cash flow projection window in years |
| `DCF_RISK_FREE_RATE` | `0.04` | ❌ | Défaut risk-free rate (e.g. 4.0% US 10Y Treasury) |
| `DCF_EQUITY_RISK_PREMIUM` | `0.055` | ❌ | Défaut equity risk premium (5.5%) |
| `DCF_TERMINAL_GROWTH_RATE` | `0.025` | ❌ | Défaut terminal growth rate (2.5%) |

## Monitoring de Providers & Health

| Variable | Valeur par Défaut | Requis | Description |
|---|---|---|---|
| `VALIDATION_OUTLIER_THRESHOLD` | `0.50` | ❌ | Seuil de déviation de consensus (50%) pour marquer les outliers |
| `VALIDATION_MIN_PROVIDERS` | `2` | ❌ | Nombre minimum de providers en accord requis pour le consensus |
| `CANARY_RUN_HOUR` | `6` | ❌ | Heure quotidienne UTC pour déclencher la suite Canary (0-23) |
| `CANARY_PROVIDER_SEMAPHORE` | `3` | ❌ | Limite de concurrence pour les contrôles canary |
| `ALERT_CANARY_CRITICAL` | `3` | ❌ | Échecs consécutifs des contrôles canary avant alerte critique |
| `ALERT_SUCCESS_RATE_CRITICAL` | `0.70` | ❌ | Seuil du taux de succès provider pour alerte critique |
| `ALERT_SUCCESS_RATE_WARNING` | `0.85` | ❌ | Seuil du taux de succès provider pour alerte d'avertissement |
