---
id: "openbb-workspace"
title: "Connecting Fonrex to OpenBB Workspace"
sidebar_label: "OpenBB Workspace Guide"
description: "Step-by-step guide to connect self-hosted Fonrex data pipelines to OpenBB Workspace dashboards"
---

# Connecting Fonrex to OpenBB Workspace

[OpenBB Workspace](https://openbb.co) is a modern open-source financial terminal and dashboard platform. Fonrex includes native integration adapters that allow you to connect your self-hosted Fonrex API instance directly to OpenBB Workspace.

By connecting Fonrex, you bring European fundamentals, DCF valuations, custom technical indicator calculations, and multi-source aggregated financial news into your OpenBB desktop or cloud workspace.

---

## Prerequisites

Before starting, ensure you have:

1. A running Fonrex API instance (accessible locally at `http://localhost:5000` or hosted via custom domain/relay).
2. OpenBB Workspace (Desktop application or Web interface).
3. If your Fonrex instance has authentication enabled (`FONREX_AUTH_REQUIRED=true` or `OPENBB_API_KEY` set), have your API key ready (e.g. `frx_live_...`).

---

## Step-by-Step Setup

### Step 1: Add Fonrex as a Data Source in OpenBB

1. Open **OpenBB Workspace**.
2. Right-click anywhere on your workspace grid and select **"Add data"** (or open **Backend Connections** in Settings).
3. Enter your Fonrex backend URL:
   - For local development: `http://localhost:5000`
   - For remote deployments: `https://your-fonrex-instance.com`
4. OpenBB Workspace will automatically ping `/openbb/widgets.json` to discover all 19 available widgets.

### Step 2: Configure Authentication Headers

If your Fonrex server requires an API key:

1. In the backend setup modal in OpenBB, add a custom request header:
   - Header Name: `X-API-KEY`
   - Header Value: `frx_live_your_api_key_here`
2. Alternatively, standard `Authorization: Bearer frx_live_...` is also supported.
3. Click **Save Connection**.

### Step 3: Import Dashboard Applications

Fonrex provides two pre-configured multi-tab dashboards via `/openbb/apps.json`:

#### 1. Fonrex — EU Markets
A full single-ticker analytical suite containing:
- **Overview Tab**: Live quote metrics, deep fundamentals, and EOD candlestick price chart.
- **Valuation Tab**: DCF intrinsic value calculation and WACC × growth sensitivity matrix.
- **Technical Tab**: Overlaid technical indicator chart (RSI, SMA, MACD).
- **News Tab**: Deduplicated news feed from 7 financial news providers.

#### 2. Fonrex — Screener & Macro
An idea generation and market context workspace:
- **Screener Tab**: Real-time technical screener table.
- **Macro Context Tab**: Key macroeconomic interest rates (FRED) and major index constituents (S&P 500, CAC 40, NASDAQ 100, DAX).

To import:
1. Open the **Apps / Marketplace** menu in OpenBB.
2. Select **"Import App"** and choose **Fonrex — EU Markets**.

---

## Widget Reference Summary

| Widget ID | Name | Category | Output Type |
|---|---|---|---|
| `fonrex_fundamentals` | Fonrex Fundamentals | Fundamentals | Table |
| `fonrex_fundamentals_deep` | Fonrex Deep Fundamentals | Fundamentals | Table |
| `fonrex_eod` | Fonrex EOD History | Historical | Chart (Plotly) |
| `fonrex_history` | Fonrex OHLCV History | Historical | Chart (Plotly) |
| `fonrex_quote` | Fonrex Quote | Market Data | Metric |
| `fonrex_quotes_batch` | Fonrex Batch Quotes | Market Data | Table |
| `fonrex_technical` | Fonrex Technical Indicator | Technical | Chart (Plotly) |
| `fonrex_technical_multi` | Fonrex Multi-Indicator | Technical | Chart (Plotly) |
| `fonrex_technical_chart` | Fonrex Technical Chart | Technical | Chart (Plotly) |
| `fonrex_screener` | Fonrex Technical Screener | Technical | Table |
| `fonrex_news` | Fonrex Ticker News | News | Table |
| `fonrex_news_feed` | Fonrex News Feed | News | Table |
| `fonrex_dcf` | Fonrex DCF Valuation | Valuation | Table |
| `fonrex_dcf_compare` | Fonrex DCF Compare | Valuation | Table |
| `fonrex_dcf_sensitivity` | Fonrex DCF Sensitivity | Valuation | Table |
| `fonrex_insider_transactions` | Fonrex Insider Trading | Fundamentals | Table |
| `fonrex_etf_details` | Fonrex ETF Details | Fundamentals | Table |
| `fonrex_index_constituents` | Fonrex Index Constituents | Market Data | Table |
| `fonrex_macro_rates` | Fonrex Macro Rates | Macro | Metric |

---

## Troubleshooting Connection Issues

- **Connection Refused**: Verify `docker compose ps` shows `fonrex-api` is running and port `5000` is exposed.
- **401 / 403 Errors**: Check that the `X-API-KEY` header in OpenBB matches the key set in your Fonrex `.env`.
- **CORS Errors**: If running OpenBB Web, ensure your server allows requests from OpenBB domain or set `CORS_ORIGINS=*` in `.env`.
