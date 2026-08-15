---
id: "import-assets"
title: "资产 CSV 导入流水线指南"
sidebar_label: "CSV 资产导入"
description: "如何使用基于 ISIN 去重的 CSV 流水线填充和丰富您的资产库"
---


# 资产 CSV 导入流水线指南

Fonrex includes a dedicated asset ingestion pipeline (`import_assets.py`) designed to seed instruments, listings, and provider mappings from CSV files located in `data/isin_data/`.

## Workflow Overview

```
CSV File (data/isin_data/*.csv)
       │
       ▼
parse_csv() ──► Validates ISIN, ticker length, currency code
       │        Deduplicates on (isin, ticker, currency)
       ▼
AssetImporter.run()
       │
       ├─► _upsert_asset()          (1 Asset per ISIN)
       ├─► _upsert_listing()        (1 AssetListing per ticker/exchange)
       └─► _create_default_mappings()(Yahoo & Google Finance mappings)
```

## Running the Pipeline

Execute the pipeline inside the `fonrex-api` container:

### 1. Standard Asset Import

```bash
docker compose exec fonrex-api python import_assets.py --file data/etf.csv
```

### 2. Dry Run Simulation (No Database Writing)

```bash
docker compose exec fonrex-api python import_assets.py --file data/etf.csv --dry-run
```

### 3. Yahoo Profile & Logo Enrichment Only

```bash
docker compose exec fonrex-api python import_assets.py --enrich-only --limit 50
```

## Expected CSV Format

Ensure input CSV files placed in `data/isin_data/` follow this header structure:

```csv
name,isin,ticker,exchange,currency,product类型
Airbus SE,NL0000235190,AIR.PA,XPAR,EUR,STOCK
Apple Inc.,US0378331005,AAPL,NASDAQ,USD,STOCK
iShares MSCI World,IE00B4L5Y983,CW8.PA,XPAR,EUR,ETF
```
