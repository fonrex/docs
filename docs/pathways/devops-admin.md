---
id: "devops-admin"
title: "DevOps & Infra Admin Pathway"
sidebar_label: "DevOps & Infra Admin"
description: "Install, secure, upgrade, back up and monitor a Fonrex instance"
---

# DevOps & Infra Admin Pathway

This pathway is for whoever runs the instance: the stack, its security, its upgrades and the health of its data sources.

| Component | Technology | Notes |
|---|---|---|
| API | FastAPI, Gunicorn + Uvicorn (Python 3.12) | One worker: realtime and canary live in the process |
| Database | PostgreSQL 16 + TimescaleDB (`timescaledb-ha:pg16`) | Volume `timescale_data`, `127.0.0.1:5432` |
| Cache | Redis 7, 256 MB, `allkeys-lru` | `127.0.0.1:6379`, no password |
| Monitoring | Validation layer + daily canary | `/health/*` routes |

## 1. Install and secure

```bash
cp .env.example .env
# FONREX_API_KEY, FONREX_READ_ONLY_API_KEYS, POSTGRES_PASSWORD, SEC_EDGAR_EMAIL
mkdir -p logs
docker compose up -d
docker compose ps
```

Keep the API behind a TLS reverse proxy that forwards the WebSocket upgrade. See [Docker production deployment](../deployment/docker.md) and the [production checklist](../deployment/production-checklist.md).

## 2. Upgrade

```bash
docker compose exec -T db pg_dump -U fonrex -d fonrex -Fc > fonrex-$(date +%F).dump
git pull
docker compose up -d --build        # migrations run at start
```

Roll back by restoring the dump with the previous code. See [Database migrations in production](../deployment/database-migrations.md).

## 3. Watch the instance

```bash
curl -s http://localhost:5000/health                                        # no key
curl -s -H "X-API-KEY: $KEY" http://localhost:5000/health/providers
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/health/alerts?severity=critical"
curl -s -H "X-API-KEY: $KEY" http://localhost:5000/realtime/status
curl -s -H "X-API-KEY: $KEY" http://localhost:5000/database/stats
```

- `/health`: `providers.unavailable` names a provider that failed to load.
- `/health/providers`: result of the daily canary (06:00 UTC), per provider.
- Logs: `docker compose logs -f fonrex-api`.

## 4. Data sources refusing your IP

Websites protected by anti-bot services may refuse a server IP. Route those providers through a proxy:

```env
FONREX_PROXY_URL=http://user:password@proxy.example:8888
FONREX_PROXY_PROVIDERS=Investing,Gurufocus,wallStreetJournal
FONREX_PROVIDER_MAX_CONCURRENCY=4
```

## 5. Storage

- Prices: about ten years per listing on first ingestion, compressed after 14 days.
- `POST /database/cleanup` deletes prices older than `days_to_keep` (730 by default!) — always run it with `dry_run` first.
- Intraday candles and validation logs expire after 30 days; the usage log after `USAGE_LOG_RETENTION_DAYS`; news articles are kept.

## Next steps

- [Docker Compose topology](../getting-started/docker-compose.md)
- [Canary monitor](../monitoring/canary-monitor.md) and [alerts](../monitoring/alerts.md)
- [Environment variables](../deployment/environment-variables.md)
