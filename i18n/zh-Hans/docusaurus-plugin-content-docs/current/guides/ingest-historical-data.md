---
id: "ingest-historical-data"
title: "摄取历史市场数据"
sidebar_label: "摄取历史数据"
description: "历史每日回填、缺口检测及全局数据库摄取 CLI 指南"
---


# 摄取历史市场数据

本指南介绍了 Fonrex 如何处理历史 EOD 数据摄取、时间缺口检测、回退和全局回填。

## The Ingestion Pipeline (`HistoricalIngestionService`)

当触发摄取任务（通过 API 或 CLI）时，`HistoricalIngestionService` 执行 7 个步骤：

1. **Listing Resolution**: Maps the requested ticker to its canonical asset ID and exchange listing.
2. **Gap Detection**: Queries `prices_eod` to find missing date ranges. If data exists up to yesterday, ingestion is skipped (`status: up_to_date`).
3. **主提取**：从 Yahoo Finance 异步获取每日 OHLCV K 线。
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
