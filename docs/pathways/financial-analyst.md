---
id: "financial-analyst"
title: "Financial Analyst Pathway"
sidebar_label: "Financial Analyst"
description: "Fundamentals with their sources, DCF valuations, Google Sheets and OpenBB Workspace on your own instance"
---

# Financial Analyst Pathway

This pathway covers the fundamentals and valuation side of Fonrex, and the two no-code front-ends: Google Sheets and OpenBB Workspace. All of them read **your own instance**.

| Need | Where |
|---|---|
| Ratios with their source | `GET /fundamental` (EODHD layout, `Sources` section) |
| Statements, earnings, ratings | `GET /fundamental/deep` |
| Intrinsic value | `GET /dcf/{ticker}` (FCF), `/compare` (three models), `/sensitivity`; `POST /dcf/{ticker}` with your assumptions |
| Spreadsheet | Google Sheets template |
| Dashboards | OpenBB Workspace widgets |

## 1. An instance and a key

Install the instance ([Installation](../getting-started/installation.md)) and create a **read-only key** for the tools that keep it outside your machine:

```
FONREX_READ_ONLY_API_KEYS=frx_live_<random value>
```

## 2. Fundamentals

```bash
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/fundamental?ticker=AIR.PA"
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/fundamental/deep?ticker=AIR.PA"
```

`/fundamental` takes each figure from Yahoo Finance (asked with the symbol verified for the listing), then from the stored figures, then from the scraped websites, and tells you where each one comes from. Ratios are ratios (`0.0125` for 1.25 %). See [Fundamentals](../api-reference/fundamentals.md).

## 3. Valuation

The DCF reads the deep fundamentals stored for the instrument: call `/fundamental/deep` first.

```bash
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/dcf/AIR.PA"
curl -s -H "X-API-KEY: $KEY" "http://localhost:5000/dcf/AIR.PA/sensitivity?model=fcf"
curl -s -X POST -H "X-API-KEY: $KEY" -H "Content-Type: application/json" \
  -d '{"models": ["fcf", "eps", "ddm"], "projection_years": 10, "terminal_growth_rate": 0.02}' \
  http://localhost:5000/dcf/AIR.PA
```

`GET /dcf` computes the FCF model; `/compare` and a `POST` naming several models weigh FCF, EPS and DDM 50/30/20. WACC from CAPM with the 10-year rate of the currency of the statements (FRED for USD, the ECB for EUR). See [Valuation & DCF](../api-reference/valuation-dcf.md).

## 4. Google Sheets

The template refreshes fundamentals, DCF and indicators for a watchlist, and offers `=FONREX_PE()`, `=FONREX_DIVIDEND_YIELD()`, `=FONREX_INTRINSIC_VALUE()` and `=FONREX_RSI()`. Google's servers reach your instance through a tunnel. See the [Google Sheets guide](../guides/google-sheets-connector.md).

## 5. OpenBB Workspace

Add your instance URL as a data source, with your key in the `X-API-KEY` header: 19 widgets and two dashboards (EU Markets, Screener & Macro). See the [OpenBB guide](../guides/openbb-workspace.md).

:::info
Fonrex displays raw financial data and analytical outputs. It does not constitute investment advice.
:::
