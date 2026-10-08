---
id: "intro"
title: "Introduction to Fonrex"
sidebar_label: "Introduction"
description: "Overview of Fonrex, the open-source self-hosted financial data API"
---

# Introduction to Fonrex

Fonrex is an open-source, **self-hosted** financial data API. One Docker Compose stack — FastAPI, PostgreSQL/TimescaleDB and Redis — collects and serves end-of-day prices, real-time quotes, fundamentals, technical indicators, news and DCF valuations, and watches the quality of the data it collects.

Fonrex is not a hosted service: there is no Fonrex cloud API. Every client (your scripts, Google Sheets, OpenBB Workspace, Zipline) talks to **your own instance**. The data is scraped or fetched from public sources by your instance, under your responsibility.

Fonrex is distributed under the **AGPL-3.0** license.

## What you get

| Area | What Fonrex provides |
|---|---|
| **Prices** | End-of-day history per listing (Yahoo Finance, TradingView fallback), daily/weekly/monthly bars, real-time quotes over WebSocket |
| **Fundamentals** | One document in the EODHD layout built from Yahoo Finance, the stored deep fundamentals and 13 scraped websites, with the source of every figure |
| **Technical indicators** | 18 indicators computed server-side with pandas-ta, multi-indicator requests and a screener |
| **Valuation** | DCF with three models (FCF, EPS, DDM), dynamic WACC, model comparison and sensitivity matrix |
| **News** | 7 news providers, deduplicated by URL and title similarity |
| **Data quality** | Range and consensus checks on every request, a daily canary run against known assets, alerts |
| **Integrations** | OpenBB Workspace widgets, a Google Sheets template, a Zipline data bundle |

## Fonrex compared with a commercial data API

| | Fonrex | Commercial market data API |
|---|---|---|
| **Hosting** | Your machine (Docker) | Vendor cloud |
| **Price** | Free, open source (AGPL-3.0) | Monthly subscription |
| **Storage** | Your PostgreSQL + TimescaleDB | Vendor managed |
| **Real-time** | WebSocket push + Redis Pub/Sub | Often REST polling or a paid tier |
| **European markets** | Native (Euronext, Xetra…), UCITS ETFs via JustETF | Often a higher tier |
| **Sources** | Several providers per figure, source reported | One vendor |
| **Rate limits** | Those of the public sources you query | Vendor quota |

## Quick start

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
# The API rejects every request until a key is configured:
export FONREX_API_KEY="frx_live_$(openssl rand -hex 24)"
sed -i.bak "s/^FONREX_API_KEY=.*/FONREX_API_KEY=$FONREX_API_KEY/" .env && rm .env.bak
mkdir -p logs
docker compose up -d
```

`/health` answers without a key:

```bash
curl http://localhost:5000/health
```

```json
{
  "status": "healthy",
  "service": "FonRex API",
  "timestamp": "2026-10-08T16:34:42.235390",
  "yfinance_available": true,
  "providers": { "loaded": 14, "unavailable": [] },
  "cache": { "enabled": true, "status": "connected", "ttl_seconds": { "eod": 86400, "...": "..." } }
}
```

Every other route needs the key — see [Installation](getting-started/installation.md) and [First API call](getting-started/first-api-call.md).
