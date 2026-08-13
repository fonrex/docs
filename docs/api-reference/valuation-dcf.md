---
id: "valuation-dcf"
title: "DCF Valuation API Reference"
sidebar_label: "Valuation (DCF)"
description: "Intrinsic value calculations, WACC estimation, multi-model consensus, and sensitivity matrix endpoints"
---

# DCF Valuation API Reference

The Valuation API executes Discounted Cash Flow (DCF) intrinsic value models, computes Dynamic Weighted Average Cost of Capital (WACC), builds multi-model consensus reports, and generates sensitivity matrices.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}`

Compute default intrinsic value using the Free Cash Flow (FCF) DCF model. Results cached in Redis for 6 hours.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker symbol (e.g. `AAPL`) |

### Response Example

```json
{
  "ticker": "AAPL",
  "model": "FCF",
  "current_price": 224.50,
  "intrinsic_value": 248.20,
  "margin_of_safety_pct": 10.56,
  "recommendation": "UNDERVALUED",
  "wacc": 0.0845,
  "terminal_growth_rate": 0.025,
  "projections": [
    { "year": 1, "fcf": 115000000000, "pv": 105990000000 },
    { "year": 2, "fcf": 124000000000, "pv": 105430000000 },
    { "year": 3, "fcf": 133000000000, "pv": 104270000000 },
    { "year": 4, "fcf": 142000000000, "pv": 102550000000 },
    { "year": 5, "fcf": 151000000000, "pv": 100290000000 }
  ],
  "terminal_value": 2580000000000,
  "enterprise_value": 3098430000000
}
```

---

## <span className="api-method post">POST</span> `/dcf/{ticker}`

Run a customized DCF valuation with custom growth rates, risk-free rate, or WACC overrides (bypasses Redis cache).

### Request Body

```json
{
  "projection_years": 5,
  "revenue_growth_rate": 0.08,
  "operating_margin": 0.30,
  "risk_free_rate": 0.042,
  "terminal_growth_rate": 0.02
}
```

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/compare`

Compare consensus intrinsic valuations across all three DCF models: **Free Cash Flow (FCF)**, **Earnings Per Share (EPS)**, and **Dividend Discount Model (DDM)**.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/sensitivity`

Generate a 5x5 sensitivity matrix analyzing how intrinsic value changes across combinations of WACC (discount rate) and terminal growth rate.

### Response Example

```json
{
  "ticker": "AAPL",
  "sensitivity_matrix": {
    "wacc_axis": [0.075, 0.080, 0.0845, 0.090, 0.095],
    "growth_axis": [0.015, 0.020, 0.025, 0.030, 0.035],
    "values": [
      [275.40, 284.10, 294.20, 305.80, 319.40],
      [252.10, 259.30, 267.80, 277.50, 288.70],
      [234.80, 241.00, 248.20, 256.40, 265.80]
    ]
  }
}
```
