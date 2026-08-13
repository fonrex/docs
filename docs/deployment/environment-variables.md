---
id: "environment-variables"
title: "Environment Variables Deployment Reference"
sidebar_label: "Environment Variables"
description: "Comprehensive deployment reference for all environment variables used by python modules"
---

# Environment Variables Deployment Reference

Below is the complete inventory of environment variables referenced across all Fonrex Python modules (`os.getenv(...)`).

## 1. Database & Persistence

- `DATABASE_URL`: Full PostgreSQL connection URL.
- `ASYNC_DATABASE_URL`: AsyncPG driver connection URL (derived automatically if empty).
- `POSTGRES_DB`: PostgreSQL database name.
- `POSTGRES_USER`: PostgreSQL username.
- `POSTGRES_PASSWORD`: PostgreSQL password.

## 2. In-Memory Cache & Pub/Sub

- `REDIS_URL`: Connection string for Redis.
- `CACHE_TTL`: Global default cache TTL in seconds.

## 3. Web & Application Server

- `FLASK_ENV` / `ENVIRONMENT`: Environment mode (`production`, `development`).
- `SECRET_KEY`: Cryptographic signing secret.
- `PORT`: HTTP listener port (default `5000`).

## 4. Market Data & Streaming

- `TV_MAX_CONNECTIONS`: Max WebSocket connections to TradingView.
- `TV_RECONNECT_DELAY`: Initial delay for WebSocket reconnect backoff.
- `REALTIME_QUOTE_TTL`: Snapshot TTL in Redis.
- `REALTIME_AUTO_SUBSCRIBE`: Flag to enable auto-subscriptions on quote requests.

## 5. Indicator Calculation

- `TECHNICAL_CACHE_ENABLED`: Enable/disable Redis caching of indicator series.
- `TECHNICAL_DEFAULT_LIMIT`: Default OHLCV window size.
- `TECHNICAL_MAX_BATCH_TICKERS`: Max tickers per batch API call.
- `TECHNICAL_MAX_BATCH_INDICATORS`: Max indicators per batch call.

## 6. Provider Quality & Health

- `VALIDATION_OUTLIER_THRESHOLD`: Max allowed consensus deviation (e.g. `0.50`).
- `VALIDATION_MIN_PROVIDERS`: Minimum provider count for consensus calculation.
- `CANARY_RUN_HOUR`: Hour UTC to trigger daily canary checks (0-23).
- `CANARY_PROVIDER_SEMAPHORE`: Max parallel canary check workers.
