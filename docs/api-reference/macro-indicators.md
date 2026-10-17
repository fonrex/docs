---
id: "macro-indicators"
title: "Macro Indicators API Reference (Eurostat)"
sidebar_label: "Macro Indicators (Eurostat)"
description: "Inflation, unemployment, GDP growth and business surveys of the euro area and of each EU country, read from Eurostat and kept period by period"
---

# Macro Indicators API Reference (Eurostat)

Fonrex reads the main macro-economic indicators of the euro area and of each country of the European Union from [Eurostat](https://ec.europa.eu/eurostat) (free, no key) and keeps them in your database, period by period. They are the European counterpart of what FRED gives for the United States: the macro context of a European portfolio, and the *Macro Context* dashboard of OpenBB.

| Route | What it does |
|---|---|
| `GET /macro/indicators` | The latest value of each indicator for one country or area |
| `GET /macro/indicators/{indicator}` | One indicator over time, for up to 10 countries |
| `POST /macro/indicators/refresh` | Reads series from Eurostat on demand |

The rates of FRED and of the ECB (risk-free rates, deposit facility rate, CISS) stay on [`GET /macro/rates`](./valuation-dcf.md); the US yield curve, every maturity day by day, is on [`GET /macro/treasury/curve`](./treasury-curves.md).

## Indicators

| `indicator` | What it is | Frequency | Unit | Eurostat flow |
|---|---|---|---|---|
| `hicp` | HICP inflation, annual rate of change | monthly | ratio | `prc_hicp_minr` |
| `hicp_core` | HICP excluding energy, food, alcohol and tobacco, annual rate | monthly | ratio | `prc_hicp_minr` |
| `unemployment` | Unemployment rate, seasonally adjusted | monthly | ratio | `une_rt_m` |
| `gdp_qoq` | GDP growth on the previous quarter (chain-linked volumes) | quarterly | ratio | `namq_10_gdp` |
| `gdp_yoy` | GDP growth on the same quarter of the previous year | quarterly | ratio | `namq_10_gdp` |
| `economic_sentiment` | Economic sentiment indicator (100 = long-term average) | monthly | index | `ei_bssi_m_r2` |
| `consumer_confidence` | Consumer confidence (balance of positive and negative answers) | monthly | balance | `ei_bssi_m_r2` |

- **Rates are ratios** (`0.038` = 3.8 %; Eurostat publishes percentages). The sentiment indicator and the confidence balance are kept as published.
- **A period is dated by its first day**: `2026-09-01` is September 2026, `2026-04-01` the second quarter of 2026.
- **`status`** keeps the flag of Eurostat: `e` marks an estimate, such as the flash inflation of the last month, replaced by the final figure a few weeks later.
- **Inflation** comes from `prc_hicp_minr`, the flow of the ECOICOP 2 classification. The former flow `prc_hicp_manr` stopped in December 2025.

## Countries and areas

`geo` takes the codes of Eurostat: `DE`, `FR`, `IT`, `ES`, `NL`, `BE`, `AT`, `PT`, `IE`, `FI`… and `EU27_2020` for the European Union.

**`EA` is the euro area**, read as `EA21`: its composition since Bulgaria joined in 2026, back-calculated by Eurostat over the whole history. The labour market and survey flows have no code for a changing composition, so the same code is used everywhere.

## Freshness and revisions

A series is read from Eurostat the first time it is asked, in full (inflation and unemployment since 2000, GDP since 1995, surveys since the 1980s). After that:

- a series read less than **`EUROSTAT_REFRESH_HOURS`** hours ago (24 by default) is answered from the database;
- an older one is read again, from 24 months (8 quarters for GDP) before the last period stored, so that a **revision replaces the value of its period**;
- when Eurostat does not answer, the stored values are given with `load.status` = `failed` and the reason.

Every answer says, in `load`, what was done: `fetched` (read now), `fresh` (read recently) or `failed`.

---

## <span className="api-method get">GET</span> `/macro/indicators`

The latest value of each indicator for one country or area, with the previous period and the change.

| Parameter | Default | Description |
|---|---|---|
| `geo` | `EA` | One country or area |
| `indicator` | every indicator | Repeat it to keep some: `indicator=hicp&indicator=unemployment` |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/macro/indicators?geo=EA"
```

```json
{
  "geo": "EA21",
  "source": "Eurostat, https://ec.europa.eu/eurostat",
  "indicators": [
    {
      "indicator": "hicp",
      "label": "HICP inflation, annual rate of change",
      "frequency": "monthly",
      "unit": "ratio",
      "period": "2026-09-01",
      "value": 0.038,
      "status": "e",
      "previous_period": "2026-08-01",
      "previous_value": 0.032,
      "change": 0.006,
      "load": {
        "status": "fresh",
        "fetched_at": "2026-10-15T09:00:00Z",
        "first_period": "2000-12-01",
        "last_period": "2026-09-01",
        "reason": null
      }
    },
    { "indicator": "unemployment", "unit": "ratio", "period": "2026-08-01", "value": 0.064, "...": "..." },
    { "indicator": "economic_sentiment", "unit": "index", "period": "2026-09-01", "value": 97.9, "change": -0.5, "...": "..." }
  ]
}
```

`change` is `value - previous_value`, in the unit of the indicator (0.006 is 0.6 percentage point). A series that could never be read has `value` = `null` and says why in `load.reason`.

---

## <span className="api-method get">GET</span> `/macro/indicators/{indicator}`

One indicator over time, one series per country or area, oldest period first.

| Parameter | Default | Description |
|---|---|---|
| `geo` | `EA` | Up to 10 countries or areas, separated by commas |
| `start`, `end` | the whole series | First and last period included (`YYYY-MM-DD`) |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/indicators/hicp?geo=EA,FR,DE&start=2026-07-01"
```

```json
{
  "indicator": "hicp",
  "label": "HICP inflation, annual rate of change",
  "frequency": "monthly",
  "unit": "ratio",
  "source": "Eurostat, https://ec.europa.eu/eurostat",
  "series": [
    {
      "geo": "EA21",
      "load": { "status": "fresh", "...": "..." },
      "observations": [
        { "period": "2026-07-01", "value": 0.029, "status": null },
        { "period": "2026-08-01", "value": 0.032, "status": null },
        { "period": "2026-09-01", "value": 0.038, "status": "e" }
      ]
    },
    { "geo": "FR", "...": "..." },
    { "geo": "DE", "...": "..." }
  ]
}
```

---

## <span className="api-method post">POST</span> `/macro/indicators/refresh`

Reads series from Eurostat into the database. Needs a full-access key: a read-only key gets `403`.

| Parameter | Default | Description |
|---|---|---|
| `geo` | `EA` | Countries or areas, separated by commas |
| `indicator` | every indicator | Repeat it to read some only |
| `force` | `false` | Read even a series read recently |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/indicators/refresh?geo=EA,FR,DE,IT,ES&force=true"
```

The answer lists one `load` per series, with `indicator`, `geo` and `received`, the number of observations read.

## Errors

| Status | When |
|---|---|
| `404` | Unknown indicator |
| `422` | A `geo` that is not a code, more than 10 countries, several countries on `GET /macro/indicators`, `start` after `end` |
| `503` | No database |

A code Eurostat does not know (`geo=XX`) is not an error of the request: the series has no value and `load.reason` gives the answer of Eurostat (`GEO=XX` not allowed).

## OpenBB widgets

- **Fonrex Macro Indicators** (`fonrex_macro_indicators`): one card per indicator for a country; the delta is the change on the previous period, in percentage points for a rate.
- **Fonrex Macro Indicator Chart** (`fonrex_macro_indicator_chart`): one indicator over time, one line per country, the last 10 years by default.

Both are in the *Macro Context* tab of the **Fonrex — Screener & Macro** dashboard. See the [OpenBB Workspace guide](../guides/openbb-workspace.md).
