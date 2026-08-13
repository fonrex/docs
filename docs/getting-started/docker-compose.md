---
id: "docker-compose"
title: "Docker Compose Topology"
sidebar_label: "Docker Compose"
description: "Container architecture, health checks, ports, volumes, and lifetime management"
---

# Docker Compose Topology

Fonrex relies on Docker Compose to orchestrate its multi-service runtime. The architecture isolates backend logic, database persistence, caching, and schema migrations.

## Container Architecture

```
┌───────────────────────────────────────────────────────────┐
│                      docker-compose                       │
│                                                           │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐  │
│  │   fonrex-api    │ │   fonrex-db     │ │fonrex-redis │  │
│  │ (FastAPI:5000)  │ │ (TimescaleDB)   │ │  (Redis:7)  │  │
│  └────────┬────────┘ └────────┬────────┘ └──────┬──────┘  │
│           │                   │                 │         │
│           └───────────────────┴─────────────────┘         │
│                               │                           │
│                      ┌────────┴────────┐                  │
│                      │ fonrex-migrate  │                  │
│                      │  (Alembic CLI)  │                  │
│                      └─────────────────┘                  │
└───────────────────────────────────────────────────────────┘
```

## Service Breakdown

### 1. `fonrex-api`
- **Container Image**: Custom Python 3.12 (`Dockerfile`)
- **Port Exposure**: `5000:5000`
- **Command**: `gunicorn -k uvicorn.workers.UvicornWorker main:app`
- **Role**: Serves REST endpoints, WebSocket connections, background ingestion tasks, provider monitoring, and DCF calculations.

### 2. `fonrex-db`
- **Container Image**: `timescale/timescaledb-ha:pg16`
- **Port Exposure**: `5432:5432`
- **Volume Mount**: `postgres_data:/var/lib/postgresql/data`
- **Role**: Primary database holding canonical assets, listings, historical EOD prices, intraday hypertables, fundamentals, news, and health logs.

### 3. `fonrex-redis`
- **Container Image**: `redis:7-alpine`
- **Port Exposure**: `6379:6379`
- **Command**: `redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru`
- **Role**: High-speed cache for quotes, indicator computations, news feeds, DCF metrics, and WebSocket Pub/Sub broker.

### 4. `fonrex-migrate`
- **Container Image**: Custom Python 3.12 (`Dockerfile`)
- **Profiles**: `["migrate"]`
- **Command**: `alembic upgrade head`
- **Role**: Isolated one-shot container executing schema migrations safely before application startup.

## Common Operations

### Start Stack
```bash
docker compose up -d
```

### View Live API Logs
```bash
docker compose logs -f fonrex-api
```

### Run Database Migrations Manually
```bash
docker compose --profile migrate run --rm fonrex-migrate
```

### Stop & Remove Containers (Preserving Data)
```bash
docker compose down
```

### Reset All Data Volumes (Destructive)
```bash
docker compose down -v
```
