---
id: "configuration"
title: "System Configuration"
sidebar_label: "Configuration"
description: "Complete reference of Fonrex environment variables and runtime settings"
---

# System Configuration

Fonrex is configured using environment variables specified in `.env`. Below is the complete table of supported variables categorized by application subsystem.

## Database & Cache

| Variable | Default Value | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://fonrex:fonrex_password@localhost:5432/fonrex` | ✅ | Primary PostgreSQL/TimescaleDB connection string |
| `ASYNC_DATABASE_URL` | Auto-derived from `DATABASE_URL` | ❌ | AsyncPG connection string for asynchronous workers |
| `POSTGRES_DB` | `fonrex` | ✅ | PostgreSQL database name |
| `POSTGRES_USER` | `fonrex` | ✅ | PostgreSQL username |
| `POSTGRES_PASSWORD` | `fonrex_password` | ✅ | PostgreSQL password |
| `REDIS_URL` | `redis://localhost:6379/0` | ✅ | Redis instance URL |
| `CACHE_TTL` | `300` | ❌ | Default API cache TTL in seconds (5 minutes) |

## Specialized Data Providers

| Variable | Default Value | Required | Description |
|---|---|---|---|
| `OPENFIGI_API_KEY` | `""` | ❌ | Optional OpenFIGI API key for higher rate limits |
| `SEC_EDGAR_EMAIL` | `contact@fonrex.io` | ✅ | Contact email sent in HTTP User-Agent header to SEC EDGAR |

## Historical Ingestion

| Variable | Default Value | Required | Description |
|---|---|---|---|
| `INGEST_CONCURRENCY` | `5` | ❌ | Number of parallel worker threads during bulk ingestion |
| `INGEST_YF_DELAY` | `0.5` | ❌ | Delay in seconds between consecutive Yahoo Finance requests |
| `INGEST_TV_DELAY` | `2.0` | ❌ | Delay in seconds between TradingView historical requests |
| `INGEST_BATCH_SIZE` | `1000` | ❌ | Batch size for SQL `INSERT ... ON CONFLICT` statements |

## Realtime Streaming

| Variable | Default Value | Required | Description |
|---|---|---|---|
| `TV_MAX_CONNECTIONS` | `10` | ❌ | Maximum simultaneous TradingView WebSocket connections |
| `TV_RECONNECT_DELAY` | `5` | ❌ | Initial reconnect delay in seconds (exponential backoff) |
| `REALTIME_QUOTE_TTL` | `60` | ❌ | Redis TTL for realtime quote snapshots in seconds |
| `REALTIME_AUTO_SUBSCRIBE` | `true` | ❌ | Automatically start WebSocket stream when requesting `/quote/{ticker}` |

## Technical Indicators

| Variable | Default Value | Required | Description |
|---|---|---|---|
| `TECHNICAL_CACHE_ENABLED` | `true` | ❌ | Enable Redis caching for technical indicator calculations |
| `TECHNICAL_DEFAULT_LIMIT` | `500` | ❌ | Default number of candles retrieved for indicator math |
| `TECHNICAL_MAX_BATCH_TICKERS` | `20` | ❌ | Maximum tickers per `/technical/batch` request |
| `TECHNICAL_MAX_BATCH_INDICATORS` | `10` | ❌ | Maximum indicators per `/technical/batch` request |

## News Aggregator

| Variable | Default Value | Required | Description |
|---|---|---|---|
| `NEWS_CACHE_TTL` | `1800` | ❌ | Redis TTL for news feed results in seconds (30 min) |
| `NEWS_DEFAULT_LIMIT` | `20` | ❌ | Default article limit per news query |
| `NEWS_MAX_LIMIT` | `100` | ❌ | Maximum allowed articles per request |
| `NEWS_PROVIDERS_TIMEOUT` | `10` | ❌ | Global timeout for provider scraping requests in seconds |
| `NEWS_DEDUP_SIMILARITY` | `0.85` | ❌ | SequenceMatcher similarity threshold for title deduplication |

## Valuation (DCF)

| Variable | Default Value | Required | Description |
|---|---|---|---|
| `DCF_CACHE_TTL` | `21600` | ❌ | Redis TTL for DCF valuations in seconds (6 hours) |
| `DCF_DEFAULT_PROJECTION_YEARS` | `5` | ❌ | Default cash flow projection window in years |
| `DCF_RISK_FREE_RATE` | `0.04` | ❌ | Default risk-free rate (e.g. 4.0% US 10Y Treasury) |
| `DCF_EQUITY_RISK_PREMIUM` | `0.055` | ❌ | Default equity risk premium (5.5%) |
| `DCF_TERMINAL_GROWTH_RATE` | `0.025` | ❌ | Default terminal growth rate (2.5%) |

## Provider Monitoring & Health

| Variable | Default Value | Required | Description |
|---|---|---|---|
| `VALIDATION_OUTLIER_THRESHOLD` | `0.50` | ❌ | Consensus deviation threshold (50%) to flag outliers |
| `VALIDATION_MIN_PROVIDERS` | `2` | ❌ | Minimum agreeing providers required for consensus check |
| `CANARY_RUN_HOUR` | `6` | ❌ | Daily UTC hour to trigger Canary health suite (0-23) |
| `CANARY_PROVIDER_SEMAPHORE` | `3` | ❌ | Concurrency limit for canary checks |
| `ALERT_CANARY_CRITICAL` | `3` | ❌ | Consecutive failed canary checks before critical alert |
| `ALERT_SUCCESS_RATE_CRITICAL` | `0.70` | ❌ | Provider success rate threshold for critical alert |
| `ALERT_SUCCESS_RATE_WARNING` | `0.85` | ❌ | Provider success rate threshold for warning alert |
