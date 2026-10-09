---
id: "ingest-historical-data"
title: "Ingesting Historical Market Data"
sidebar_label: "Ingest Historical Data"
description: "How Fonrex fetches, verifies and stores end-of-day prices per listing"
---

# Ingesting Historical Market Data

Prices are stored per **listing** (ticker + exchange + currency), resolution and trading session. A listing is ingested:

- automatically, the first time `GET /eod/{ticker}` finds nothing stored for the request;
- on demand, with `POST /historical/ingest` or `POST /historical/ingest/bulk`;
- for the whole catalogue, with `scripts/ingest_all.py`.

## The pipeline

`HistoricalIngestionService` runs these steps:

1. **Series** — the ticker designates a listing: the listing bearing that ticker (the primary one first; `currency` or `exchange` choose another), otherwise the preferred listing of the instrument. An instrument without a listing cannot be ingested.
2. **Gap detection** — with no stored bar, ten years are fetched; when the last stored session is today or yesterday, the listing is `up_to_date`; otherwise only the missing days are fetched. A `from_date` older than the first stored bar fetches the older part too. With `force_refresh`, the requested range and the stored range are fetched again in one piece.
3. **Source symbol** — the ticker of your catalogue is not always a Yahoo symbol (`EUCO` is `SYBC.DE` on Yahoo, and `SPFF` alone is a US fund). Fonrex searches Yahoo by the **ISIN**, keeps the first line quoted in the **currency of the listing** with a price, and stores it as the listing's verified symbol. A listing for which nothing matches is not fetched from Yahoo, and is not searched again for 24 hours.
4. **Fetch** — Yahoo Finance with the verified symbol; TradingView as a fallback, accepted only when the line is quoted in the currency of the listing. `open`, `high`, `low` and `close` are the traded prices, adjusted for splits; `adj_close` is the close adjusted for splits **and dividends** (empty for TradingView bars). Each bar is dated by its trading session. The last stored bars are fetched again with the new ones, to check the adjustment (next section).
5. **Normalisation** — bars without prices dropped, inverted high/low fixed, negative volume set to zero, duplicate dates dropped.
6. **Upsert** — batches of 1,000 rows, `ON CONFLICT (asset_listing_id, resolution, time) DO UPDATE`. With `force_refresh`, or when the whole series was fetched again, the stored bars of the fetched range are replaced.
7. **Cache** — the cached answers computed from the ticker's prices (`eod`, `history`, `technical`, `dcf`) are dropped.
8. **Log** — one row in `ingest_log`: status, source, rows added, range, duration, error.

## Splits and dividends: one adjustment for the whole series

Yahoo adjusts a whole history again after each split (all prices) and each dividend (`adj_close`). If the new bars were simply added to the stored ones, the two parts would be adjusted differently and a false return would appear where they meet: about minus the dividend yield after a dividend, -75 % after a four-for-one split.

So Fonrex keeps each series (listing and resolution) on one adjustment:

- To complete a series, it fetches the new sessions **and the last five stored bars**. If the source gives the same prices for those bars, only the new sessions are written.
- If the prices differ — a split or a dividend since the last ingestion — the **whole series is fetched again** and replaces the stored one. The result says so in `note`: `Whole history fetched again: the source adjusted the stored bars again (split or dividend)`. If that fetch fails, nothing is written and the ingestion fails with the reason.
- The table `price_series_adjustments` records, per series, how its bars are adjusted and when it was last fetched in one piece.

Use `close` for prices as traded (charts, indicators, valuation), `adj_close` for returns that include dividends (performance, beta, backtests).

:::note After upgrading to migration 016
Series stored before migration 016 hold the dividend-adjusted price in `close`. Each one is fetched again in full at its next ingestion. To do it at once for the whole catalogue:

```bash
docker compose exec fonrex-api python scripts/ingest_all.py --force
```
:::

## When a ticker gets no price, or the wrong one

The ingestion result says why:

```json
{
  "ticker": "GOVY",
  "status": "failed",
  "error": "No Yahoo symbol quoted in CHF for ISIN IE00B3S5XW04; Yahoo offers SYBB.DE (EUR)"
}
```

- **Several listings share the ticker**: name the one you want — `POST /historical/ingest?ticker=GOVY&currency=CHF`.
- **Which symbol was used**: `provider_symbol` in the result; `note` says why TradingView was used instead of Yahoo.
- **Look the symbol up again, or replace an old series**: `POST /historical/ingest?ticker=<ticker>&force_refresh=true`.
- **Set the symbol yourself** when you know the right line (it is then trusted as it is):

```bash
docker compose exec -T db psql -U fonrex -d fonrex -c "
  INSERT INTO asset_mappings (asset_id, asset_listing_id, provider_name, provider_ticker,
                              source, is_active, failure_count, created_at, updated_at)
  SELECT l.asset_id, l.id, 'YahooFinance', 'GOVY.SW', 'manual', true, 0, now(), now()
  FROM asset_listings l WHERE l.ticker = 'GOVY' AND l.currency = 'CHF'
  ON CONFLICT (asset_listing_id, provider_name)
  DO UPDATE SET provider_ticker = EXCLUDED.provider_ticker, source = 'manual', is_active = true"
```

## Ingesting the whole catalogue

```bash
docker compose exec fonrex-api python scripts/ingest_all.py
```

| Option | Default | Description |
|---|---|---|
| `--resolution` | `1D` | `1D`, `1W` or `1M` |
| `--source` | `auto` | `auto`, `yfinance` or `tradingview` |
| `--force` | off | Fetch every history again (no gap detection) |
| `--concurrency` | `5` | Parallel ingestions |

A short random pause precedes each ticker so as not to hammer the sources.

## Keeping or deleting old prices

A first ingestion fetches ten years. `POST /database/cleanup` deletes prices older than `days_to_keep` days — **730 by default**, which would remove eight of those ten years. Count first with `dry_run`:

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"days_to_keep": 3650, "dry_run": true}' http://localhost:5000/database/cleanup
```

## Upgrading from shared series (migration 014)

Before migration 014, the listings of one instrument shared one series and European or Asian sessions were dated the day before. The migration rebuilds `prices_eod` per listing and re-dates the existing rows; nothing has to be downloaded again. If a series looks wrong afterwards, replace it with `force_refresh=true`. Back up the database before upgrading.
