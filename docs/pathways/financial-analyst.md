---
id: "financial-analyst"
title: "Financial Analyst Pathway"
sidebar_label: "Financial Analyst"
description: "Onboarding guide for financial analysts: DCF valuation models, fundamental statement extraction, Google Sheets connector, and OpenBB Workspace"
---

# Financial Analyst Pathway

This pathway provides a technical onboarding guide for **Financial Analysts and Valuation Specialists**. It covers fundamental financial statement extractions, Discounted Cash Flow (DCF) valuation models, and automated integrations with Google Sheets and OpenBB Workspace.

| Feature Area | Integration Type | Output Format |
|---|---|---|
| **Google Sheets Connector** | Apps Script / `IMPORTDATA` | CSV / Cell values |
| **OpenBB Workspace** | REST Router (`/openbb`) | Metric tiles, AgGrid tables, Plotly charts |
| **DCF Valuation Engine** | FastAPI Backend | Free Cash Flow, EPS & DDM Intrinsic values |

---

## 1. Accessing Instance Endpoints

Ensure your Fonrex instance is active or accessible via host configuration:

```http
GET /health
```

Default local base URL: `http://localhost:5000`

---

## 2. Google Sheets Integration

Connect spreadsheet models directly to Fonrex endpoints using standard formulas or custom Apps Script wrappers:

### Direct Formula Usage

```excel
=IMPORTDATA("http://localhost:5000/api/v1/fundamentals/ratios?symbol=AAPL&format=csv")
```

### Custom Apps Script Functions

| Function Signature | Return Description |
|---|---|
| `=FONREX_PE("AIR.PA")` | Price-to-Earnings Ratio |
| `=FONREX_DIVIDEND_YIELD("AIR.PA")` | Dividend Yield (decimal format) |
| `=FONREX_INTRINSIC_VALUE("AAPL")` | DCF Intrinsic Value per share |

> **Note**: Custom cell formulas are cached by Google for 30 minutes. For real-time updates, use menu-driven refresh scripts. Refer to the [Google Sheets Connector Guide](/docs/guides/google-sheets-connector).

---

## 3. OpenBB Terminal Workspace Configuration

Fonrex exposes specialized `/openbb` endpoints designed for OpenBB Terminal (Cloud and Desktop):

1. Open OpenBB Workspace.
2. Add Fonrex as a custom backend data source (`http://localhost:5000/openbb`).
3. Load the default Fonrex workspace dashboard layout.

> **Note**: For custom authentication setup and widget manifests, refer to the [OpenBB Workspace Guide](/docs/guides/openbb-workspace).

---

## 4. Automated DCF Valuation Engine

Query intrinsic share value calculations derived from WACC, terminal growth rates, and Free Cash Flow models:

```http
GET /api/v1/valuation/dcf?symbol=AAPL&wacc=0.085&growth_rate=0.05
```

Response payload schema:

```json
{
  "symbol": "AAPL",
  "intrinsic_value_per_share": 198.50,
  "current_price": 185.20,
  "upside_downside_pct": 7.18,
  "wacc_used": 0.085,
  "terminal_growth_rate": 0.05
}
```

---

## Next Steps

- Review the [Fundamentals & Financial Ratios API Reference](/docs/api-reference/fundamentals)
- Review the [DCF Valuation Engine API Reference](/docs/api-reference/valuation-dcf)
- Review the [OpenBB Integration API Reference](/docs/api-reference/openbb)
