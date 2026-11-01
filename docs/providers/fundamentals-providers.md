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
| `MorningStar` | Morningstar JSON services (screener and `sal-service`) | ISIN, or ticker on the place of its suffix | Global |
| `Investing` | investing.com | ISIN | Global |
| `Barrons` | barrons.com | Ticker | US |
| `wallStreetJournal` | wsj.com | ISIN | US |
| `Marketwatch` | marketwatch.com | ISIN | US |
| `Gurufocus` | gurufocus.com | Ticker with the exchange suffix (`AIR.PA`), otherwise ISIN | Global |

An active mapping of the listing (`provider_url`, then `provider_ticker`) takes precedence over the ISIN or the ticker; MSN receives the ticker resolved from the ISIN when the request names an ISIN. Each provider returns a `FinancialMetrics` object (P/E, EPS, dividend yield, margins, revenue, net income, ESG score, Gurufocus scores…). Some publish displayed percentages: they are declared in `monitoring/units.py` and converted before validation.

In the rendered document, the Yahoo answer and the stored deep fundamentals come first; the scraped providers fill only the trailing P/E, the EPS and the dividend yield when those are missing (Google Finance, Barron's, MarketWatch, WSJ, Investing.com). Every provider answer remains available with `fmt=raw`.

Optional tokens: `BARRONS_TOKEN`, `MARKETWATCH_TOKEN`, `WSJ_TOKEN`.

### What some providers read

- **MorningStar** never reads the quote page of global.morningstar.com (filled by JavaScript, it answers a script with an AWS WAF challenge). The screener of Morningstar turns an ISIN, or a ticker sent without its Yahoo suffix, into the identifier of a share (`0P0000OQN8`): only a share whose ISIN is the one asked, or whose ticker is, on the place the suffix names (`AIR.PA` is Paris, never AAR Corp in New York). Three services are then read in parallel: the overview (price, market capitalisation, volumes, P/S, P/B, PE, dividend yields, star rating), the company profile (sector, industry, staff) and the trading information (beta, shares, short interest). Figures reserved to paying users are left out. The public keys of the site are built in; `MORNINGSTAR_SAL_API_KEY` and `MORNINGSTAR_SAL_REALTIME_TOKEN` replace them only if Morningstar changes them (HTTP 401/403).
- **Gurufocus** reads the summary page of a share (`/stock/TSLA/summary`, `/stock/XPAR:AIR/summary`): GF Score (`/100`), Piotroski F-Score (`/9`), Beneish M-Score, Altman Z-Score, ROIC, PE, net and operating margins, debt to equity, EPS and revenue of the last twelve months. Each figure comes from the row whose label links to its term, never from the first number of the page; the scores and the ROIC are checked against ranges. When the GF Score badge is drawn in the browser, the score is read from the page state written by the server, from the share itself and never from a peer.
- **ZoneBourse** reads the quote page found by its search: name, ISIN, sector, last price and currency, analysts' consensus, number of analysts and target price, staff, MSCI ESG rating, market capitalisation, enterprise value, EV/revenue, float, revenue, net income and net debt. The PER, revenue, net income, net debt and EV/revenue are estimates of the current fiscal year.
- **Investing** reads the equity page in English (`www.investing.com`) or in French (`fr.investing.com`, decimal comma): price, change, currency, and the key figures (PE, EPS, dividend, market capitalisation, revenue, net income, EBITDA, P/B, ROA, ROE, gross margin, beta, 52-week range) plus the industry, sector and staff.

## Specialised providers

| Provider | Source | Route |
|---|---|---|
| `SECEdgar` | SEC EDGAR, Form 4 | `/insider-transactions/{ticker}`, and the `InsiderTransactions` section of `/fundamental` for US shares |
| `JustETF` | justetf.com | `/etf/{isin}/details` |
| `IndexConstituents` | Wikipedia | `/index/{index_name}/constituents` |
| `OpenFIGI` | openfigi.com | Loaded, not used by any route today |
| `Treasury` | home.treasury.gov, daily par yield curves | `/macro/treasury/curve`, `/macro/treasury/series`, and the US risk-free rate of the DCF when FRED gives none |
| `CFTC` | cftc.gov, weekly Commitments of Traders reports (Legacy, TFF, Disaggregated) | `/cot/markets`, `/cot/positions`, `/cot/signals`, `/cot/extremes` |
| `ESEF` | filings.xbrl.org (ESEF annual reports of European listed companies) and GLEIF (LEI of an ISIN) | `/esef/{ticker}/statements`, `/esef/{ticker}/check`, `/esef/{ticker}/filings` |

## Health

Each fundamentals provider is checked every day by the [canary monitor](../monitoring/canary-monitor.md); `GET /health/providers` shows the result. A provider that cannot be imported at start-up is listed in `providers.unavailable` of `GET /health`.
