---
id: "quant-trader"
title: "📈 Pathway: Quant & Algo-Trader"
sidebar_label: "📈 Quant & Algo-Trader"
description: "Step-by-step onboarding for quantitative analysts: historical data ingestion, Pandas-TA indicators, and Zipline backtesting."
---

# 📈 Pathway: Quant & Algo-Trader

Welcome to the **Quantitative Analyst and Algo-Trader** pathway. This guide will walk you from zero to running automated technical indicators and connecting your Python backtester with Fonrex.

> [!TIP]
> **Goal:** Deploy a self-hosted financial data pipeline, compute 18+ indicators on OHLCV series, and connect Zipline / Backtrader scripts in under 10 minutes.

---

### ⏱️ Estimated Time: 10 minutes

---

## 📌 Step 1: Local Deployment

Launch Fonrex with TimescaleDB and Redis using Docker Compose:

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
docker compose up -d
```

Verify API status:
```bash
curl http://localhost:5000/health
```

---

## 📌 Step 2: Ingesting Historical Data

Import historical price data (OHLCV) for your target tickers via the ingestion endpoint:

```bash
curl -X POST http://localhost:5000/api/v1/historical/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "interval": "1d",
    "provider": "yfinance",
    "start_date": "2023-01-01"
  }'
```

*(See the [Historical Data Ingestion Guide](/docs/guides/ingest-historical-data) to automate batch historical ingestion).*

---

## 📌 Step 3: Technical Indicators (Pandas-TA)

Query the built-in indicators engine to fetch Moving Averages (SMA/EMA), RSI, MACD, or Bollinger Bands:

```bash
curl "http://localhost:5000/api/v1/indicators/sma?symbol=AAPL&period=20&interval=1d"
```

Example JSON response:
```json
{
  "symbol": "AAPL",
  "indicator": "SMA",
  "period": 20,
  "data": [
    { "timestamp": "2024-01-15T00:00:00Z", "value": 185.42 },
    { "timestamp": "2024-01-16T00:00:00Z", "value": 186.10 }
  ]
}
```

---

## 📌 Step 4: Connecting Zipline for Backtesting

Use the Fonrex Zipline adapter in your Python trading strategy:

```python
from fonrex_client import FonrexDataIngestor
import zipline

ingestor = FonrexDataIngestor(base_url="http://localhost:5000")
ingestor.register_bundle(name="fonrex-us-equities", symbols=["AAPL", "MSFT", "NVDA"])

print("✅ Zipline Bundle ready for backtesting!")
```

*(Follow the [Backtesting with Zipline Guide](/docs/guides/backtesting-zipline) for strategy execution configuration).*

---

## 🎯 Suggested Next Steps

- 📖 [Technical Indicators API Reference](/docs/api-reference/technical-indicators)
- 📊 [Historical Prices API Reference](/docs/api-reference/historical)
- 💡 [Bulk Asset Onboarding Guide](/docs/guides/import-assets)
