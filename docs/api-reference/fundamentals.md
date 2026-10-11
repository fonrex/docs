---
id: "fundamentals"
title: "Fundamental Financials API Reference"
sidebar_label: "Fundamentals"
description: "Multi-provider fundamentals in the EODHD layout and stored deep fundamentals"
---

# Fundamental Financials API Reference

Two routes serve fundamentals:

- `GET /fundamental` builds one document from Yahoo Finance, the figures stored in the database and the scraped providers, with the source of every figure.
- `GET /fundamental/deep` returns what the deep enrichment stored: highlights, financial statements, earnings history and analyst ratings.

Ratios are ratios: a 0.32 % dividend yield is `0.0032`.

---

## <span className="api-method get">GET</span> `/fundamental`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `ticker` | string | — | Ticker (e.g. `AIR.PA`). `ticker` or `isin` is required |
| `isin` | string | — | ISIN of the instrument |
| `exchange` | string | — | Exchange, to choose a listing |
| `currency` | string | — | Currency, to choose a listing |
| `provider` | string | all | One provider name, or several separated by commas, instead of all of them |
| `fmt` | string | `eodhd` | `eodhd` (rendered document) or `raw` (the answer of each provider) |
| `nocache` | boolean | `false` | Ignore the cached answer |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/fundamental?ticker=AIR.PA"
```

### The rendered document (`fmt=eodhd`)

| Section | Content |
|---|---|
| `General` | Name, ISIN, exchange, currency, country, sector and industry, description, address, website |
| `Highlights` | Market capitalisation, EBITDA, P/E, EPS, dividend yield, margins, returns, revenue… |
| `Valuation` | Trailing and forward P/E, price/sales, price/book, enterprise value ratios |
| `SharesStats` | Shares outstanding and float, insider and institution ownership, short interest |
| `Technicals` | Beta, 52-week high and low, moving averages |
| `SplitsDividends` | Dividend rate and yield, payout ratio, dates, last split |
| `AnalystRatings` | Consensus, target price, number of buy/hold/sell ratings |
| `Holders`, `InsiderTransactions`, `ESGScores` | Holders, SEC Form 4 transactions (US shares), ESG scores |
| `Earnings`, `Financials` | Stored earnings history and financial statements |
| `Providers` | What each provider returned |
| `Sources` | The source of each figure, e.g. `{"Highlights": {"PERatio": "YahooFinance", "PEGRatio": "database (2026-10-01)"}}` |
| `ETF_Data` | Only for an ETF |

Each figure is taken, in this order, from:

1. the Yahoo Finance answer of this request;
2. the figures stored by the deep enrichment, reported as `database (date of the fetch)`;
3. for the trailing P/E, the earnings per share and the dividend yield only, the scraped providers publishing the same quantity (Google Finance, Barron's, MarketWatch, WSJ, Investing.com).

Estimates for the current year (Boursorama, ZoneBourse) and quarterly figures (Google Finance) are other quantities: they are never used as a fallback but remain available with `fmt=raw`.

### Which instrument is asked

For a listing of your catalogue, Yahoo Finance is asked with the **symbol verified for the listing** (found from the ISIN and checked against the currency of the listing), never with the bare ticker, which may be another instrument on Yahoo. Without a verified symbol, Yahoo is not asked and its entry says why. Scraped providers are searched by mapping, ISIN or ticker; a provider that answers about another ISIN is reported as an error.

Every value goes through the [validation layer](../monitoring/validation-layer.md) before it is used.

The complete answer is cached one hour; `nocache=true` bypasses it.

---

## <span className="api-method get">GET</span> `/fundamental/deep`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `ticker` / `isin` | string | — | The instrument (one of the two is required) |
| `refresh` | boolean | `false` | Fetch again from Yahoo Finance instead of using the cached answer |
| `sections` | string | `all` | `all`, or a comma-separated list among `highlights`, `statements`, `earnings`, `ratings` |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/fundamental/deep?ticker=AIR.PA&sections=highlights,ratings"
```

Answer layout:

```json
{
  "asset_profile": { "isin": "NL0000235190", "ticker": "AIR.PA", "name": "Airbus SE", "exchange": "XPAR", "currency": "EUR" },
  "highlights": { "pe_ratio": 28.5, "dividend_yield": 0.0125, "roe": 0.162, "...": "..." },
  "statements": {
    "income":   { "annual": [ { "period_end": "2025-12-31", "...": "..." } ], "quarterly": [] },
    "balance":  { "annual": [], "quarterly": [] },
    "cashflow": { "annual": [], "quarterly": [] }
  },
  "earnings_history": [ { "...": "..." } ],
  "analyst_ratings": { "...": "..." },
  "meta": { "fetched_at": "2026-10-08T16:40:00+00:00", "source": "yfinance", "cache_hit": false, "symbol": "AIR.PA" }
}
```

The figures are fetched from Yahoo Finance with the verified symbol (`meta.symbol`) and stored. Without a verified symbol nothing is fetched: the answer is what the database already holds, `meta.source` is `database` and `meta.note` gives the reason. Complete answers are cached 24 hours per instrument; a request receives only the sections it asked for.

---

## Legacy routes

`GET /stocks` (market overview) and `GET /stocks/{ticker}/financials` remain from earlier versions. They ask Yahoo Finance with the ticker as typed; prefer `/fundamental`.
