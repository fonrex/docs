---
id: "fundamentals-providers"
title: "Fundamental Providers List"
sidebar_label: "Fundamentals Providers"
description: "The providers queried by /fundamental and the specialised providers"
---

# Fundamental Providers List

## Providers of `/fundamental`

These names are the keys of the answer and the values accepted by the `provider` parameter (any case).

| Provider | Source | Searched by | Region |
|---|---|---|---|
| `YahooFinance` | Yahoo Finance (`yfinance` library) | Verified symbol of the listing | Global |
| `ZoneBourse` | zonebourse.com | ISIN | Europe |
| `Boursorama` | boursorama.com | ISIN | France / Europe |
| `Fortuneo` | fortuneo.fr | ISIN | France |
| `BourseDirect` | boursedirect.fr | ISIN | France |
| `InvestirLesEchos` | investir.lesechos.fr | ISIN | France |
| `GoogleFinance` | google.com/finance | Ticker with the exchange of the listing (`EPA:AIR`) | Global |
| `Msn` | msn.com/money | Ticker | Global |
| `MorningStar` | morningstar | Ticker | Global |
| `Investing` | investing.com | ISIN | Global |
| `Barrons` | barrons.com | Ticker | US |
| `wallStreetJournal` | wsj.com | ISIN | US |
| `Marketwatch` | marketwatch.com | ISIN | US |
| `Gurufocus` | gurufocus.com | Ticker with the exchange suffix (`AIR.PA`), otherwise ISIN | Global |

An active mapping of the listing (`provider_url`, then `provider_ticker`) takes precedence over the ISIN or the ticker; MSN receives the ticker resolved from the ISIN when the request names an ISIN. Each provider returns a `FinancialMetrics` object (P/E, EPS, dividend yield, margins, revenue, net income, ESG score, Gurufocus scores…). Some publish displayed percentages: they are declared in `monitoring/units.py` and converted before validation.

In the rendered document, the Yahoo answer and the stored deep fundamentals come first; the scraped providers fill only the trailing P/E, the EPS and the dividend yield when those are missing (Google Finance, Barron's, MarketWatch, WSJ, Investing.com). Every provider answer remains available with `fmt=raw`.

Optional tokens: `BARRONS_TOKEN`, `MARKETWATCH_TOKEN`, `WSJ_TOKEN`.

## Specialised providers

| Provider | Source | Route |
|---|---|---|
| `SECEdgar` | SEC EDGAR, Form 4 | `/insider-transactions/{ticker}`, and the `InsiderTransactions` section of `/fundamental` for US shares |
| `JustETF` | justetf.com | `/etf/{isin}/details` |
| `IndexConstituents` | Wikipedia | `/index/{index_name}/constituents` |
| `OpenFIGI` | openfigi.com | Loaded, not used by any route today |

## Health

Each fundamentals provider is checked every day by the [canary monitor](../monitoring/canary-monitor.md); `GET /health/providers` shows the result. A provider that cannot be imported at start-up is listed in `providers.unavailable` of `GET /health`.
