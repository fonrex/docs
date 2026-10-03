---
id: "devops-admin"
title: "DevOps & Infra Admin Pathway"
sidebar_label: "DevOps & Infra Admin"
description: "Installation, high-availability deployment, monitoring, and multi-provider configuration guide for SREs and system admins"
---

# DevOps & Infra Admin Pathway

This pathway provides an infrastructure deployment guide for **DevOps Engineers, SREs, and System Administrators** responsible for maintaining Fonrex instances, TimescaleDB hypertables, Redis cache clusters, and provider canary probes.

| Tier / Component | Technology Stack | Operational Purpose |
|---|---|---|
| **App Server** | FastAPI / Uvicorn (Python 3.12) | Asynchronous API router & provider manager |
| **Time-Series Database** | PostgreSQL 16 + TimescaleDB | Relational schemas & OHLCV hypertables |
| **Cache & Message Broker** | Redis 7 | Response cache & WebSocket Pub/Sub broker |
| **Synthetic Monitoring** | Canary Health Probes | Automated multi-provider SLA & consensus checks |

---

## 1. System Topology & Environment Configuration

Copy and configure environment variables for database credentials and external API keys:

```bash
cp .env.example .env
```

Key configuration parameters in `.env`:

```env
POSTGRES_USER=fonrex
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=fonrex_db
REDIS_URL=redis://redis:6379/0

FMP_API_KEY=your_financial_modeling_prep_key
POLYGON_API_KEY=your_polygon_io_key

PROVIDER_CONSENSUS_THRESHOLD=0.95
CANARY_CHECK_INTERVAL_SECONDS=300
```

---

## 2. Docker Compose Deployment & Migrations

Spin up multi-container infrastructure and run Alembic database migrations:

```bash
docker compose -f docker-compose.yml up -d --build
```

Verify container runtime status:

```bash
docker compose ps
```

---

## 3. Provider Health & Canary Probe Diagnostics

Query the health monitoring endpoint to track data provider availability, latency, and error rates:

```http
GET /api/v1/monitoring/canary
```

Diagnostic payload schema:

```json
{
  "timestamp": "2024-01-15T12:00:00Z",
  "status": "healthy",
  "providers": {
    "yfinance": { "status": "up", "latency_ms": 120, "error_rate_24h": 0.00 },
    "fmp": { "status": "up", "latency_ms": 85, "error_rate_24h": 0.01 }
  }
}
```

---

## Next Steps

- Review the [Production Checklist](/docs/deployment/production-checklist)
- Review the [Canary Monitor & Alerts Guide](/docs/monitoring/canary-monitor)
- Review the [Database Migrations Deployment Guide](/docs/deployment/database-migrations)
