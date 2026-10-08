---
id: "assets"
title: "Asset & Listing API Reference"
sidebar_label: "Assets & Listings"
description: "Instruments, listings and end-of-day prices of the Fonrex catalogue"
---

# Asset & Listing API Reference

Fonrex separates an **instrument** (one ISIN, a row of `assets`) from its **listings** (one row of `asset_listings` per ticker, exchange and currency). The same ETF quoted in EUR and in USD is one instrument with two listings, and each listing has its own price series.

All routes on this page require an API key (`X-API-KEY` or `Authorization: Bearer`).

---

## <span className="api-method get">GET</span> `/assets/by-isin/{isin}`

The instrument of an ISIN, with its preferred listing and all its listings.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/assets/by-isin/NL0000235190"
```

```json
{
  "asset_id": 1,
  "name": "Airbus SE",
  "ticker": "AIR.PA",
  "exchange": "XPAR",
  "currency": "EUR",
  "sector": "Industrials",
  "industry": "Aerospace & Defense",
  "quote_type": "EQUITY",
  "isin": "NL0000235190",
  "listing_id": 1,
  "listings": [
    {
      "id": 1, "asset_id": 1, "ticker": "AIR.PA", "exchange": "XPAR", "currency": "EUR",
      "isin": "NL0000235190", "name": "Airbus SE", "source": "csv_import",
      "is_primary": true, "is_active": true
    },
    {
      "id": 2, "asset_id": 1, "ticker": "AIR.DE", "exchange": "XETR", "currency": "EUR",
      "isin": "NL0000235190", "name": "Airbus SE", "source": "csv_import",
      "is_primary": false, "is_active": true
    }
  ]
}
```

The answer also holds `display_name`, `official_symbol`, `logo_path`, `ir_website` and `long_business_summary` when they are known. An unknown ISIN answers `404`.

---

## <span className="api-method get">GET</span> `/listings`

Active listings matching the filters. At least one filter is required (`400` otherwise).

| Parameter | Type | Description |
|---|---|---|
| `ticker` | string | Ticker of the listing (e.g. `AIR.PA`) |
| `isin` | string | ISIN of the instrument |
| `exchange` | string | Exchange code as stored in the catalogue |
| `currency` | string | Currency of the listing (e.g. `EUR`) |

```json
{
  "count": 2,
  "listings": [
    { "id": 1, "asset_id": 1, "ticker": "AIR.PA", "exchange": "XPAR", "currency": "EUR", "isin": "NL0000235190", "name": "Airbus SE", "source": "csv_import", "is_primary": true, "is_active": true }
  ]
}
```

---

## <span className="api-method get">GET</span> `/eod/{ticker}`

End-of-day prices of a listing, in JSON or CSV. When nothing is stored for the request, the listing is ingested first (Yahoo Finance with the symbol verified for the listing, TradingView as a fallback).

| Parameter | Type | Default | Description |
|---|---|---|---|
| `ticker` | string | — | Ticker (at most 10 characters: letters, digits, `.` and `-`) |
| `period` | string | — | `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `ytd`, `max`, `daily`, `weekly`, `monthly`. Required unless `from` and `to` are given |
| `from`, `to` | date | — | Window `YYYY-MM-DD`, given together |
| `fmt` | string | `json` | `json` or `csv` |
| `order` | string | `a` | `a` (oldest first) or `d` (newest first) |
| `currency` | string | — | Currency of the listing, when several listings share the ticker |
| `exchange` | string | — | Exchange of the listing, when several listings share the ticker |

`weekly` returns weekly bars and `monthly` monthly bars; every other period returns daily bars. Without `currency` or `exchange`, the primary listing is used.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/eod/AIR.PA?period=5d"
```

```json
{
  "ticker": "AIR.PA",
  "period": "5d",
  "format": "json",
  "count": 3,
  "retrieved_at": "2026-10-08T16:34:42.404598+00:00",
  "data_source": "database",
  "data": [
    { "Date": "2026-10-06", "Open": 153.44, "High": 155.44, "Low": 151.44, "Close": 154.44, "Adj Close": 154.44, "Volume": 1399000 },
    { "Date": "2026-10-07", "Open": 154.46, "High": 156.46, "Low": 152.46, "Close": 155.46, "Adj Close": 155.46, "Volume": 1400000 }
  ]
}
```

`Date` is the date of the trading session. `data_source` is `database` when the prices were already stored, otherwise the source of the ingestion (`yfinance` or `tradingview`). Answers are cached 24 hours in Redis.

With `fmt=csv`:

```
Date,Open,High,Low,Close,Adj Close,Volume
2026-10-06,153.44,155.44,151.44,154.44,154.44,1399000
2026-10-07,154.46,156.46,152.46,155.46,155.46,1400000
```

### Errors

| Code | Body | When |
|---|---|---|
| `400` | `{"error": "Invalid request", "message": "..."}` | Invalid ticker, period, format, order or dates |
| `404` | `{"error": "No data found", "message": "...", "reason": "..."}` | Nothing stored and nothing could be ingested. `reason` explains why, e.g. no Yahoo symbol quoted in the currency of the listing |

See [Ingesting historical data](../guides/ingest-historical-data.md) for the way the source symbol of a listing is chosen.
