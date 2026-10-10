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

**WACC.** Cost of equity by CAPM (risk-free rate + beta × equity risk premium), cost of debt from interest and debt, weights from market capitalisation and debt; the WACC is kept within 5–20 %. The risk-free rate is the 10-year rate of the **currency of the statements**: the US Treasury yield from FRED for USD, the AAA euro area government rate from the ECB for EUR (see `GET /macro/rates`). Any other currency, or a source that gives no rate, uses `DCF_RISK_FREE_RATE`: a euro company is never discounted with the US rate. Missing inputs use documented defaults (beta 1, tax rate 25 %, cost of debt = risk-free rate + 2 points) and add a warning.

**Currency.** The valuation is made in the currency of the financial statements (Yahoo's `financialCurrency`, recorded by the deep enrichment); for statements enriched before Fonrex recorded it, in the currency of the listing of the price, until `GET /fundamental/deep?ticker=...&refresh=true`. The price is the last close of the main listing: a price in pence (`GBX`) is turned into pounds, a price in another currency (a US listing of a European company) is not converted — the upsides are then `null` and `warnings` says why.

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
  "price_currency": "EUR",
  "warnings": [],
  "shares_outstanding": 790000000,
  "wacc": {
    "wacc": "0.0907",
    "cost_of_equity": "0.0957",
    "cost_of_debt": "0.032",
    "tax_rate": "0.25",
    "weight_equity": "0.93",
    "weight_debt": "0.07",
    "beta_used": "1.1",
    "cost_of_debt_source": "calculated",
    "risk_free_rate": "0.035192",
    "risk_free_rate_source": "ecb_live",
    "risk_free_rate_date": "2026-10-08",
    "risk_free_rate_currency": "EUR"
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

The figures above are illustrative. Amounts and rates are decimal numbers serialised as **strings**. `currency` is the currency of the valuation, `price_currency` that of `current_price`. `models` is keyed by model (`fcf`, `eps`, `ddm`): each model gives its own `upside_pct` over the price, and its `warnings` says when a default or a cap was applied. `risk_free_rate_source` is `fred_live`, `fred_cached` or `fred_stale` (FRED), `ecb_live`, `ecb_cached` or `ecb_stale` (ECB), `env_fallback` (`DCF_RISK_FREE_RATE`) or `client_override` (your `POST` assumptions); `stale` is an older stored rate, used when the source could not be read. `risk_free_rate_currency` names the currency of a rate read from FRED or the ECB, and is `null` for the two others.

---

## <span className="api-method post">POST</span> `/dcf/{ticker}`

Valuation with your own assumptions; never cached. It only computes, so a read-only key may call it.

| Field | Type | Default | Description |
|---|---|---|---|
| `models` | list | `["fcf"]` | Among `fcf`, `eps`, `ddm` |
| `projection_years` | integer | `5` | 3 to 10 |
| `terminal_growth_rate` | number | `0.025` | Ratio (0.025 = 2.5 %) |
| `wacc_params` | object | — | `risk_free_rate`, `equity_risk_premium`, `beta_override`, `cost_of_debt_override`, `tax_rate_override`, `cost_of_equity_model` (`capm` by default, `ff3`, `ff5`, `carhart`: see below) |
| `fcf_growth_override`, `eps_growth_override`, `dividend_growth_override` | number | — | Force the initial growth of a model |
| `model_weights` | object | — | Consensus weights, e.g. `{"fcf": 0.6, "eps": 0.4, "ddm": 0}` |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"models": ["fcf", "eps"], "projection_years": 10, "terminal_growth_rate": 0.02,
       "wacc_params": {"risk_free_rate": 0.035}}' \
  http://localhost:5000/dcf/AIR.PA
```

A terminal growth rate within half a point of the discount rate is capped (discount rate − 0.5 %) with a warning. Asking for `ddm` for a company that pays no dividend answers `404`.

### Cost of equity from the Fama/French factors {#factor-cost-of-equity}

By default the cost of equity follows the CAPM: Rf + beta × equity risk premium. With `wacc_params.cost_of_equity_model` set to `ff3`, `ff5` or `carhart`, it becomes:

> Ke = Rf + Σ βₖ × premiumₖ

- **βₖ** is the exposure of the listing to each factor, measured like [`GET /factors/exposure/{ticker}`](./factors.md) on 60 months of returns in US dollars. The daily prices of the listing must be stored (`POST /historical/ingest`); the factor files are downloaded when missing.
- **premiumₖ** is the long-run premium of the factor in the region of the listing: the mean of all its stored monthly returns, times 12 (US since 1926 or 1963, Europe since 1990).
- **Rf** stays the risk-free rate of the currency of the statements. The premia are dollar returns over the US Treasury bill: for a valuation in another currency they are an approximation, and `warnings` says so.

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"models": ["fcf"], "wacc_params": {"cost_of_equity_model": "ff5"}}' \
  http://localhost:5000/dcf/AIR.PA
```

The WACC is computed again with this cost of equity (still kept within 5–20 %). `wacc.beta_used` is the market beta, `wacc.cost_of_equity_model` names the model, and `wacc.factor_cost_of_equity` shows how it was measured:

```json
"factor_cost_of_equity": {
  "model": "ff5",
  "region": "europe",
  "betas": { "MKT_RF": "1.2100", "SMB": "-0.3500", "HML": "0.4200", "RMW": "0.1800", "CMA": "-0.2700" },
  "premia": { "MKT_RF": "0.0710", "SMB": "0.0090", "HML": "0.0380", "RMW": "0.0420", "CMA": "0.0150" },
  "premium": "0.1046",
  "start": "2021-09-30",
  "end": "2026-08-31",
  "periods": 60,
  "r_squared": 0.58
}
```

The figures are illustrative; `premium` is Σ β × premium, added to Rf.

- `beta_override` and `equity_risk_premium` belong to the CAPM: they are not used, and a warning says so. A cost of equity below Rf is also reported in `warnings`.
- An exposure that cannot be measured (no prices, a history shorter than 24 months, no factor file) answers `404` with the reason.
- The `GET` routes keep the CAPM. Factor premia are measured with a large error and change with the period chosen: use this cost of equity as a second opinion.

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

The answer holds `ticker`, `model`, `wacc_range`, `growth_range` and `matrix`; each cell gives the intrinsic value and the upside or downside against the current price. The upside is `null` when the price is quoted in another currency than the statements.

---

## <span className="api-method get">GET</span> `/macro/rates`

The rates of the two sources, or of one currency with `currency=USD` or `currency=EUR`:

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/macro/rates?currency=EUR"
```

```json
{
  "currency": "EUR",
  "risk_free_rate": {
    "series_id": "YC.B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y",
    "label": "Euro area AAA government 10-year spot rate",
    "value": "0.035192",
    "unit": "ratio",
    "observation_date": "2026-10-08",
    "freshness": "live",
    "source": "ecb",
    "currency": "EUR"
  },
  "rates": [
    { "series_id": "YC.B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y", "value": "0.035192", "unit": "ratio", "...": "..." },
    { "series_id": "FM.D.U2.EUR.4F.KR.DFR.LEV", "label": "ECB deposit facility rate", "value": "0.02", "unit": "ratio", "...": "..." },
    { "series_id": "CISS.D.U2.Z0Z.4F.EC.SS_CIN.IDX", "label": "Composite Indicator of Systemic Stress (euro area)", "value": "0.081234", "unit": "index", "...": "..." }
  ]
}
```

| Series | Source | Currency | What it is |
|---|---|---|---|
| `DGS10` | FRED | USD | US 10-year Treasury yield — the risk-free rate of USD |
| `YC.B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y` | ECB | EUR | 10-year spot rate of the AAA euro area government curve — the risk-free rate of EUR |
| `FM.D.U2.EUR.4F.KR.DFR.LEV` | ECB | EUR | Deposit facility rate (the ECB policy rate) |
| `CISS.D.U2.Z0Z.4F.EC.SS_CIN.IDX` | ECB | EUR | Composite Indicator of Systemic Stress, an index between 0 and 1 |

- Without `currency`, `rates` holds the four series and `risk_free_rate` is the US one. Another currency answers `422`: no source publishes its rates.
- A rate is a ratio (`0.0412` = 4.12 %, `unit` = `ratio`), serialised as a string; it may be zero or negative. The CISS is an index (`unit` = `index`).
- `freshness`: `live` (read from the source for this answer), `cached` (Redis, or stored and read less than 6 hours ago — `MACRO_RATES_CACHE_TTL`), `stale` (an older stored value: the source could not be read). FRED needs `FRED_API_KEY`; the ECB needs no key.
- A series without any value is left out, and so is a source that did not start (`503` when it is the only one asked).
