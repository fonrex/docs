---
id: "configuration"
title: "Configuration système"
sidebar_label: "Configuration"
description: "Référence des paramètres de Fonrex lus dans .env"
---

# Configuration système

Fonrex lit ses paramètres dans des variables d'environnement. Copiez `.env.example` vers `.env` et modifiez-le : Docker Compose charge `.env` dans le conteneur de l'API, et `make run` le charge pour une exécution locale.

Gardez un seul `KEY=value` par ligne et placez les commentaires sur leur propre ligne : un commentaire écrit après une valeur vide est lu comme la valeur.

## Authentification

| Variable | Défaut | Description |
|---|---|---|
| `FONREX_API_KEY` | *(vide)* | Clé à accès complet. Générez-en une avec `echo "frx_live_$(openssl rand -hex 24)"` |
| `FONREX_API_KEYS` | *(vide)* | Clés à accès complet supplémentaires, séparées par des virgules |
| `FONREX_READ_ONLY_API_KEYS` | *(vide)* | Clés en lecture seule, séparées par des virgules : elles lisent les données mais ne peuvent ni vider le cache, ni nettoyer la base de données, ni déclencher une ingestion, ni modifier les abonnements |
| `FONREX_AUTH_REQUIRED` | `true` | `false` ouvre toutes les routes, **uniquement** quand aucune clé n'est configurée. Ne l'utilisez que pour une instance inaccessible depuis tout réseau |

Les clients envoient une clé sous la forme `Authorization: Bearer <key>` ou `X-API-KEY: <key>`. Voir [Premier appel d'API](first-api-call.md).

## Base de données et cache

| Variable | Défaut | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://fonrex:fonrex_password@localhost:5432/fonrex` | Adresse pour une exécution locale. Avec Docker Compose, elle est remplacée par l'adresse du service `db`, construite à partir de `POSTGRES_PASSWORD` |
| `ASYNC_DATABASE_URL` | *(vide)* | Adresse asyncpg ; déduite de `DATABASE_URL` si elle est vide (Docker Compose la vide) |
| `POSTGRES_DB` / `POSTGRES_USER` | `fonrex` | Conservées pour les outils locaux ; `docker-compose.yml` utilise des valeurs fixes (utilisateur `fonrex`, base `fonrex` créée par `postgres-init.sh`) |
| `POSTGRES_PASSWORD` | `fonrex_password` | Changez-le avant le premier démarrage (lettres, chiffres, `-`, `_`) |
| `REDIS_URL` | `redis://localhost:6379/0` | Remplacée par l'adresse du service `redis` avec Docker Compose |
| `CACHE_TTL` | `300` | Durée de vie Redis par défaut, en secondes (chaque catégorie mise en cache a sa propre durée de vie, listée par `GET /cache/stats`) |
| `WEB_CONCURRENCY` | `1` | Workers Gunicorn (Docker Compose). Gardez `1` : le worker temps réel et le canary quotidien vivent dans le processus de l'API |

## Ingestion historique

| Variable | Défaut | Description |
|---|---|---|
| `INGEST_CONCURRENCY` | `5` | Ingestions parallèles d'une ingestion en masse dont l'appelant ne fournit pas de `concurrency` |
| `INGEST_YF_DELAY` | `0.5` | Pause en secondes avant de se rabattre sur TradingView |
| `INGEST_TV_DELAY` | `2.0` | Lue mais non utilisée par le code actuel |
| `INGEST_BATCH_SIZE` | `1000` | Lignes par upsert en base de données |

## Streaming temps réel

| Variable | Défaut | Description |
|---|---|---|
| `TV_MAX_CONNECTIONS` | `10` | Connexions WebSocket TradingView simultanées |
| `TV_RECONNECT_DELAY` | `5` | Premier délai de reconnexion en secondes, doublé jusqu'à 60 |
| `REALTIME_QUOTE_TTL` | `60` | Durée de vie d'un instantané de cours dans Redis, en secondes |

## Indicateurs techniques

| Variable | Défaut | Description |
|---|---|---|
| `TECHNICAL_CACHE_ENABLED` | `true` | Met en cache les résultats des indicateurs dans Redis |
| `TECHNICAL_DEFAULT_LIMIT` | `500` | Barres chargées quand une requête ne donne pas de limite (10 à 5000) |
| `TECHNICAL_MAX_BATCH_TICKERS` | `20` | Tickers acceptés par `POST /technical/batch` |
| `TECHNICAL_MAX_BATCH_INDICATORS` | `10` | Indicateurs acceptés par `POST /technical/batch` |

## Actualités

| Variable | Défaut | Description |
|---|---|---|
| `NEWS_CACHE_TTL` | `1800` | Durée de vie d'une réponse d'actualités dans Redis, en secondes |
| `NEWS_DEFAULT_LIMIT` | `20` | Articles renvoyés pour un ticker quand la requête ne donne pas de limite |
| `NEWS_MAX_LIMIT` | `100` | Limite la plus élevée qu'une requête peut demander |
| `NEWS_DEDUP_SIMILARITY` | `0.85` | Similarité de titre au-delà de laquelle deux articles n'en font qu'un |

## Valorisation (DCF) et taux macroéconomiques

| Variable | Défaut | Description |
|---|---|---|
| `DCF_CACHE_TTL` | `21600` | Durée de vie d'une réponse DCF dans Redis (6 h) |
| `DCF_DEFAULT_PROJECTION_YEARS` | `5` | Années de projection (3 à 10) |
| `DCF_RISK_FREE_RATE` | `0.04` | Taux sans risque, en ratio, quand la source de la devise des états financiers (FRED pour l'USD, la BCE pour l'EUR) n'en donne aucun, et pour toute autre devise |
| `DCF_EQUITY_RISK_PREMIUM` | `0.055` | Prime de risque actions, sous forme de ratio |
| `DCF_TERMINAL_GROWTH_RATE` | `0.025` | Taux de croissance terminal, sous forme de ratio |
| `FRED_API_KEY` | *(vide)* | Clé gratuite de fred.stlouisfed.org pour le taux américain ; sans elle, le taux enregistré ou `DCF_RISK_FREE_RATE` est utilisé |
| `MACRO_RATES_CACHE_TTL` | `21600` | Durée de vie des taux macroéconomiques (FRED et BCE) dans Redis (6 h) |
| `ECB_API_URL` | `https://data-api.ecb.europa.eu/service/data` | Portail de données de la BCE (taux en euros, gratuit, sans clé) ; à définir seulement pour utiliser un miroir |

## Facteurs et taux de change {#factors-and-exchange-rates}

| Variable | Défaut | Description |
|---|---|---|
| `FACTORS_REFRESH_DAYS` | `7` | Jours avant qu'un fichier de facteurs Fama/French soit retéléchargé (1 à 90) |
| `FRENCH_LIBRARY_URL` | `https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp` | Kenneth French Data Library (gratuite, sans clé) ; à définir seulement pour utiliser un miroir |
| `FX_RATES_REFRESH_HOURS` | `12` | Heures avant que les cours de change BCE d'une devise soient redemandés (1 à 720) |

## Surveillance des fournisseurs

| Variable | Défaut | Description |
|---|---|---|
| `VALIDATION_OUTLIER_THRESHOLD` | `0.50` | Écart à la médiane au-delà duquel une valeur est aberrante |
| `VALIDATION_MIN_PROVIDERS` | `2` | Fournisseurs nécessaires pour une vérification par consensus |
| `CANARY_RUN_HOUR` | `6` | Heure UTC de l'exécution quotidienne du canary |
| `CANARY_PROVIDER_SEMAPHORE` | `3` | Fournisseurs vérifiés en parallèle par le canary |
| `CANARY_PRICE_RANGE_TTL_SECONDS` | `21600` | Validité d'une plage de prix dynamique (6 h) |
| `CANARY_PRICE_RANGE_NEGATIVE_TTL_SECONDS` | `300` | Délai avant nouvel essai quand une plage n'a pas pu être calculée |
| `ALERT_CANARY_CRITICAL` | `3` | Échecs du canary qui déclenchent une alerte critique |
| `ALERT_SUCCESS_RATE_CRITICAL` | `0.70` | Taux de succès en dessous duquel une alerte est critique |
| `ALERT_SUCCESS_RATE_WARNING` | `0.85` | Taux de succès en dessous duquel une alerte est un avertissement |

## Fournisseurs et requêtes sortantes

| Variable | Défaut | Description |
|---|---|---|
| `SEC_EDGAR_EMAIL` | `contact@fonrex.io` | Adresse de contact envoyée à SEC EDGAR (exigée par la politique de la SEC) : mettez la vôtre |
| `OPENFIGI_API_KEY` | *(vide)* | Clé OpenFIGI facultative (limite de débit plus élevée) |
| `BARRONS_TOKEN`, `MARKETWATCH_TOKEN`, `WSJ_TOKEN` | *(vide)* | Jetons facultatifs de ces sites web |
| `FONREX_PROVIDER_MAX_CONCURRENCY` | `4` | Requêtes qu'un fournisseur peut exécuter en même temps (1 à 64) |
| `FONREX_PROXY_URL` | *(vide)* | Proxy HTTP sortant facultatif pour les sites web scrapés (pas pour yfinance ni TradingView) |
| `FONREX_PROXY_PROVIDERS` | *(vide)* | Fournisseurs qui utilisent le proxy, séparés par des virgules ; vide signifie tous |
| `LOGO_TOKEN` | *(vide)* | Jeton pour le téléchargement des logos depuis img.logo.dev |

## Journal d'utilisation et démarrage

| Variable | Défaut | Description |
|---|---|---|
| `USAGE_LOG_IP` | `none` | Part de l'IP de l'appelant conservée dans `usage_logs` : `none`, `truncated` (réseau uniquement) ou `full` |
| `USAGE_LOG_RETENTION_DAYS` | `90` | Jours de journal d'utilisation conservés ; `0` conserve tout |
| `SEED_ON_FIRST_RUN` | `false` | Importe `data/etf.csv` au premier démarrage quand la base de données est vide |
| `OPENBB_ALLOWED_ORIGIN` | `https://pro.openbb.co` | Origines autorisées par CORS, séparées par des virgules |
