---
id: "financial-analyst"
title: "📊 Pathway: Financial Analyst"
sidebar_label: "📊 Financial Analyst"
description: "No-code / low-code onboarding for financial analysts: DCF valuation, Google Sheets connector, and OpenBB Workspace."
---

# 📊 Pathway: Financial Analyst

This pathway is tailored for **Financial Analysts and Investors** seeking to automate fundamental research, build Discounted Cash Flow (DCF) models, and feed spreadsheets without writing complex backend code.

> [!TIP]
> **Goal:** Connect Fonrex to your daily tools (Google Sheets, OpenBB Workspace) and automate financial statement extraction and valuation models.

---

### ⏱️ Estimated Time: 5 minutes

---

## 📌 Step 1: Accessing Your Fonrex Instance

Ensure your Fonrex instance is running (or request the access URL from your infrastructure team):
- Default local URL: `http://localhost:5000`

---

## 📌 Step 2: Connecting Google Sheets (No-Code)

Feed your financial models directly inside Google Sheets:

1. Open your Google Sheets document.
2. Use the **Fonrex Sheets Connector** extension or `=IMPORTDATA()` function:
   ```excel
   =IMPORTDATA("http://localhost:5000/api/v1/fundamentals/ratios?symbol=AAPL&format=csv")
   ```
3. Automatically retrieve updated P/E Ratios, Free Cash Flows, Operating Margins, and ROE.

*(See the [Google Sheets Connector Guide](/docs/guides/google-sheets-connector) for custom functions).*

---

## 📌 Step 3: Configuring OpenBB Terminal Workspace

Visualize your Fonrex data in the institutional OpenBB Workspace interface:

1. Open your **OpenBB Terminal**.
2. Add the custom Fonrex data source in your backend settings.
3. Load the preconfigured Fonrex dashboard layout.

![OpenBB Workspace Fonrex](/img/template-preview.png)

*(Follow the [OpenBB Workspace Guide](/docs/guides/openbb-workspace) to customize your widgets).*

---

## 📌 Step 4: Valuation & DCF Models

Query the automatic valuation engine to calculate intrinsic share value:

```bash
curl "http://localhost:5000/api/v1/valuation/dcf?symbol=AAPL&wacc=0.085&growth_rate=0.05"
```

Example response:
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

## 🎯 Suggested Next Steps

- 🏛️ [Fundamentals & Ratios API Reference](/docs/api-reference/fundamentals)
- 💰 [DCF Valuation Engine API Reference](/docs/api-reference/valuation-dcf)
- 📰 [News & Sentiment API Reference](/docs/api-reference/news)
