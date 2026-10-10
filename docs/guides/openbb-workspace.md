---
id: "openbb-workspace"
title: "Connecting Fonrex to OpenBB Workspace"
sidebar_label: "OpenBB Workspace Guide"
description: "Connect your self-hosted Fonrex instance to OpenBB Workspace widgets and dashboards"
---

# Connecting Fonrex to OpenBB Workspace

[OpenBB Workspace](https://openbb.co) can use your Fonrex instance as a custom backend: European fundamentals, DCF valuations, technical indicators and news appear as OpenBB widgets.

## Prerequisites

1. A running Fonrex instance that OpenBB can reach. OpenBB Workspace in the browser (`pro.openbb.co`) calls your instance from your browser: `http://localhost:5000` works when the browser runs on the same machine; otherwise expose the instance through a tunnel or your network.
2. An API key of the instance. A **read-only** key (`FONREX_READ_ONLY_API_KEYS`) is enough for every widget and is the one to use.

## Step 1 — Add Fonrex as a data source

1. In OpenBB Workspace, right-click on the dashboard and select **Add data** (or open the backend connections).
2. Enter the URL of your instance, e.g. `http://localhost:5000` or `https://myfonrex.share.zrok.io`.
3. OpenBB reads `/widgets.json` and lists the 21 widgets. This file and `/apps.json` answer without a key.

## Step 2 — Add the key

Add a custom header to the connection:

- **Name**: `X-API-KEY`
- **Value**: `frx_live_...`

Every `/openbb/...` route requires it.

## Step 3 — Import the dashboards

`/apps.json` holds two dashboards:

**Fonrex — EU Markets** — one ticker:
- *Overview*: quote, macro rates, EOD chart, deep fundamentals, news
- *Valuation*: DCF valuation, model comparison and sensitivity matrix
- *Technical*: technical chart and multi-indicator chart
- *News*: news of the ticker and global feed
- *Watchlist*: batch quotes
- *Factors*: Fama/French 5-factor exposure of the ticker and returns of the European factors

**Fonrex — Screener & Macro** — discovery:
- *Screener*: technical screener (e.g. RSI < 30)
- *Macro Context*: FRED and ECB rates (USD and EUR) and index constituents

Import them from the Apps menu of OpenBB, or add widgets one by one to your own dashboard.

## Widgets

| Widget | Name | Category | Type |
|---|---|---|---|
| `fonrex_fundamentals` | Fonrex Fundamentals | Fundamentals | table |
| `fonrex_fundamentals_deep` | Fonrex Deep Fundamentals | Fundamentals | table |
| `fonrex_insider_transactions` | Fonrex Insider Transactions | Fundamentals | table |
| `fonrex_etf_details` | Fonrex ETF Details | Fundamentals | table |
| `fonrex_eod` | Fonrex EOD History | Historical | chart |
| `fonrex_history` | Fonrex OHLCV History | Historical | chart |
| `fonrex_quote` | Fonrex Quote | Market Data | metric |
| `fonrex_quotes_batch` | Fonrex Batch Quotes | Market Data | table |
| `fonrex_index_constituents` | Fonrex Index Constituents | Market Data | table |
| `fonrex_technical` | Fonrex Technical Indicator | Technical | chart |
| `fonrex_technical_multi` | Fonrex Multi-Indicator | Technical | chart |
| `fonrex_technical_chart` | Fonrex Technical Chart | Technical | chart |
| `fonrex_screener` | Fonrex Technical Screener | Technical | table |
| `fonrex_news` | Fonrex News | News | table |
| `fonrex_news_feed` | Fonrex News Feed | News | table |
| `fonrex_dcf` | Fonrex DCF Valuation | Valuation | table |
| `fonrex_dcf_compare` | Fonrex DCF Models Comparison | Valuation | table |
| `fonrex_dcf_sensitivity` | Fonrex DCF Sensitivity Matrix | Valuation | table |
| `fonrex_macro_rates` | Fonrex Macro Rates | Macro | metric |
| `fonrex_factor_exposure` | Fonrex Factor Exposure | Factors | table |
| `fonrex_factor_returns` | Fonrex Factor Returns | Factors | chart |

The routes behind them are listed in the [OpenBB API reference](../api-reference/openbb.md).

## Good to know

- **Quotes**: the quote widget never starts a realtime stream. It shows the real-time price once the ticker is subscribed (`POST /realtime/subscribe` with a full-access key), the delayed Yahoo Finance price otherwise.
- **Prices and indicators** need the ticker's prices in the database; the EOD widget ingests them on first use.
- **DCF** needs the deep fundamentals of the ticker: open the deep fundamentals widget first.
- **Factor exposure** needs the daily prices of the ticker (`POST /historical/ingest`, or open the EOD widget first); the factor files and the ECB exchange rates are downloaded on first use.

## Troubleshooting

- **Connection refused**: check `docker compose ps` and that OpenBB can reach the URL.
- **401 / 403**: the `X-API-KEY` header is missing or does not match a key of your `.env` (restart the API after changing it).
- **CORS error**: the browser calls your instance from the OpenBB origin. `OPENBB_ALLOWED_ORIGIN` (default `https://pro.openbb.co`) lists the allowed origins, comma-separated.
