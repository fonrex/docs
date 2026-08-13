---
id: "historical"
title: "Historical Ingestion API Reference"
sidebar_label: "Historical Ingestion"
description: "Endpoints for backfilling historical OHLCV data, bulk ingestion, and historical query routes"
---

# Historical Ingestion API Reference

The Historical API provides methods to ingest, backfill, and query historical daily OHLCV bar data into TimescaleDB storage.

---

## <span className="api-method post">POST</span> `/historical/ingest`

Trigger a single-asset historical ingestion or backfill.

### Request Body

```json
{
  "ticker": "BNP.PA",
  "resolution": "d",
  "from_date": "2020-01-01",
  "to_date": "2026-08-01",
  "force": false
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker symbol to ingest |
| `resolution` | `string` | ❌ | `d` | Candle resolution (`d`, `w`, `m`) |
| `from_date` | `string` | ❌ | — | Start date (`YYYY-MM-DD`) |
| `to_date` | `string` | ❌ | — | End date (`YYYY-MM-DD`) |
| `force` | `boolean` | ❌ | `false` | Re-download and overwrite existing database records |

### Response Example

```json
{
  "status": "success",
  "ticker": "BNP.PA",
  "records_added": 1650,
  "source": "YahooFinance",
  "duration_ms": 1240
}
```

---

## <span className="api-method post">POST</span> `/historical/ingest/bulk`

Trigger bulk ingestion across multiple tickers with concurrency controls.

### Request Body

```json
{
  "tickers": ["AIR.PA", "BNP.PA", "TTE.PA", "MC.PA"],
  "resolution": "d",
  "concurrency": 4
}
```

### Response Example

```json
{
  "total": 4,
  "successful": 4,
  "failed": 0,
  "details": [
    { "ticker": "AIR.PA", "status": "success", "records_added": 250 },
    { "ticker": "BNP.PA", "status": "success", "records_added": 250 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/ticker/{symbol}/history`

Query historical OHLCV candles from the `prices_eod` table. Automatically ingests missing data if `auto_ingest=true`.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `symbol` | `string` | ✅ | — | Instrument symbol |
| `resolution` | `string` | ❌ | `d` | Resolution (`d`, `w`, `m`) |
| `limit` | `integer` | ❌ | `500` | Number of historical bars |
| `auto_ingest` | `boolean` | ❌ | `true` | Automatically backfill missing bars from yfinance |

### Examples

#### cURL
```bash
curl -s "http://localhost:5000/ticker/AAPL/history?limit=10"
```

#### Python
```python
import requests

resp = requests.get("http://localhost:5000/ticker/AAPL/history", params={"limit": 10})
bars = resp.json()["data"]
print("Fetched bars:", len(bars))
```
