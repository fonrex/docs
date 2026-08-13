---
id: "specialized"
title: "Specialized Providers API Reference"
sidebar_label: "Specialized Providers"
description: "Endpoints for SEC EDGAR insider trades, JustETF metadata, and index constituent lists"
---

# Specialized Providers API Reference

The Specialized Providers API exposes targeted endpoints for SEC EDGAR insider transactions, JustETF details, and equity index constituents.

---

## <span className="api-method get">GET</span> `/insider-transactions/{ticker}`

Fetch Form 4 insider transactions filed with the US Securities and Exchange Commission (SEC EDGAR). Cached for 12 hours.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | US Equity Ticker (e.g. `AAPL`, `TSLA`) |

### Response Example

```json
{
  "ticker": "AAPL",
  "source": "SEC_EDGAR",
  "count": 1,
  "transactions": [
    {
      "filing_date": "2026-08-01",
      "reporting_owner": "COOK TIMOTHY D",
      "officer_title": "Chief Executive Officer",
      "transaction_type": "P - Purchase",
      "shares": 50000,
      "price_per_share": 220.50,
      "total_value": 11025000
    }
  ]
}
```

---

## <span className="api-method get">GET</span> `/etf/{isin}/details`

Scrape ETF metadata, expense ratio (TER), Assets Under Management (AUM), and top 10 holdings from JustETF.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `isin` | `string` | ✅ | — | European ETF ISIN (e.g. `IE00B4L5Y983`) |

### Response Example

```json
{
  "isin": "IE00B4L5Y983",
  "name": "iShares Core MSCI World UCITS ETF",
  "ter_pct": 0.20,
  "aum_eur": 65000000000,
  "replication": "Physical",
  "top_holdings": [
    { "name": "Apple Inc.", "weight_pct": 4.85 },
    { "name": "Microsoft Corp.", "weight_pct": 4.20 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/index/{index_name}/constituents`

Fetch current constituent stocks for major financial market indices (`sp500`, `cac40`, `nasdaq100`, `dax`).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `index_name` | `string` | ✅ | — | Index name (`sp500`, `cac40`, `nasdaq100`, `dax`) |
