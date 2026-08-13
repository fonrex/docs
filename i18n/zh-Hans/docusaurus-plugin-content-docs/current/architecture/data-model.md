---
id: "data-model"
title: "数据模型与 Mode 模式参考"
sidebar_label: "数据模型"
description: "详细的实体关系图、数据库 Schema 及 TimescaleDB 超级表定义"
---


# 数据模型与 Mode 模式参考

Fonrex uses a 3-tier asset representation schema (`assets` ➔ `asset_listings` ➔ `asset_mappings`) to cleanly handle instruments, multi-exchange listings, and provider-specific identifiers.

## Entity Relationship Diagram

```mermaid
erDiagram
    ASSETS ||--o{ ASSET_LISTINGS : "has listings"
    ASSETS ||--o{ ASSET_MAPPINGS : "has mappings"
    ASSET_LISTINGS ||--o{ ASSET_MAPPINGS : "has provider mappings"
    ASSETS ||--o{ PRICES_EOD : "has daily bars"
    ASSETS ||--o{ PRICES_INTRADAY : "has intraday ticks"
    ASSETS ||--o| FUNDAMENTALS_HIGHLIGHTS : "has highlights"
    ASSETS ||--o{ FINANCIAL_STATEMENTS : "has statements"
    ASSETS ||--o{ NEWS_ARTICLES : "has news"

    ASSETS {
        int id PK
        string isin UK "NOT NULL index"
        string name
        string sector
        string industry
        string quote_type
    }

    ASSET_LISTINGS {
        int id PK
        int asset_id FK
        string ticker
        string exchange
        string currency
        bool is_primary
    }

    ASSET_MAPPINGS {
        int id PK
        int asset_listing_id FK
        string provider_name
        string provider_ticker
        string provider_url
    }

    PRICES_EOD {
        timestamp time PK
        int asset_id FK
        float open
        float high
        float low
        float close
        bigint volume
    }

    PRICES_INTRADAY {
        timestamp timestamp PK
        int asset_id FK
        float open
        float high
        float low
        float close
        bigint volume
    }
```

## Key Database Tables

### 1. `assets`
Represents the canonical financial instrument (e.g., Apple Inc. or Airbus SE).
- **`id`** (Integer, PK, Autoincrement)
- **`isin`** (String(12), Partial Unique Index `uq_assets_isin_not_null` WHERE `isin IS NOT NULL`)
- **`name`** (String(255))
- **`sector`** / **`industry`** (String(100))
- **`quote_type`** (Enum: `EQUITY`, `ETF`, `MUTUALFUND`, `INDEX`)

### 2. `asset_listings`
Represents exchange-specific trading listings.
- Unique Constraint: `uq_asset_listing_identity` on `(asset_id, ticker, exchange, currency)`.
- Flags: `is_primary` (Boolean), `is_active` (Boolean).

### 3. `asset_mappings`
Maps external provider tickers or custom page URLs.
- Unique Constraint: `(asset_listing_id, provider_name)`.

### 4. `prices_eod` (PostgreSQL Table)
Daily historical OHLCV price series.
- Unique Index: `ix_prices_eod_asset_resolution_time` on `(asset_id, resolution, time)`.

### 5. `prices_intraday` (TimescaleDB Hypertable)
High-frequency 1-minute candle storage.
- Partitioned daily by time interval (`INTERVAL '1 day'`).
- Automated retention policy: Purges chunks older than 30 days.

### 6. `provider_health_log` (TimescaleDB Hypertable)
Outlier checks and health metrics per provider.
- Composite Primary Key: `(id, checked_at)`.
- Automated retention policy: 30 days.
