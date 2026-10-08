---
id: "overview"
title: "Providers Architecture Overview"
sidebar_label: "Overview"
description: "How Fonrex queries its providers in parallel, chooses the search term, validates the values and shares one HTTP layer"
---

# Providers Architecture Overview

Fonrex collects data from public sources through **providers**: 14 for fundamentals, 4 specialised ones, 7 for news, plus Yahoo Finance and TradingView for prices. All of them run inside your instance, from your IP address (or your proxy).

## A `/fundamental` request

```
GET /fundamental?ticker=AIR.PA
      │
      ▼
GetFundamentals  ── listing, ISIN, mappings, verified Yahoo symbol
      │
      ▼
FinancialProviderRunner.run()  ── all providers in parallel (12 s each)
      │      ZoneBourse, GoogleFinance, Boursorama, Barrons, WSJ, MarketWatch,
      │      MorningStar, Investing, Gurufocus, Fortuneo, BourseDirect, MSN,
      │      InvestirLesEchos, YahooFinance  (+ SEC EDGAR insider data, 15 s max)
      ▼
ValidationLayer.validate_results()  ── range and consensus checks, outliers → None
      ▼
FinancialsFormatter.to_eodhd()  ── each figure: Yahoo → stored figures → scraped providers
      ▼
JSON document with a Sources section (cached 1 hour)
```

## The search term of each provider

The runner gives each provider the most reliable identifier it has, in this order:

1. For Yahoo Finance, the **symbol verified for the listing** (from the ISIN, quoted in the listing's currency). A listing without one is not sent to Yahoo — its bare ticker may be another instrument.
2. For Google Finance, the ticker built from the exchange of the listing (`EPA:AIR`); for Gurufocus, the ticker with its Yahoo suffix (`AIR.PA`).
3. An active `provider_url` mapping, then an active `provider_ticker` mapping.
4. The ISIN, for the providers that search by ISIN (ZoneBourse, Investing, WSJ, MarketWatch, Fortuneo, BourseDirect, Boursorama, Gurufocus, InvestirLesEchos).
5. The requested ticker.

The term used is reported per provider in `raw_providers` (`fmt=raw`).

## Resilience

- **Independent providers.** A provider that fails or times out returns an error entry; the others answer.
- **Homonyms rejected.** A scraped provider answering with another ISIN than the instrument's is reported as an error, not merged.
- **Validated values.** The [validation layer](../monitoring/validation-layer.md) discards out-of-range values and consensus outliers before the document is built.
- **One HTTP layer.** Every provider goes through `BaseFinancialProvider`: three attempts with growing pauses on network errors and 429/5xx, final failure on 401/403/404, at most `FONREX_PROVIDER_MAX_CONCURRENCY` simultaneous requests per provider, optional proxy (`FONREX_PROXY_URL`, limited to some providers with `FONREX_PROXY_PROVIDERS`).

## When a website refuses your requests

Websites protected by an anti-bot service increasingly refuse requests from a personal connection (typically `403`). The provider then reports an error and the others answer. Route those providers through an HTTP proxy of your choice:

```env
FONREX_PROXY_URL=http://user:password@proxy.example:8888
FONREX_PROXY_PROVIDERS=Investing,Gurufocus,wallStreetJournal
```

The proxy applies to the scraped websites, not to the `yfinance` and TradingView libraries.

## Related pages

- [Fundamentals providers](fundamentals-providers.md)
- [News providers](news-providers.md)
- [Adding a provider](../guides/adding-providers.md)
