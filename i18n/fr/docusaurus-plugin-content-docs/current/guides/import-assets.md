---
id: "import-assets"
title: "Guide du Pipeline d'Import CSV des Actifs"
sidebar_label: "Import CSV d'Actifs"
description: "Comment alimenter et enrichir votre univers d'actifs en utilisant le pipeline CSV dédupliqué par ISIN"
---


# Guide du Pipeline d'Import CSV des Actifs

Fonrex includes a dedicated asset ingestion pipeline (`import_assets.py`) designed to seed instruments, listings, and provider mappings from CSV files located in `data/isin_data/`.

## Vue d'ensemble du Workflow

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

## Exécuter le Pipeline

Execute the pipeline inside the `fonrex-api` container:

### 1. Standard Asset Import

```bash
docker compose exec fonrex-api python import_assets.py --file etf.csv
```

### 2. Dry Run Simulation (No Database Writing)

```bash
docker compose exec fonrex-api python import_assets.py --file etf.csv --dry-run
```

### 3. Yahoo Profile & Logo Enrichment Only

```bash
docker compose exec fonrex-api python import_assets.py --enrich-only --limit 50
```

## Format CSV Attendu

Ensure input CSV files placed in `data/isin_data/` follow this header structure:

```csv
name,isin,ticker,exchange,currency,productType
Airbus SE,NL0000235190,AIR.PA,XPAR,EUR,STOCK
Apple Inc.,US0378331005,AAPL,NASDAQ,USD,STOCK
iShares MSCI World,IE00B4L5Y983,CW8.PA,XPAR,EUR,ETF
```
