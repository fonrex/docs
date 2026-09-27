---
id: "openbb"
title: "OpenBB Workspace Integration API"
sidebar_label: "OpenBB Integration"
description: "API reference for OpenBB Workspace adapters, widget discovery, pre-assembled apps, and authentication"
---

# OpenBB Workspace Integration API

Fonrex provides native backend endpoints designed for **OpenBB Workspace** (Desktop and Cloud). The `/openbb` router translates Fonrex core financial domain models into the strict schema contracts required by OpenBB widgets:

- **Metric tiles** (`type: "metric"`): `[ { "label": "...", "value": ..., "delta": ... } ]`
- **Plotly charts** (`type: "chart"`): `Plotly.js` figure JSON object `{ "data": [...], "layout": {...} }`
- **Data tables** (`type: "table"`): Flat array of records `[ { ... }, { ... } ]` for AgGrid

---

## Authentication

OpenBB Workspace supports custom header authentication for REST backend connections. Fonrex validates request credentials through dual extraction:

| Method | Header | Usage Example |
|---|---|---|
| **API Key Header (Recommended)** | `X-API-KEY: frx_live_...` | Native custom header configured in OpenBB Workspace |
| **Bearer Token** | `Authorization: Bearer frx_live_...` | Standard HTTP clients & curl requests |

> **Note**: Both header formats resolve to the same underlying key validation logic. If authentication is enabled on your instance, set `OPENBB_API_KEY` or `FONREX_API_KEY` in your `.env` file.

---

## Discovery & App Endpoints

### Discover Available Widgets

```http
GET /openbb/widgets.json
```

Returns the complete manifest of 19 interactive widgets provided by your Fonrex instance. OpenBB Workspace automatically queries this endpoint when adding Fonrex as a custom data source.

### Retrieve Pre-Assembled Dashboard Apps

```http
GET /openbb/apps.json
```

Returns pre-assembled app configurations for OpenBB Workspace, including:
1. **Fonrex — EU Markets**: Single-ticker analysis dashboard (Overview, Valuation, Technicals, News tabs).
2. **Fonrex — Screener & Macro**: Market discovery dashboard (Technical Screener and FRED Macro Context).

---

## Data Endpoints

### Metric Endpoints (`type: "metric"`)

#### Latest Quote Metric
```http
GET /openbb/quote/{ticker}
```
Returns real-time price snapshot, change percent, volume, and daily high/low as metric tiles.

#### Macro Interest Rates
```http
GET /openbb/macro/rates
```
Returns current macro-economic interest rates and yields (FRED API integration) as metric tiles.

---

### Chart Endpoints (`type: "chart"`)

#### EOD Candlestick Chart
```http
GET /openbb/eod/{ticker}?period=1y&order=a
```
Returns daily OHLCV price history as a Plotly Candlestick figure with auto-ingestion capabilities.

#### Ticker Historical Candles
```http
GET /openbb/ticker/{symbol}/history?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&interval=1D
```
Returns filtered historical candles as a Plotly chart.

#### Single Technical Indicator Chart
```http
GET /openbb/technical/{ticker}?indicator=rsi&period=14
```
Returns a single technical indicator time-series formatted as a Plotly line chart.

#### Multi-Indicator Chart
```http
GET /openbb/technical/{ticker}/multi?indicators=sma_20,ema_50,rsi_14
```
Returns multiple technical indicators overlaid in a single Plotly figure.

#### Overlaid Technical Chart
```http
GET /openbb/technical/{ticker}/chart?indicators=sma_20,rsi_14
```
Returns candlestick price history with overlaid indicator lines and subplots.

---

### Table Endpoints (`type: "table"`)

#### Multi-Provider Fundamentals
```http
GET /openbb/fundamental?ticker=AAPL
```
Flattens multi-provider fundamental metrics (P/E, ROE, Dividend Yield, Market Cap) into table row records.

#### Deep Fundamental Statements & ESG
```http
GET /openbb/fundamental/deep?ticker=AAPL&sections=all
```
Returns financial statements, ESG scores, analyst consensus, and corporate metrics.

#### Batch Quotes Table
```http
GET /openbb/quotes?tickers=AAPL,MSFT,SAP.DE
```
Returns real-time price snapshots for multiple tickers as a structured table.

#### DCF Intrinsic Valuation
```http
GET /openbb/dcf/{ticker}
```
Returns DCF intrinsic valuation results (Free Cash Flow, EPS, Dividend Discount Models).

#### DCF Models Comparison
```http
GET /openbb/dcf/{ticker}/compare
```
Returns side-by-side comparative analysis of all 3 DCF models.

#### DCF Sensitivity Matrix
```http
GET /openbb/dcf/{ticker}/sensitivity?model=fcf&wacc_min=0.06&wacc_max=0.16&growth_min=0.01&growth_max=0.05
```
Returns WACC × terminal growth rate sensitivity grid.

#### Technical Screener Table
```http
GET /openbb/technical/screen?indicator=rsi&operator=lt&value=30
```
Screens instruments matching indicator thresholds and returns tabular results.

#### Aggregated News Table
```http
GET /openbb/news/{ticker}?limit=20
```
Returns deduplicated financial news from 7 integrated sources for a ticker.

#### News Feed
```http
GET /openbb/news/feed?limit=20
```
Returns global market news feed items.

#### Insider Transactions
```http
GET /openbb/insider_transactions/{ticker}?limit=20
```
Returns SEC Form 4 insider trading activity (US equities).

#### ETF Details
```http
GET /openbb/etf/{isin}/details
```
Returns UCITS ETF metadata, fund size, TER, holdings, and sector allocations.

#### Index Constituents
```http
GET /openbb/index/{index_name}/constituents
```
Returns list of constituent companies for major indices (`sp500`, `cac40`, `nasdaq100`, `dax`).
