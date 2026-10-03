---
id: "devops-admin"
title: "🛡️ Pathway: DevOps & Infra Admin"
sidebar_label: "🛡️ DevOps & Infra Admin"
description: "Installation, high-availability deployment, monitoring, and multi-provider configuration guide for SREs and system admins."
---

# 🛡️ Pathway: DevOps & Infra Admin

This pathway is designed for **DevOps Engineers, SREs, and System Administrators** responsible for deploying, maintaining, securing, and monitoring Fonrex instances.

> [!TIP]
> **Goal:** Deploy a resilient architecture with TimescaleDB (Hypertables) and Redis, configure data provider API keys, and enable synthetic canary probes.

---

### ⏱️ Estimated Time: 15 minutes

---

## 📌 Step 1: System Topology

Fonrex relies on a 3-tier containerized stack:
- **FastAPI / Uvicorn**: Async Python 3.12 application server.
- **PostgreSQL + TimescaleDB**: Relational database + hypertables for OHLCV time-series.
- **Redis**: High-performance cache and WebSocket Pub/Sub broker.

---

## 📌 Step 2: Environment Variables Setup

Copy and edit the `.env` configuration file:

```bash
cp .env.example .env
```

Principales variables à vérifier :
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

*(See the [Environment Variables Reference](/docs/deployment/environment-variables) for full list).*

---

## 📌 Step 3: Docker Compose & Migration Execution

Spin up the stack and automatically execute Alembic migrations on startup:

```bash
docker compose -f docker-compose.yml up -d --build
```

Check container status:
```bash
docker compose ps
```

---

## 📌 Step 4: Health & Canary Monitoring

Query the health probe endpoint to track data provider availability and response latency:

```bash
curl http://localhost:5000/api/v1/monitoring/canary
```

Example response:
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

## 🎯 Suggested Next Steps

- 🚀 [Production Checklist](/docs/deployment/production-checklist)
- 📊 [Canary Monitor & Alerts Guide](/docs/monitoring/canary-monitor)
- 🔄 [Database Migrations Deployment Guide](/docs/deployment/database-migrations)
