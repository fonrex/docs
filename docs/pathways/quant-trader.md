---
id: "quant-trader"
title: "Quant & Algo-Trader Pathway"
sidebar_label: "Quant & Algo-Trader"
description: "Step-by-step onboarding for quantitative analysts: historical data ingestion, Pandas-TA indicators, and Zipline backtesting"
---

# Quant & Algo-Trader Pathway

This pathway provides a technical onboarding guide for **Quantitative Analysts and Algorithmic Traders**. It covers local infrastructure setup, historical time-series data ingestion into TimescaleDB, server-side Pandas-TA technical indicator calculations, and Python backtesting integration.

| Domain Component | Technology | Specification |
|---|---|---|
| **Data Ingestion** | TimescaleDB Hypertables | Partitioned time-series OHLCV storage |
| **Technical Indicators** | Pandas-TA Engine | 18+ Built-in indicator endpoints (SMA, EMA, RSI, MACD, Bollinger) |
| **Backtesting Integration** | Zipline Adapter | Native Python DataBundle client |

---

## 1. Local Infrastructure Deployment

Launch the Fonrex application server along with TimescaleDB and Redis containers using Docker Compose:

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
docker compose up -d
```

Verify instance health status:

```http
GET /health
```

Expected JSON response:

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "alembic_version": "011_provider_monitoring"
}
```

---

## 2. Ingesting Historical Time-Series Data

Import End-of-Day (EOD) or intraday OHLCV candles for target financial assets into TimescaleDB hypertables:

```http
POST /api/v1/historical/ingest
Content-Type: application/json

{
  "symbol": "AAPL",
  "interval": "1d",
  "provider": "yfinance",
  "start_date": "2023-01-01"
}
```

> **Note**: For automated batch ingestion across multiple tickers, refer to the [Historical Data Ingestion Guide](/docs/guides/ingest-historical-data).

---

## 3. Server-Side Technical Indicator Calculation

Query the Pandas-TA indicator engine to compute indicators directly on stored historical data:

```http
GET /api/v1/indicators/sma?symbol=AAPL&period=20&interval=1d
```

Response payload schema:

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

Available indicator types include Simple Moving Average (`sma`), Exponential Moving Average (`ema`), Relative Strength Index (`rsi`), Moving Average Convergence Divergence (`macd`), and Bollinger Bands (`bollinger`).

---

## 4. Connecting Zipline for Strategy Backtesting

Integrate the Fonrex Python client adapter directly into your Zipline backtesting strategy:

```python
from fonrex_client import FonrexDataIngestor
import zipline

ingestor = FonrexDataIngestor(base_url="http://localhost:5000")
ingestor.register_bundle(name="fonrex-us-equities", symbols=["AAPL", "MSFT", "NVDA"])

print("Zipline Bundle registered successfully.")
```

---

## Next Steps

- Review the [Technical Indicators API Reference](/docs/api-reference/technical-indicators)
- Review the [Historical Prices API Reference](/docs/api-reference/historical)
- Review the [Backtesting with Zipline Guide](/docs/guides/backtesting-zipline)
