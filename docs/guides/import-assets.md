---
id: "import-assets"
title: "Asset CSV Import Pipeline Guide"
sidebar_label: "Import Assets"
description: "Import instruments and listings from CSV files with import_assets.py"
---

# Asset CSV Import Pipeline Guide

`import_assets.py` loads instruments and their listings from CSV files into the catalogue. It is idempotent: importing a file twice updates the rows instead of duplicating them.

## CSV format

```csv
name,ticker,isin,productType,currency
Airbus SE,AIR.PA,NL0000235190,STOCK,EUR
Apple Inc,AAPL,US0378331005,STOCK,USD
Apple Inc,APC.DE,US0378331005,STOCK,EUR
iShares Core MSCI World UCITS ETF,EUNL.DE,IE00B4L5Y983,ETF,EUR
```

| Column | Rule |
|---|---|
| `name` | Not empty |
| `ticker` | At most 20 characters |
| `isin` | 12 characters, `[A-Z]{2}[A-Z0-9]{10}` |
| `productType` | `STOCK` or `ETF` |
| `currency` | 3 upper-case letters |

Rows are deduplicated on `(isin, ticker, currency)`. The exchange of a listing is deduced from the ticker suffix (`AIR.PA` → `XPAR`, `BMW.DE` → `XETR`); a ticker without suffix gets no exchange.

The image ships two catalogues: `data/etf.csv` and `data/stocks.csv`.

## What the import writes

```
CSV file
  │ parse_csv(): validation, deduplication
  ▼
AssetImporter.run()  — batches of 200 rows
  ├─ one row of assets per ISIN
  ├─ one row of asset_listings per (instrument, ticker, exchange, currency)
  └─ default mappings: YahooFinance and GoogleFinance
```

- The first listing of an instrument is its **primary** listing; when none is primary yet, a listing in USD, GBP, JPY, CHF, CAD or AUD becomes primary. The listings already stored by an earlier batch or import count: an instrument has **at most one primary listing**, enforced by the unique index `uq_asset_listings_one_primary` (migration 029).
- A row whose exchange is known (from the file or the ticker suffix) matches the listing of that exchange only. A row **without exchange** matches the listing of the same instrument, ticker and currency whatever its exchange, the primary one first, then the oldest: the enrichment fills the blank exchange of an imported listing, and importing the file again must not create a second one.
- The import makes **no network call**. The Yahoo Finance mapping it writes is the ticker of the file, not verified: the first ingestion or fundamentals request of the listing replaces it with the Yahoo symbol verified from the ISIN and the currency.

## Commands

```bash
# One file
docker compose exec fonrex-api python import_assets.py --file data/etf.csv

# Simulation, nothing written
docker compose exec fonrex-api python import_assets.py --file data/etf.csv --dry-run

# Every CSV file of a directory
docker compose exec fonrex-api python import_assets.py --dir data/isin_data

# Without --file or --dir: data/etf.csv and data/stocks.csv
docker compose exec fonrex-api python import_assets.py
```

Options: `--batch-size` (rows per transaction, 200), `--verbose`.

A simple file name is looked up in `data/isin_data/`, then in the application folder; a relative or absolute path is used as it is.

## Enrichment from Yahoo Finance

The deep enrichment (highlights, financial statements, earnings, analyst ratings) is a separate step:

```bash
# One instrument
docker compose exec fonrex-api python import_assets.py --enrich-only --isin US0378331005

# The instruments of a file
docker compose exec fonrex-api python import_assets.py --enrich-only --file data/etf.csv --limit 100
```

`--enrich-only` needs `--isin` or `--file`. Yahoo is asked with the symbol verified for the primary listing; an instrument without a verified symbol is skipped and the log says why. `GET /fundamental/deep?ticker=...&refresh=true` does the same for one instrument through the API.

`make db-seed` imports the default catalogue and enriches it (`scripts/seed_database.py --enrich`).

## Removing ISIN duplicates

Databases created before the ISIN uniqueness rule may hold the same ISIN twice. `scripts/clean_isin_duplicates.py` merges them onto the oldest row:

```bash
docker compose exec fonrex-api python scripts/clean_isin_duplicates.py --diagnose-only   # read only
docker compose exec fonrex-api python scripts/clean_isin_duplicates.py --dry-run         # run, then roll back
docker compose exec fonrex-api python scripts/clean_isin_duplicates.py --create-index    # clean + unique index
```

## Removing listing duplicates

Before the matching rule above, importing a file again after its enrichment created a second listing (empty exchange) next to the enriched one. `scripts/clean_listing_duplicates.py` removes them and keeps the oldest listing:

```bash
docker compose exec fonrex-api python scripts/clean_listing_duplicates.py --dry-run   # run, then roll back
docker compose exec fonrex-api python scripts/clean_listing_duplicates.py             # cleanup
docker compose exec fonrex-api python scripts/clean_listing_duplicates.py --isin US0378331005 --dry-run
```

- A duplicate without prices is deleted, with its mappings.
- A duplicate that holds prices is reported and kept. Prices are checked again right before each delete, so the script can run while the scheduler ingests.
- When the deleted duplicate was the primary listing, the kept listing becomes primary.

For a duplicate that holds prices, the report says whether the kept listing has prices too. If it has none, move the bars to it; otherwise the bars of the duplicate are a second copy of the same series and can be deleted. Then run the script again:

```sql
-- the kept listing has no prices
UPDATE prices_eod SET asset_listing_id = <kept_id> WHERE asset_listing_id = <duplicate_id>;
-- the kept listing has its own prices
DELETE FROM prices_eod WHERE asset_listing_id = <duplicate_id>;
```

## Next step

Ingest the prices of the imported listings — see [Ingesting historical data](ingest-historical-data.md).
