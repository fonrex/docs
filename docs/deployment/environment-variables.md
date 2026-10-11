---
id: "environment-variables"
title: "Environment Variables Deployment Reference"
sidebar_label: "Environment Variables"
description: "The settings that matter when deploying Fonrex, and how .env reaches the containers"
---

# Environment Variables Deployment Reference

Every setting is described in [Configuration](../getting-started/configuration.md). This page covers what matters for a deployment.

## How `.env` reaches the containers

- `docker-compose.yml` loads `.env` into the API container (`env_file`).
- It then **overrides** the service addresses written for a local run: `DATABASE_URL` (built from `POSTGRES_PASSWORD`, host `db`), `REDIS_URL` (host `redis`) and `ASYNC_DATABASE_URL` (emptied, so it is derived from `DATABASE_URL`). It also sets `WEB_CONCURRENCY` and clears `HTTP_PROXY` / `HTTPS_PROXY`.
- `.env` is never copied into the image.
- One `KEY=value` per line; a comment after an empty value is read as the value.

Every variable of `.env.example` is read by the code (`tests/test_env_settings.py`); an invalid value falls back to its default with a warning instead of stopping the API.

## Must be set

| Variable | Why |
|---|---|
| `FONREX_API_KEY` | Without a key, every protected route answers `401` |
| `FONREX_READ_ONLY_API_KEYS` | Keys for clients outside the machine (Sheets, dashboards) |
| `POSTGRES_PASSWORD` | Before the first start; stored in the volume at initialisation |
| `SEC_EDGAR_EMAIL` | Your contact address: the SEC refuses anonymous automated clients |

## Never in production

| Setting | Why |
|---|---|
| `FONREX_AUTH_REQUIRED=false` | Opens every route, including cache and database administration (only effective when no key is configured) |
| `WEB_CONCURRENCY` > 1 | Duplicates realtime streams and the daily canary |
| `USAGE_LOG_IP=full` | Keeps full caller IP addresses in `usage_logs`; prefer `none` or `truncated` |

## Often adjusted

| Variable | Default | When |
|---|---|---|
| `FRED_API_KEY` | *(empty)* | Live US risk-free rate for the DCF (the euro rate comes from the ECB without key) |
| `FONREX_PROXY_URL`, `FONREX_PROXY_PROVIDERS` | *(empty)* | Websites refusing your server's IP |
| `FONREX_PROVIDER_MAX_CONCURRENCY` | `4` | Fewer simultaneous requests per website |
| `OPENBB_ALLOWED_ORIGIN` | `https://pro.openbb.co` | Another OpenBB origin (CORS) |
| `USAGE_LOG_RETENTION_DAYS` | `90` | Usage log retention |
| `CANARY_RUN_HOUR` | `6` | Hour (UTC) of the daily provider check |
