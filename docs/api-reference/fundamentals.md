---
id: "fundamentals"
title: "Fundamental Financials API Reference"
sidebar_label: "Fundamentals"
description: "Endpoints for multi-provider fundamental metrics, financial statements, and valuation ratios"
---

# Fundamental Financials API Reference

The Fundamentals API aggregates financial metrics, key statistics, balance sheets, income statements, cash flows, and analyst consensus across 14+ fundamental providers.

---

## <span className="api-method get">GET</span> `/fundamental`

Aggregate key financial statistics (P/E ratio, Dividend Yield, Market Cap, Enterprise Value, Beta, ESG scores) across providers.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ❌ | — | Ticker symbol (e.g. `TSLA`) |
| `isin` | `string` | ❌ | — | ISIN code (e.g. `US88160R1014`) |
| `exchange` | `string` | ❌ | — | Financial exchange code |
| `currency` | `string` | ❌ | — | Currency filter |
| `provider` | `string` | ❌ | — | Specific provider override (e.g. `ZoneBourse`, `Gurufocus`, `YahooFinance`) |

### Response Example

```json
{
  "asset_profile": {
    "isin": "US88160R1014",
    "name": "Tesla, Inc.",
    "ticker": "TSLA",
    "sector": "Consumer Cyclical"
  },
  "metrics": {
    "market_cap": 750230000000,
    "pe_ratio": 62.4,
    "forward_pe": 48.1,
    "dividend_yield": 0.0,
    "beta": 2.34,
    "price_to_sales": 7.82,
    "roe": 0.194
  },
  "providers_used": ["ZoneBourse", "Gurufocus", "YahooFinance"]
}
```

### Examples

#### cURL
```bash
curl -s "http://localhost:5000/fundamental?ticker=TSLA"
```

#### Python
```python
import requests

resp = requests.get("http://localhost:5000/fundamental", params={"ticker": "TSLA"})
data = resp.json()
print("Market Cap:", data["metrics"]["market_cap"])
```

---

## <span className="api-method get">GET</span> `/fundamental/deep`

Retrieve deep structured financial data including daily snapshots, financial statements, EPS earnings history, and analyst consensus ratings.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker symbol (e.g. `AIR.PA`) |

### Response Example

```json
{
  "highlights": {
    "pe_ratio": 28.5,
    "enterprise_value": 110500000000,
    "roe": 0.162,
    "roa": 0.054
  },
  "financial_statements": [
    {
      "statement_type": "income",
      "period_type": "annual",
      "period_end": "2025-12-31",
      "revenue": 65400000000,
      "net_income": 4200000000
    }
  ],
  "analyst_ratings": {
    "consensus": "Buy",
    "target_mean": 165.0,
    "strong_buy": 12,
    "buy": 8,
    "hold": 4,
    "sell": 1
  }
}
```
