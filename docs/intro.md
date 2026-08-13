---
id: "intro"
title: "Introduction to Fonrex"
sidebar_label: "Introduction"
description: "Overview of Fonrex open-source self-hosted financial data infrastructure API"
---

# Introduction to Fonrex

Fonrex is an open-source, self-hosted FastAPI infrastructure for market data, fundamental financials, technical indicators, news aggregation, DCF valuations, and real-time provider health monitoring. Built on top of Python 3.12, PostgreSQL/TimescaleDB, and Redis, Fonrex bridges the gap between institutional-grade financial feeds and self-hosted developer workflows.

Designed with hexagonal architecture principles, Fonrex provides a robust API for quantitative analysts, algorithm traders, and financial applications. It unifies scattered data providers into standardized REST and WebSocket interfaces while ensuring continuous provider validation and fallback logic.

Fonrex is distributed under the **AGPL-3.0** open-source license, giving you full control over your financial data pipeline without API rate-limit lock-ins or costly per-request pricing models.

## Fonrex vs. Commercial Market Data Providers

| Feature | Fonrex Pro | FMP Premium / Commercial APIs |
|---|---|---|
| **Hosting** | Self-hosted (Docker) | Cloud SaaS |
| **Pricing** | Free & Open Source (AGPL-3.0) | $50 – $500+ / month |
| **Data Storage** | PostgreSQL + TimescaleDB Hypertables | Vendor Managed |
| **Realtime Streaming** | Native WebSocket + Redis Pub/Sub | Restricted / Upcharge |
| **Multi-Provider Fallback** | Automated (14+ Fundamentals, 7+ News) | Single Vendor Dependency |
| **Custom Indicators** | 18+ Built-in + Custom Pandas-TA Engine | Limited API Parameters |
| **DCF & Valuation** | Custom WACC, FCF, EPS & DDM Models | Black-box / Static Metrics |
| **Data Quality Check** | Real-time Consensus & Daily Canary Monitors | Proprietary SLA |

## Quick Start (4 Commands)

Deploy a complete Fonrex instance with historical storage, Redis cache, and live API endpoints in 4 simple commands:

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
docker compose up -d
```

Verify that your local instance is up and running:

```bash
curl http://localhost:5000/health
```

Output:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "alembic_version": "011_provider_monitoring"
}
```
