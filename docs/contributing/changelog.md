---
id: "changelog"
title: "Fonrex Version Changelog"
sidebar_label: "Changelog"
description: "Project history, feature additions, schema migrations, and version updates"
---

# Fonrex Version Changelog

## Next release

### Prices
- **`close` is the traded close again**, adjusted for splits only; **`adj_close`** is adjusted for splits and dividends. Before, both held the dividend-adjusted price.
- **One adjustment per series.** A split or a dividend after the last ingestion used to leave a false return where the stored and the new bars met (about minus the dividend yield, -75 % after a 4-for-1 split). The ingestion now compares the last stored bars with the source and fetches the whole series again when they differ. Migration 016 adds `price_series_adjustments`; series stored before are fetched again at their next ingestion (`scripts/ingest_all.py --force` for all at once).
- **`isin` parameter** on `GET /eod/{ticker}`, `GET /ticker/{symbol}/history` and `POST /historical/ingest`: names the instrument when several share a ticker. The answers give the `listing` they read.

### Euro rates and currency of the valuation
- **The DCF discounts with the risk-free rate of the currency of the statements**: FRED for USD, the AAA euro area rate of the ECB for EUR, `DCF_RISK_FREE_RATE` otherwise. A euro company is no longer discounted with the US rate. The answer gives `price_currency`, `warnings` and `wacc.risk_free_rate_currency`.
- **A price in another currency gives no upside** instead of a wrong one; a price in pence is turned into pounds. Each model now gives its own `upside_pct` (it was always 0).
- **`GET /macro/rates?currency=`**: the ECB rates (AAA 10-year, deposit facility rate, CISS) next to the FRED rate; each rate says its `source`, `currency` and `freshness`. The OpenBB macro widget shows one card per series.
- The enrichment records the **currency of the statements** (migration 018) and reads Yahoo's dates in seconds (migration 019: no more 1970-01-01).
- **`AIR.PA` is Airbus, never AAR Corp**: a ticker looked up without its suffix designates a listing on the exchange of the suffix only. The `/fundamental/deep` cache is kept per instrument.

### Fama/French factors
- **Factor returns** of the Kenneth French Data Library: US, Europe and developed markets, 3 factors, 5 factors and momentum, monthly and daily, in US dollars (`GET /factors`, `GET /factors/{dataset}`, `POST /factors/refresh`, `scripts/load_factors.py`; migration 020).
- **Factor exposure of a listing**: `GET /factors/exposure/{ticker}` regresses its excess returns on the factors of its region (`ff3`, `ff5`, `carhart`): betas, t-stats, annualised alpha, R².
- **ECB exchange rates** of the euro, day by day since 1999, to compare a listing quoted in another currency in dollars (`fx_rates`, `scripts/load_fx_rates.py`; migration 021).
- **Cost of equity from the factors** in the DCF: `wacc_params.cost_of_equity_model` = `ff3`, `ff5` or `carhart` on `POST /dcf/{ticker}`. The CAPM stays the default.
- Two **OpenBB widgets**: factor exposure and factor returns, in a new *Factors* tab of the EU Markets app.

### Eurostat indicators
- **Inflation, unemployment, GDP growth and business surveys** of the euro area and of each EU country, from Eurostat (free, no key): `GET /macro/indicators` (latest values with the change on the previous period), `GET /macro/indicators/{indicator}` (series of up to 10 countries), `POST /macro/indicators/refresh`. See [Macro indicators](../api-reference/macro-indicators.md).
- Kept period by period in `macro_observations` (migration 022); a revision of Eurostat, such as the final figure after a flash inflation estimate, replaces the value of its period. New settings `EUROSTAT_REFRESH_HOURS` and `EUROSTAT_API_URL`.
- Two **OpenBB widgets**: the indicators of a country as cards, and one indicator of several countries as a chart, in the *Macro Context* tab of the Screener & Macro app.

### SEC filings (XBRL)
- **Annual statements filed with the SEC**, read from the XBRL facts of EDGAR (free, no key): `GET /sec/{ticker}/statements` gives each figure with its XBRL concept and a link to its filing. 10-K, 20-F and 40-F reports only; a restatement replaces the value it corrects. See [SEC filings](../api-reference/sec-filings.md).
- **The Yahoo statements checked against the SEC**: `GET /sec/{ticker}/check` gives, year by year, `match`, `mismatch`, `missing_yahoo` or `missing_sec` for each figure both sources define alike. `POST /sec/{ticker}/refresh` reads a company again at once.
- **The CIK is never guessed from a ticker**: only a US listing of the instrument is looked up, and the name at the SEC must match. `AIR.PA` (Airbus) is never confused with `AIR` (AAR Corp).
- Facts kept in `xbrl_facts` and `sec_company_loads` (migration 023). New settings `SEC_XBRL_REFRESH_HOURS` and `SEC_CHECK_TOLERANCE`; a warning at start-up while `SEC_EDGAR_EMAIL` is the address of the example.
- One **OpenBB widget**: *Fonrex SEC Check*, the check as a table, gaps first.

### US Treasury yield curves
- **The daily yield curves of the US Treasury**, free files without key: the nominal curve since 1990 (1 month to 30 years) and the real curve (TIPS) since 2003 (5 to 30 years). See [Treasury yield curves](../api-reference/treasury-curves.md).
- `GET /macro/treasury/curve` gives the curve of a day with the **breakeven inflation** and comparisons with other days (`compare=1M`, `1Y` or a date); `GET /macro/treasury/series` maturities and **spreads** (`10Y-2Y`) over time; `POST /macro/treasury/refresh` and `scripts/load_treasury_curve.py` read years on demand.
- Kept day by day in `yield_curve_points` (migration 024): a year is read only when a request needs it, a past year read after its end never again, the current year after `TREASURY_REFRESH_HOURS` (new setting, 12 by default).
- **The US risk-free rate of the DCF without FRED key**: when FRED gives no rate, the 10-year rate of the Treasury curve is used (`treasury_live`, `treasury_cached`, `treasury_stale`) instead of `DCF_RISK_FREE_RATE`.
- Two **OpenBB widgets** (26 in all): the curve of the day with the curves of 1 month and 1 year before, and the 10-year minus 2-year spread, in the *Macro Context* tab of the Screener & Macro app.

### CFTC Commitments of Traders
- **The weekly Commitments of Traders reports of the CFTC**, free files without key: Legacy since 1986, Traders in Financial Futures and Disaggregated since June 2006, futures only. The positions of the speculators (non-commercial, leveraged funds, managed money) and of every other type of trader, in the US futures markets: stock indices, rates, currencies, commodities. See [Commitments of Traders](../api-reference/cot.md).
- `GET /cot/markets` lists the markets by CFTC code; `GET /cot/positions` gives every type of trader of a market; `GET /cot/signals` the **net position**, its share of the open interest, its change and the **COT index** (0 to 100 over a window of weeks); `GET /cot/extremes` the most extreme positioning of the key markets; `POST /cot/refresh` and `scripts/load_cot.py` read years on demand.
- Each report date comes with its **estimated day of publication** (the Friday after it), for backtests without look-ahead.
- Kept week by week in `cot_weeks` and `cot_positions` (migration 025): a year is read only when a request needs it, the years up to 2016 once, the current year after `COT_REFRESH_HOURS` (new setting, 24 by default).
- Two **OpenBB widgets** (28 in all): the positioning of a market with its COT index, and the most extreme positioning of the key markets, in the *Macro Context* tab of the Screener & Macro app.

## October 2026 — Secure defaults, per-listing prices, verified provider data

Merged on `main` on 8 October 2026 (pull request #15).

### ⚠️ Breaking changes
- **An API key is required by default.** Every route except `/health`, the documentation, `/widgets.json`, `/apps.json` and `/static` answers `401` until `FONREX_API_KEY` is set. `FONREX_AUTH_REQUIRED=false` only opens an instance with no key configured. New **read-only keys** (`FONREX_READ_ONLY_API_KEYS`) for clients outside the machine.
- **`GET /quote` and `GET /openbb/quote` no longer start a realtime stream.** Use `POST /realtime/subscribe`; `subscribe_if_missing=true` remains on `/quote` for full-access keys.
- **Prices are stored per listing** (migration 014): `prices_eod` is keyed by `(asset_listing_id, resolution, time)` and dated by trading session. The migration converts existing rows; back up before upgrading.
- **Dividend yields are ratios** everywhere, including stored values (migration 015).

### Security and operations
- Docker Compose loads `.env` and overrides the service addresses; PostgreSQL and Redis published on `127.0.0.1` only; database volume mounted on the right data directory.
- Usage log written in background batches, without the caller's IP by default (`USAGE_LOG_IP`), purged after `USAGE_LOG_RETENTION_DAYS`.
- `POST /database/cleanup` bounded (`days_to_keep` ≥ 30) with a `dry_run`.
- Redis cache entries are JSON only.

### Data quality
- Prices and fundamentals of a listing are fetched with a **Yahoo symbol verified** from the ISIN and the currency of the listing; a listing without one is not ingested, and the answer says why.
- Providers read the figures their pages really display (`financials/numbers.py`); percentages are normalised before validation; an answer about another ISIN is rejected.
- `/fundamental` builds each figure from Yahoo, then the stored figures, then the scraped providers, and names the source in a `Sources` section.
- Financial statements are read by fiscal year (DCF, solvency ratios).
- Every request parameter is part of its cache key (fundamentals, news, insider transactions, technical indicators per listing).
- The stored risk-free rate is refreshed from FRED; each realtime tick reaches each WebSocket client once.
- Migration 014 waits for running TimescaleDB jobs instead of deadlocking with them.

### Quality
- Locked, hash-checked dependencies; a coverage floor per module (global 70 %); database tests on TimescaleDB in the CI; guards keeping `ARCHITECTURE.md` and `AGENTS.md` in step with the code.


## v1.6.0 (2026-09)

### Major Features
- **OpenBB Workspace Integration**: Native backend adapter router (`/openbb`) supporting 19 interactive widgets and 2 pre-assembled application dashboards (`Fonrex — EU Markets` & `Fonrex — Screener & Macro`).
- **Dual Header Authentication**: Added support for OpenBB's native `X-API-KEY` custom header alongside standard `Authorization: Bearer` token validation (`auth/dependencies.py`).
- **Plotly & AgGrid Adapters**: Standardized data transformations for Plotly figures (candlestick charts, technical indicator overlays) and AgGrid tables (deep fundamentals, DCF sensitivity matrix, news, index constituents).

### 🐛 Bug Fixes & Improvements
- **Docker Volume Logging**: Solved volume permission issues on host environments by ensuring `mkdir -p logs` setup step and added permission troubleshooting guides.
- **DCF & Provider Updates**: Improved caching and data normalization for DCF valuation models and index constituent providers.

## v2.0.0 (2026-08)


### Major Features
- **Docusaurus v3 Documentation Suite**: Complete technical documentation structure generated under `documentation/`.
- **Provider Health Monitoring (Phase 12)**: Implemented `ValidationLayer`, `CanaryMonitor`, `provider_health_log` TimescaleDB hypertable, daily consensus aggregation, and 7 REST health endpoints (`/health/*`).
- **Valuation & DCF Engine (Phase 11)**: Integrated FCF, EPS, and DDM intrinsic value models with dynamic WACC calculation and sensitivity matrices (`/dcf/*`).
- **News Aggregator (Phase 10)**: Multi-provider scraping engine (`NewsService`) across 7 sources with `ON CONFLICT (url)` deduplication and Redis caching (`/news/*`).
- **ISIN Asset Architecture (Phase 9)**: Refactored asset database schema into `assets`, `asset_listings`, and `asset_mappings` with partial unique ISIN index.

### 🐛 Bug Fixes & Refactoring
- Legacy codebase cleanup (`eod/`, `record/`, `seed_assets.py` purged).
- Standalone ISIN deduplication tool `scripts/clean_isin_duplicates.py`.
- Thread pool executor concurrency boundaries via `concurrency.py`.
