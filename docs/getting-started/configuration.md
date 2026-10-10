---
id: "configuration"
title: "System Configuration"
sidebar_label: "Configuration"
description: "Reference of the Fonrex settings read from .env"
---

# System Configuration

Fonrex reads its settings from environment variables. Copy `.env.example` to `.env` and edit it: Docker Compose loads `.env` into the API container, and `make run` loads it for a local run.

Keep one `KEY=value` per line and put comments on their own lines — a comment written after an empty value is read as the value.

## Authentication

| Variable | Default | Description |
|---|---|---|
| `FONREX_API_KEY` | *(empty)* | Full-access API key. Generate one with `echo "frx_live_$(openssl rand -hex 24)"` |
| `FONREX_API_KEYS` | *(empty)* | Additional full-access keys, comma-separated |
| `FONREX_READ_ONLY_API_KEYS` | *(empty)* | Read-only keys, comma-separated: they read data but cannot clear the cache, clean the database, trigger ingestion or change subscriptions |
| `FONREX_AUTH_REQUIRED` | `true` | `false` opens every route, **only** when no key is configured. Use it only for an instance reachable from no network |

Clients send a key as `Authorization: Bearer <key>` or `X-API-KEY: <key>`. See [First API call](first-api-call.md).

## Database and cache

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://fonrex:fonrex_password@localhost:5432/fonrex` | Address for a local run. With Docker Compose it is replaced by the `db` service address, built from `POSTGRES_PASSWORD` |
| `ASYNC_DATABASE_URL` | *(empty)* | asyncpg address; derived from `DATABASE_URL` when empty (Docker Compose empties it) |
| `POSTGRES_DB` / `POSTGRES_USER` | `fonrex` | Kept for local tools; `docker-compose.yml` uses fixed values (user `fonrex`, database `fonrex` created by `postgres-init.sh`) |
| `POSTGRES_PASSWORD` | `fonrex_password` | Change it before the first start (letters, digits, `-`, `_`) |
| `REDIS_URL` | `redis://localhost:6379/0` | Replaced by the `redis` service address with Docker Compose |
| `CACHE_TTL` | `300` | Default Redis lifetime in seconds (each cached category has its own lifetime, listed by `GET /cache/stats`) |
| `WEB_CONCURRENCY` | `1` | Gunicorn workers (Docker Compose). Keep `1`: the realtime worker and the daily canary live in the API process |

## Historical ingestion

| Variable | Default | Description |
|---|---|---|
| `INGEST_CONCURRENCY` | `5` | Parallel ingestions of a bulk ingestion whose caller gives no `concurrency` |
| `INGEST_YF_DELAY` | `0.5` | Pause in seconds before falling back to TradingView |
| `INGEST_TV_DELAY` | `2.0` | Read but not used by the current code |
| `INGEST_BATCH_SIZE` | `1000` | Rows per database upsert |

## Real-time streaming

| Variable | Default | Description |
|---|---|---|
| `TV_MAX_CONNECTIONS` | `10` | Simultaneous TradingView WebSocket connections |
| `TV_RECONNECT_DELAY` | `5` | First reconnection delay in seconds, doubled up to 60 |
| `REALTIME_QUOTE_TTL` | `60` | Lifetime of a quote snapshot in Redis, in seconds |

## Technical indicators

| Variable | Default | Description |
|---|---|---|
| `TECHNICAL_CACHE_ENABLED` | `true` | Cache indicator results in Redis |
| `TECHNICAL_DEFAULT_LIMIT` | `500` | Bars loaded when a request gives no limit (10 to 5000) |
| `TECHNICAL_MAX_BATCH_TICKERS` | `20` | Tickers accepted by `POST /technical/batch` |
| `TECHNICAL_MAX_BATCH_INDICATORS` | `10` | Indicators accepted by `POST /technical/batch` |

## News

| Variable | Default | Description |
|---|---|---|
| `NEWS_CACHE_TTL` | `1800` | Lifetime of a news answer in Redis, in seconds |
| `NEWS_DEFAULT_LIMIT` | `20` | Articles returned for a ticker when the request gives no limit |
| `NEWS_MAX_LIMIT` | `100` | Largest limit a request may ask for |
| `NEWS_DEDUP_SIMILARITY` | `0.85` | Title similarity above which two articles are one |

## Valuation (DCF) and macro rates

| Variable | Default | Description |
|---|---|---|
| `DCF_CACHE_TTL` | `21600` | Lifetime of a DCF answer in Redis (6 h) |
| `DCF_DEFAULT_PROJECTION_YEARS` | `5` | Projection years (3 to 10) |
| `DCF_RISK_FREE_RATE` | `0.04` | Risk-free rate, as a ratio, when the source of the currency of the statements (FRED for USD, the ECB for EUR) gives none, and for every other currency |
| `DCF_EQUITY_RISK_PREMIUM` | `0.055` | Equity risk premium, as a ratio |
| `DCF_TERMINAL_GROWTH_RATE` | `0.025` | Terminal growth rate, as a ratio |
| `FRED_API_KEY` | *(empty)* | Free key from fred.stlouisfed.org for the US rate; without it the stored rate or `DCF_RISK_FREE_RATE` is used |
| `MACRO_RATES_CACHE_TTL` | `21600` | Lifetime of the macro rates (FRED and ECB) in Redis (6 h) |
| `ECB_API_URL` | `https://data-api.ecb.europa.eu/service/data` | ECB Data Portal (euro rates, free, no key); set only to use a mirror |

## Provider monitoring

| Variable | Default | Description |
|---|---|---|
| `VALIDATION_OUTLIER_THRESHOLD` | `0.50` | Deviation from the median above which a value is an outlier |
| `VALIDATION_MIN_PROVIDERS` | `2` | Providers needed for a consensus check |
| `CANARY_RUN_HOUR` | `6` | UTC hour of the daily canary run |
| `CANARY_PROVIDER_SEMAPHORE` | `3` | Providers checked in parallel by the canary |
| `CANARY_PRICE_RANGE_TTL_SECONDS` | `21600` | Validity of a dynamic price range (6 h) |
| `CANARY_PRICE_RANGE_NEGATIVE_TTL_SECONDS` | `300` | Retry delay after a range could not be computed |
| `ALERT_CANARY_CRITICAL` | `3` | Canary failures that raise a critical alert |
| `ALERT_SUCCESS_RATE_CRITICAL` | `0.70` | Success rate under which an alert is critical |
| `ALERT_SUCCESS_RATE_WARNING` | `0.85` | Success rate under which an alert is a warning |

## Providers and outbound requests

| Variable | Default | Description |
|---|---|---|
| `SEC_EDGAR_EMAIL` | `contact@fonrex.io` | Contact address sent to SEC EDGAR (required by the SEC policy): put your own |
| `OPENFIGI_API_KEY` | *(empty)* | Optional OpenFIGI key (higher rate limit) |
| `BARRONS_TOKEN`, `MARKETWATCH_TOKEN`, `WSJ_TOKEN` | *(empty)* | Optional tokens of these websites |
| `FONREX_PROVIDER_MAX_CONCURRENCY` | `4` | Requests one provider may run at the same time (1 to 64) |
| `FONREX_PROXY_URL` | *(empty)* | Optional outbound HTTP proxy for the scraped websites (not for yfinance or TradingView) |
| `FONREX_PROXY_PROVIDERS` | *(empty)* | Providers that use the proxy, comma-separated; empty means all |
| `LOGO_TOKEN` | *(empty)* | Token for logo downloads from img.logo.dev |

## Usage log and start-up

| Variable | Default | Description |
|---|---|---|
| `USAGE_LOG_IP` | `none` | Part of the caller's IP kept in `usage_logs`: `none`, `truncated` (network only) or `full` |
| `USAGE_LOG_RETENTION_DAYS` | `90` | Days of usage log kept; `0` keeps everything |
| `SEED_ON_FIRST_RUN` | `false` | Import `data/etf.csv` at the first start when the database is empty |
| `OPENBB_ALLOWED_ORIGIN` | `https://pro.openbb.co` | Origins allowed by CORS, comma-separated |
