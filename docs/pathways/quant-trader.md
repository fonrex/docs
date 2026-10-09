---
id: "quant-trader"
title: "Quant & Algo-Trader Pathway"
sidebar_label: "Quant & Algo-Trader"
description: "From an empty instance to backtests: ingest prices per listing, compute indicators server-side, feed Zipline"
---

# Quant & Algo-Trader Pathway

This pathway takes you from an empty instance to a backtest: daily prices stored per listing in TimescaleDB, indicators computed by the API, and a Zipline bundle reading your database.

| Step | What you use |
|---|---|
| Prices | `POST /historical/ingest`, `scripts/ingest_all.py`, `GET /eod` |
| Indicators | `GET /technical/{ticker}` and `/multi`, 18 indicators (pandas-ta) |
| Screening | `GET /technical/screen` |
| Backtesting | `zipline_bundle` (zipline-reloaded) or pandas |

## 1. Start an instance

```bash
git clone https://github.com/fonrex/fonrex.git && cd fonrex
cp .env.example .env
export FONREX_API_KEY="frx_live_$(openssl rand -hex 24)"
sed -i.bak "s/^FONREX_API_KEY=.*/FONREX_API_KEY=$FONREX_API_KEY/" .env && rm .env.bak
mkdir -p logs && docker compose up -d
AUTH="X-API-KEY: $FONREX_API_KEY"
```

## 2. Import instruments and ingest prices

```bash
docker compose exec fonrex-api python import_assets.py --file data/stocks.csv
curl -s -X POST -H "$AUTH" "http://localhost:5000/historical/ingest?ticker=AIR.PA"
```

The ingestion fetches ten years of daily bars from Yahoo Finance with the symbol verified for the listing (TradingView as a fallback), dated by trading session: the traded prices adjusted for splits, and an `adj_close` adjusted for dividends too, kept on one adjustment basis when a split or a dividend occurs. For the whole catalogue: `docker compose exec fonrex-api python scripts/ingest_all.py`. Details: [Ingesting historical data](../guides/ingest-historical-data.md).

## 3. Compute indicators

```bash
curl -s -H "$AUTH" "http://localhost:5000/technical/AIR.PA?indicator=rsi&period=14"
curl -s -H "$AUTH" "http://localhost:5000/technical/AIR.PA/multi?indicators=sma_50,sma_200,macd,bbands_20"
curl -s -H "$AUTH" "http://localhost:5000/technical/screen?indicator=rsi&operator=lt&value=30"
```

Indicators are computed on the stored prices with pandas-ta and cached in Redis. See the [Technical indicators reference](../api-reference/technical-indicators.md).

## 4. Backtest

With Zipline, register the bundle and ingest it from your database:

```bash
pip install zipline-reloaded
export DATABASE_URL="postgresql://fonrex:<POSTGRES_PASSWORD>@localhost:5432/fonrex"
python -m zipline_bundle ingest --start 2020-01-01 --end 2025-12-31 --tickers AIR.PA,BNP.PA --calendar XPAR
```

Or load the prices into pandas through `GET /eod/{ticker}` — see [Python & Jupyter](../guides/python-jupyter.md), with an example notebook. See [Backtesting with Zipline](../guides/backtesting-zipline.md).

## Next steps

- [Historical prices API](../api-reference/historical.md)
- [Realtime streaming](../api-reference/realtime.md) for 1-minute ticks
- [Data model](../architecture/data-model.md)
