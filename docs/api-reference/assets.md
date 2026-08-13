---
id: "assets"
title: "Asset & Listing API Reference"
sidebar_label: "Assets & Listings"
description: "Documentation for asset identity resolution, listings, and EOD history endpoints"
---

# Asset & Listing API Reference

The Asset API manages financial instrument identities, exchange listings, and multi-format EOD history retrieval.

---

## <span className="api-method get">GET</span> `/assets/by-isin/{isin}`

Retrieve a canonical asset instrument and all its active exchange listings by ISIN code.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `isin` | `string` | ✅ | — | 12-character ISIN code (e.g. `NL0000235190`) |

### Response Example

```json
{
  "id": 42,
  "isin": "NL0000235190",
  "name": "Airbus SE",
  "sector": "Industrials",
  "industry": "Aerospace & Defense",
  "quote_type": "EQUITY",
  "listings": [
    {
      "id": 101,
      "ticker": "AIR.PA",
      "exchange": "XPAR",
      "currency": "EUR",
      "is_primary": true
    },
    {
      "id": 102,
      "ticker": "AIR.DE",
      "exchange": "XETR",
      "currency": "EUR",
      "is_primary": false
    }
  ]
}
```

### Examples

#### cURL
```bash
curl -s "http://localhost:5000/assets/by-isin/NL0000235190"
```

#### Python
```python
import requests

resp = requests.get("http://localhost:5000/assets/by-isin/NL0000235190")
data = resp.json()
print(f"Asset Name: {data['name']}, Listings Count: {len(data['listings'])}")
```

---

## <span className="api-method get">GET</span> `/listings`

Search exchange listings by ticker, ISIN, exchange, or currency.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ❌ | — | Ticker symbol (e.g. `AAPL`) |
| `isin` | `string` | ❌ | — | ISIN code |
| `exchange` | `string` | ❌ | — | Exchange code (e.g. `XPAR`, `NASDAQ`) |
| `currency` | `string` | ❌ | — | 3-letter currency code (e.g. `EUR`, `USD`) |
| `limit` | `integer` | ❌ | `50` | Maximum results to return |

---

## <span className="api-method get">GET</span> `/eod/{ticker}`

Retrieve End-of-Day (EOD) historical prices in JSON or CSV format. Auto-triggers historical ingestion if local data is missing.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker symbol (e.g. `AIR.PA`, `AAPL`) |
| `resolution` | `string` | ❌ | `d` | Candle resolution (`d`, `w`, `m`) |
| `format` | `string` | ❌ | `json` | Output format (`json`, `csv`) |
| `limit` | `integer` | ❌ | `100` | Number of historical bars to return |
| `order` | `string` | ❌ | `asc` | Sort order by date (`asc`, `desc`) |

### Status Codes

| Code | Description |
|---|---|
| 200 | Success |
| 404 | Asset/Listing not found |
| 422 | Invalid parameter input |
