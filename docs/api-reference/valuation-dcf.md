---
id: "valuation-dcf"
title: "DCF Valuation API Reference"
sidebar_label: "Valuation & DCF"
description: "Intrinsic value with three DCF models, dynamic WACC, model comparison, sensitivity matrix and macro rates"
---

# DCF Valuation API Reference

Three models are available. When a request computes several of them, the consensus is their weighted average:

| Model | Basis | Default weight |
|---|---|---|
| `fcf` | Average free cash flow of the last three fiscal years, projected, plus a Gordon terminal value, minus net debt | 50 % |
| `eps` | Earnings per share growth (history and analyst trend) and a terminal P/E (the company's P/E bounded to 10–30, 15 when unknown) | 30 % |
| `ddm` | Dividend discount (Gordon) — only for a company that pays a dividend | 20 % |

The weights are shared among the models computed by the request: with `fcf` and `eps` only, the consensus weighs them 50/30, normalised. `GET /dcf/{ticker}` computes `fcf` alone, so its consensus is the FCF value.

**Inputs come from the database only.** The service reads the highlights, the annual statements (grouped by fiscal year, five years), the earnings trend and the analyst ratings stored by the deep enrichment, and the last daily close of the main listing. Run `GET /fundamental/deep?ticker=...` first: a ticker that was never enriched answers `404` with the name of the missing data.

**WACC.** Cost of equity by CAPM (risk-free rate + beta × equity risk premium), cost of debt from interest and debt, weights from market capitalisation and debt; the WACC is kept within 5–20 %. The risk-free rate is the US 10-year Treasury yield from FRED (see `GET /macro/rates`), otherwise `DCF_RISK_FREE_RATE`. Missing inputs use documented defaults (beta 1, tax rate 25 %, cost of debt = risk-free rate + 2 points) and add a warning.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}`

The **FCF model alone**, with the default assumptions: `consensus_value` is the FCF value. Cached 6 hours; `force_refresh=true` computes again. Use `/compare` for the three models, or `POST` to choose them.

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/dcf/AIR.PA"
```

Answer layout:

```json
{
  "ticker": "AIR.PA",
  "currency": "EUR",
  "current_price": "155.42",
  "shares_outstanding": "790000000",
  "wacc": {
    "wacc": "0.0865",
    "cost_of_equity": "0.0912",
    "cost_of_debt": "0.032",
    "tax_rate": "0.25",
    "weight_equity": "0.93",
    "weight_debt": "0.07",
    "beta_used": "1.1",
    "cost_of_debt_source": "calculated",
    "risk_free_rate_source": "fred_cached"
  },
  "models": {
    "fcf": {
      "model_name": "...",
      "intrinsic_value_per_share": "168.20",
      "upside_pct": "8.22",
      "projected_values": ["..."],
      "terminal_value": "...",
      "present_values": ["..."],
      "pv_terminal": "...",
      "warnings": []
    }
  },
  "solvency": { "debt_to_equity_ratio": "...", "net_debt_to_ebitda": "...", "interest_coverage_ratio": "...", "...": "..." },
  "consensus_value": "168.20",
  "consensus_upside_pct": "8.22",
  "analyst_target": "175.00",
  "computed_at": "2026-10-08T16:50:00Z"
}
```

The figures above are illustrative. Amounts and rates are decimal numbers serialised as **strings**. `models` is keyed by model (`fcf`, `eps`, `ddm`); `warnings` of each model says when a default or a cap was applied. `risk_free_rate_source` is `fred_cached` (FRED rate), `env_fallback` (`DCF_RISK_FREE_RATE`) or `client_override` (your `POST` assumptions).

---

## <span className="api-method post">POST</span> `/dcf/{ticker}`

Valuation with your own assumptions; never cached. It only computes, so a read-only key may call it.

| Field | Type | Default | Description |
|---|---|---|---|
| `models` | list | `["fcf"]` | Among `fcf`, `eps`, `ddm` |
| `projection_years` | integer | `5` | 3 to 10 |
| `terminal_growth_rate` | number | `0.025` | Ratio (0.025 = 2.5 %) |
| `wacc_params` | object | — | `risk_free_rate`, `equity_risk_premium`, `beta_override`, `cost_of_debt_override`, `tax_rate_override` |
| `fcf_growth_override`, `eps_growth_override`, `dividend_growth_override` | number | — | Force the initial growth of a model |
| `model_weights` | object | — | Consensus weights, e.g. `{"fcf": 0.6, "eps": 0.4, "ddm": 0}` |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"models": ["fcf", "eps"], "projection_years": 10, "terminal_growth_rate": 0.02,
       "wacc_params": {"risk_free_rate": 0.035}}' \
  http://localhost:5000/dcf/AIR.PA
```

A terminal growth rate within half a point of the discount rate is capped (discount rate − 0.5 %) with a warning. Asking for `ddm` for a company that pays no dividend answers `404`.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/compare`

The three models side by side, with their weighted consensus. A company without a dividend gets a DDM entry valued at zero with a warning, and the consensus is computed from FCF and EPS.

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/sensitivity`

Intrinsic value for a grid of WACC (rows) × terminal growth (columns).

| Parameter | Default |
|---|---|
| `model` | `fcf` |
| `wacc_min`, `wacc_max`, `wacc_step` | `0.06`, `0.16`, `0.02` |
| `growth_min`, `growth_max`, `growth_step` | `0.01`, `0.05`, `0.01` |
| `force_refresh` | `false` |

The answer holds `ticker`, `model`, `wacc_range`, `growth_range` and `matrix`; each cell gives the intrinsic value and the upside or downside against the current price.

---

## <span className="api-method get">GET</span> `/macro/rates`

The risk-free rate used by the valuation:

```json
{
  "risk_free_rate": {
    "series_id": "DGS10",
    "label": "10-Year Treasury Constant Maturity Rate",
    "value": "0.0412",
    "unit": "percent",
    "observation_date": "2026-10-07"
  }
}
```

`value` is a ratio (0.0412 = 4.12 %), serialised as a string, although `unit` says `percent`. It comes from Redis (6 hours), then from the value stored in `macro_rates_cache` when it was read from FRED less than 6 hours ago, then from the FRED API (`FRED_API_KEY`), and finally from an older stored value. Without any value, `risk_free_rate` is `null` and the valuation uses `DCF_RISK_FREE_RATE`.
