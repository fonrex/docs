---
id: "openbb"
title: "OpenBB Workspace Integration API"
sidebar_label: "OpenBB Integration"
description: "The /openbb routes and discovery files that feed OpenBB Workspace widgets"
---

# OpenBB Workspace Integration API

The `/openbb` routes serve the widgets of [OpenBB Workspace](https://openbb.co) from your own instance. Each route calls the Fonrex route it adapts and reshapes the answer into one of the three formats OpenBB expects:

- **metric**: a list of tiles `[{"label": "...", "value": ..., "delta": ...}]`
- **chart**: a Plotly figure `{"data": [...], "layout": {...}}`
- **table**: a flat list of rows `[{...}, {...}]` for AgGrid

Setup is described in the [OpenBB Workspace guide](../guides/openbb-workspace.md).

## Authentication

| Route | Key |
|---|---|
| `GET /widgets.json`, `GET /apps.json` | None — OpenBB fetches them before a key is configured |
| `GET /openbb/...` | Required, in the `X-API-KEY` header (or `Authorization: Bearer`) |

A read-only key (`FONREX_READ_ONLY_API_KEYS`) is enough for every widget. CORS accepts the origins of `OPENBB_ALLOWED_ORIGIN` (`https://pro.openbb.co` by default).

## Discovery files

- `GET /widgets.json` — the 21 widgets: for each one, its name, category, type, route and parameters (`integrations/openbb/widgets.json`).
- `GET /apps.json` — two pre-assembled dashboards, **Fonrex — EU Markets** and **Fonrex — Screener & Macro** (`integrations/openbb/apps.json`).

## Routes

| Widget | Type | Route | Adapts |
|---|---|---|---|
| `fonrex_quote` | metric | `GET /openbb/quote/{ticker}` | `/quote/{ticker}` |
| `fonrex_macro_rates` | metric | `GET /openbb/macro/rates` | `/macro/rates` |
| `fonrex_eod` | chart | `GET /openbb/eod/{ticker}` (`period` 1y by default) | `/eod/{ticker}` |
| `fonrex_history` | chart | `GET /openbb/ticker/{symbol}/history` | `/ticker/{symbol}/history` |
| `fonrex_technical` | chart | `GET /openbb/technical/{ticker}` | `/technical/{ticker}` |
| `fonrex_technical_multi` | chart | `GET /openbb/technical/{ticker}/multi` | `/technical/{ticker}/multi` |
| `fonrex_technical_chart` | chart | `GET /openbb/technical/{ticker}/chart` | `/technical/{ticker}/chart` |
| `fonrex_fundamentals` | table | `GET /openbb/fundamental` | `/fundamental` |
| `fonrex_fundamentals_deep` | table | `GET /openbb/fundamental/deep` | `/fundamental/deep` |
| `fonrex_quotes_batch` | table | `GET /openbb/quotes` | `/quotes` |
| `fonrex_screener` | table | `GET /openbb/technical/screen` | `/technical/screen` |
| `fonrex_news` | table | `GET /openbb/news/{ticker}` | `/news/{ticker}` |
| `fonrex_news_feed` | table | `GET /openbb/news/feed` | `/news/feed` |
| `fonrex_dcf` | table | `GET /openbb/dcf/{ticker}` | `/dcf/{ticker}` |
| `fonrex_dcf_compare` | table | `GET /openbb/dcf/{ticker}/compare` | `/dcf/{ticker}/compare` |
| `fonrex_dcf_sensitivity` | table | `GET /openbb/dcf/{ticker}/sensitivity` | `/dcf/{ticker}/sensitivity` |
| `fonrex_insider_transactions` | table | `GET /openbb/insider-transactions/{ticker}` | `/insider-transactions/{ticker}` |
| `fonrex_etf_details` | table | `GET /openbb/etf/{isin}/details` | `/etf/{isin}/details` |
| `fonrex_index_constituents` | table | `GET /openbb/index/{index_name}/constituents` | `/index/{index_name}/constituents` |
| `fonrex_factor_exposure` | table | `GET /openbb/factors/exposure/{ticker}` | `/factors/exposure/{ticker}` |
| `fonrex_factor_returns` | chart | `GET /openbb/factors/{dataset}/chart` | `/factors/{dataset}` |

The macro widget takes a `currency` parameter (`USD`, `EUR`, or empty for both) and shows one card per series: the US 10-year rate, the euro AAA 10-year rate, the ECB deposit rate and the CISS stress index.

Each route takes the parameters of the route it adapts (see the corresponding API reference page), with a few differences: `/openbb/fundamental` has no `fmt`; `/openbb/technical/{ticker}/multi` has no `include_ohlcv` and defaults to `sma_20,ema_50,rsi_14`; `/openbb/technical/{ticker}/chart` defaults to `sma_20,rsi_14`; `/openbb/news/feed` returns 20 articles by default.

The factor exposure widget takes `model` (`ff3`, `ff5`, `carhart`), `frequency` and `window`. Its rows give the annualised alpha, one beta per factor with its standard error and t-stat, the R², the adjusted R², the annualised residual volatility and the periods, then the currency the prices were converted from and the warnings. The factor returns widget draws the cumulative returns of each factor of a dataset (`RF` left out), in US dollars, over the last 10 years unless `start` is given. See [Fama/French factors](./factors.md).

`GET /openbb/quote/{ticker}` never starts a realtime stream: the quote is real time once the ticker is subscribed with `POST /realtime/subscribe`, and the delayed Yahoo Finance price otherwise.

## Example

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/openbb/quote/AIR.PA"
```

```json
[
  { "label": "AIR.PA Price", "value": 154.6, "delta": 0.13 },
  { "label": "Change", "value": "+0.20", "delta": "+0.13%" },
  { "label": "Previous Close", "value": 154.4, "delta": null },
  { "label": "Day High", "value": 155.48, "delta": null },
  { "label": "Day Low", "value": 155.1, "delta": null },
  { "label": "Volume", "value": 18250, "delta": null }
]
```

This example is a delayed Yahoo Finance quote. Tiles without a value (no previous close, no volume…) are left out.
