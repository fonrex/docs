---
id: "backtesting-zipline"
title: "Backtesting with Zipline"
sidebar_label: "Backtesting (Zipline)"
description: "Run zipline-reloaded backtests on the prices of your Fonrex database, or load them into pandas"
---

# Backtesting with Zipline

Fonrex ships a [`zipline-reloaded`](https://github.com/stefan-jansen/zipline-reloaded) data bundle, `zipline_bundle/`, that reads the daily prices of your database directly — no CSV export, no parallel dataset. The API never imports Zipline: install it only where you run the backtests.

## Prerequisites

- Prices ingested in your instance (`POST /historical/ingest`, `scripts/ingest_all.py`).
- The Fonrex repository and `zipline-reloaded` in the same Python environment:

```bash
pip install zipline-reloaded
```

- Access to the database. With Docker Compose it is published on `127.0.0.1:5432` of the host:

```bash
export DATABASE_URL="postgresql://fonrex:<POSTGRES_PASSWORD>@localhost:5432/fonrex"
```

## Register and ingest the bundle

```bash
mkdir -p ~/.zipline
cp zipline_bundle/extension.py ~/.zipline/extension.py
zipline bundles            # fonrex <no ingestions>
zipline ingest -b fonrex
```

Or without the extension file:

```bash
python -m zipline_bundle ingest --start 2020-01-01 --end 2025-12-31 \
    --tickers AAPL,MSFT --calendar NYSE

# What the bundle would contain (Zipline not needed)
python -m zipline_bundle preview --start 2024-01-01 --end 2024-12-31
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | the address of `.env.example` | Database read by the bundle (`postgresql+asyncpg://` is accepted) |
| `FONREX_BUNDLE_NAME` | `fonrex` | Bundle name |
| `FONREX_BUNDLE_TICKERS` | *(empty)* | Comma-separated tickers; empty = every instrument with daily prices in the window |
| `FONREX_BUNDLE_CALENDAR` | `NYSE` | Trading calendar: `XPAR`, `XETR`, `XLON`, `XSWX`… for other markets |

For several markets, register one bundle per calendar:

```python
from zipline_bundle import register_fonrex_bundle

register_fonrex_bundle(bundle_name="fonrex_us", tickers=["AAPL", "MSFT"], calendar_name="NYSE")
register_fonrex_bundle(bundle_name="fonrex_paris", tickers=["AIR.PA", "BNP.PA"], calendar_name="XPAR")
```

## Run a backtest

```python
import pandas as pd
from zipline import run_algorithm
from zipline.api import order_target_percent, symbol

def initialize(context):
    context.asset = symbol("AIR.PA")

def handle_data(context, data):
    order_target_percent(context.asset, 1.0)

result = run_algorithm(
    start=pd.Timestamp("2024-01-02"),
    end=pd.Timestamp("2024-12-31"),
    initialize=initialize,
    handle_data=handle_data,
    capital_base=100_000,
    bundle="fonrex_paris",
)
```

## What the bundle contains

- **Daily bars only**, from `prices_eod`.
- **One listing per instrument**: the primary one, then an active one; the other listings (other currencies) are not exposed.
- **Adjusted prices**: `adj_close` is used as the Zipline close. Split and dividend tables are written empty.
- **Calendar alignment**: bars outside the sessions of the calendar are dropped.
- **Stable `sid`s**: assigned in the alphabetical order of the symbols.

## Without Zipline: pandas

For Backtrader, vectorbt or your own code, read the prices through the API:

```python
import os
import pandas as pd
import requests

def fonrex_ohlcv(ticker: str, period: str = "5y") -> pd.DataFrame:
    response = requests.get(
        f"http://localhost:5000/eod/{ticker}",
        params={"period": period},
        headers={"X-API-KEY": os.environ["FONREX_API_KEY"]},
        timeout=60,
    )
    response.raise_for_status()
    frame = pd.DataFrame(response.json()["data"])
    frame["Date"] = pd.to_datetime(frame["Date"])
    return frame.set_index("Date").rename(columns=str.lower)

df = fonrex_ohlcv("AIR.PA")
print(df.tail())
```

The columns are `open`, `high`, `low`, `close`, `adj close` and `volume`, one row per trading session.
