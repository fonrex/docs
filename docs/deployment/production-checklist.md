---
id: "production-checklist"
title: "Production Deployment Checklist"
sidebar_label: "Production Checklist"
description: "Security, configuration, monitoring and backup checks before exposing an instance"
---

# Production Deployment Checklist

## Security
- [ ] `FONREX_API_KEY` set to a random key (`echo "frx_live_$(openssl rand -hex 24)"`); `FONREX_AUTH_REQUIRED` left at `true`.
- [ ] Read-only keys (`FONREX_READ_ONLY_API_KEYS`) for every client outside the machine: Google Sheets, dashboards, OpenBB.
- [ ] `POSTGRES_PASSWORD` changed before the first start.
- [ ] PostgreSQL and Redis published on `127.0.0.1` only (the default); the API reachable only through the reverse proxy.
- [ ] TLS on the reverse proxy, WebSocket upgrade forwarded for `/ws/`.
- [ ] `USAGE_LOG_IP` at `none` or `truncated`.
- [ ] `.env` and database dumps never committed.

## Configuration
- [ ] `SEC_EDGAR_EMAIL` set to your own contact address.
- [ ] `WEB_CONCURRENCY=1`.
- [ ] `FRED_API_KEY` set if you use the DCF.
- [ ] A proxy (`FONREX_PROXY_URL`) for the websites that refuse your server's IP, if needed.

## Data
- [ ] Instruments imported (`import_assets.py`) and prices ingested (`scripts/ingest_all.py`).
- [ ] `POST /database/cleanup` never run with the default `days_to_keep` (730) unless you mean to delete eight of the ten ingested years — count first with `dry_run`.
- [ ] Daily `pg_dump` backup of the whole database, restore tested once.

## Monitoring
- [ ] `/health` answers, `providers.unavailable` is empty.
- [ ] `/health/providers` filled after the first canary run (06:00 UTC by default).
- [ ] Critical alerts checked regularly: `GET /health/alerts?severity=critical`.
- [ ] Container health check green: `docker compose ps`.
