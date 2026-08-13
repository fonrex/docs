---
id: "ingest-historical-data"
title: "Ingesting Historical Market Data"
sidebar_label: "Ingest Historical Data"
description: "Guide to historical daily backfills, gap detection, and global database ingestion CLI"
---

# Ingesting Historical Market Data

This guide covers how Fonrex handles historical EOD data ingestion, temporal gap detection, fallbacks, and global backfills.

## The Ingestion Pipeline (`HistoricalIngestionService`)

When an ingestion task is triggered (via API or CLI), `HistoricalIngestionService` performs 7 steps:

1. **Listing Resolution**: Maps the requested ticker to its canonical asset ID and exchange listing.
2. **Gap Detection**: Queries `prices_eod` to find missing date ranges. If data exists up to yesterday, ingestion is skipped (`status: up_to_date`).
3. **Primary Extraction**: Fetches daily OHLCV bars asynchronously from Yahoo Finance.
4. **Fallback Extraction**: If Yahoo Finance fails or returns incomplete bars, it seamlessly fails over to a TradingView WebSocket bridge.
5. **Bar Normalization**: Validates positive prices, fixes inverted high/low boundaries, and cleans missing dates.
6. **Batch Upsert**: Executes native PostgreSQL `INSERT ... ON CONFLICT (time, asset_id) DO UPDATE` in batches of 1,000 bars.
7. **Cache Invalidation**: Scans and flushes all Redis historical cache keys for the ticker.

## Ingesting All Tickers via CLI

To backfill historical data for every financial asset stored in your database, run the `scripts/ingest_all.py` CLI utility:

```bash
docker compose exec fonrex-api python scripts/ingest_all.py
```

### Options

```bash
# Limit to 50 assets with 8 parallel concurrency workers
docker compose exec fonrex-api python scripts/ingest_all.py --limit 50 --concurrency 8

# Force re-ingestion of existing date ranges
docker compose exec fonrex-api python scripts/ingest_all.py --force
```
