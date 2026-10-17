---
id: "treasury-curves"
title: "US Treasury Yield Curves API Reference"
sidebar_label: "Treasury Yield Curves"
description: "The daily yield curves of the US Treasury, nominal since 1990 and real (TIPS) since 2003: the curve of a day, maturities and spreads over time, breakeven inflation"
---

# US Treasury Yield Curves API Reference

Fonrex reads the daily yield curves of the [US Treasury](https://home.treasury.gov/resource-center/data-chart-center/interest-rates) (free files, no key) and keeps them in your database, day by day:

- the **nominal curve** (par yields), since 1990, from 1 month to 30 years;
- the **real curve** (TIPS, inflation-protected), since 2003, from 5 to 30 years.

FRED republishes the 10-year rate of this curve (`DGS10`) and needs a key. The Treasury gives the whole curve, every day since 1990, without key: it is also the US risk-free rate of the DCF when FRED gives none (see [Valuation](./valuation-dcf.md)).

| Route | What it does |
|---|---|
| `GET /macro/treasury/curve` | The curve of a day, with the breakeven inflation and comparisons with other days |
| `GET /macro/treasury/series` | Maturities (`10Y`) and spreads (`10Y-2Y`) over time |
| `POST /macro/treasury/refresh` | Reads years of the curves from the Treasury on demand |

## Maturities

| `tenor` | Maturity | Nominal curve | Real curve |
|---|---|---|---|
| `1M`, `2M`, `3M`, `4M`, `6M` | 1, 2, 3, 4, 6 months | ✓ | |
| `6W` | 6 weeks (the Treasury's "1.5 Month") | ✓ | |
| `1Y`, `2Y`, `3Y` | 1, 2, 3 years | ✓ | |
| `5Y`, `7Y`, `10Y`, `20Y`, `30Y` | 5, 7, 10, 20, 30 years | ✓ | ✓ |

The maturities published changed over the years: `1M` since July 2001, `2M` since October 2018, `4M` since October 2022, `6W` since February 2025; no `20Y` before October 1993, no `30Y` from February 2002 to February 2006; on the real curve, `20Y` since July 2004 and `30Y` since February 2010. A maturity not published on a day has no rate: a curve of 1990 has 9 maturities, one of 2026 has 14.

- **Rates are ratios**: `0.0509` is 5.09 %. A real yield may be negative (every day of 2012 and of 2021), a nominal one may be zero (2008 to 2015, 2020, 2021).
- **A day is a business day of the Treasury**: a weekend or a holiday has no curve, and a request for that day gets the business day before.

## Freshness

A year of a curve is read from the Treasury the first time a request needs it: one file a year, a few kilobytes. After that:

- a **past year** read after its end is complete: it is never asked again;
- the **current year** is read again once its last reading is older than **`TREASURY_REFRESH_HOURS`** hours (12 by default);
- when the Treasury does not answer, the stored rates are given with `load.status` = `failed` and the reason, and the next years of the request are not asked.

To load the whole history at once (37 files for the nominal curve, 24 for the real one):

```bash
docker compose exec fonrex-api python scripts/load_treasury_curve.py
```

Every answer says, in `load`, what was done: `fetched` (a year read now), `fresh` (everything needed was stored) or `failed`, with the years read and the first and last day stored.

---

## <span className="api-method get">GET</span> `/macro/treasury/curve`

The curve of one day, shortest maturity first, with the **breakeven inflation** of the day (nominal minus real yield, from 5 to 30 years).

| Parameter | Default | Description |
|---|---|---|
| `curve` | `nominal` | `nominal` or `real` |
| `date` | the latest day | The business day on or before it |
| `compare` | — | Up to 5 other days, repeated: a date, or an offset before the day (`1W`, `1M`, `3M`, `1Y`) |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/treasury/curve?compare=1M&compare=1Y"
```

```json
{
  "curve": "nominal",
  "label": "Par yield curve (nominal)",
  "source": "US Treasury, Daily Treasury Par Yield Curve Rates (https://home.treasury.gov)",
  "requested_date": null,
  "date": "2026-10-16",
  "points": [
    { "tenor": "1M", "months": 1.0, "value": 0.0412 },
    { "tenor": "6W", "months": 1.5, "value": 0.0414 },
    { "tenor": "2Y", "months": 24.0, "value": 0.0474 },
    { "tenor": "10Y", "months": 120.0, "value": 0.0509 },
    { "tenor": "30Y", "months": 360.0, "value": 0.0543 }
  ],
  "comparisons": [
    {
      "requested": "1M",
      "date": "2026-09-16",
      "points": [{ "tenor": "10Y", "months": 120.0, "value": 0.0501, "change": 0.0008 }]
    },
    {
      "requested": "1Y",
      "date": "2025-10-16",
      "points": [{ "tenor": "10Y", "months": 120.0, "value": 0.0399, "change": 0.011 }]
    }
  ],
  "breakeven": [
    { "tenor": "5Y", "months": 60.0, "value": 0.0237 },
    { "tenor": "10Y", "months": 120.0, "value": 0.0235 },
    { "tenor": "30Y", "months": 360.0, "value": 0.0227 }
  ],
  "load": {
    "status": "fresh",
    "fetched_at": "2026-10-17T10:32:05Z",
    "first_day": "1990-01-02",
    "last_day": "2026-10-16",
    "years_read": [],
    "years_failed": [],
    "reason": null
  }
}
```

The lists are shortened here: the answer gives every maturity of the day. `change` is the rate of the day asked minus the rate of the day compared (`0.011` is 110 basis points); a comparison before the first day stored has no date and no points. `breakeven` is empty on a day without real yields (before 2003).

---

## <span className="api-method get">GET</span> `/macro/treasury/series`

Maturities, and spreads between two maturities, day by day, oldest first.

| Parameter | Default | Description |
|---|---|---|
| `tenor` | `10Y` | Up to 6 maturities (`10Y`) or spreads (`10Y-2Y`), repeated or separated by commas |
| `curve` | `nominal` | `nominal` or `real` |
| `start` | 10 years before `end` | First day included |
| `end` | today | Last day included |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/treasury/series?tenor=10Y-2Y&start=2023-07-01&end=2023-07-05"
```

```json
{
  "curve": "nominal",
  "label": "Par yield curve (nominal)",
  "source": "US Treasury, Daily Treasury Par Yield Curve Rates (https://home.treasury.gov)",
  "start": "2023-07-01",
  "end": "2023-07-05",
  "series": [
    {
      "tenor": "10Y-2Y",
      "observations": [
        { "date": "2023-07-03", "value": -0.0108 },
        { "date": "2023-07-05", "value": -0.0099 }
      ]
    }
  ],
  "load": { "status": "fresh", "...": "..." }
}
```

A spread is given only on the days both maturities are published. Below zero, the curve is **inverted**: the 10-year minus 2-year spread was negative on 1 and 4 April 2022, then from July 2022 to September 2024, down to -1.08 % on 3 July 2023.

---

## <span className="api-method post">POST</span> `/macro/treasury/refresh`

Reads years of the curves from the Treasury into the database. Needs a full-access key: a read-only key gets `403`.

| Parameter | Default | Description |
|---|---|---|
| `curve` | both | `nominal`, `real`, repeated |
| `start_year`, `end_year` | the current year | Years read (1990 or later) |
| `force` | `false` | Read even the years that are up to date |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/treasury/refresh?start_year=1990"
```

The answer lists one `load` per curve, with its `curve`.

## Errors

| Status | When |
|---|---|
| `404` | No curve on or before the day asked (the nominal curve starts in 1990, the real one in 2003) |
| `422` | Unknown curve, a maturity the curve does not publish (`2Y` of the real curve), a spread of more than two maturities, more than 6 series or 5 comparisons, `start` after `end`, a `compare` that is neither a date nor an offset |
| `502` | The Treasury could not be read and nothing is stored for the curve |
| `503` | No database |

## OpenBB widgets

- **Fonrex Treasury Curve** (`fonrex_treasury_curve`): the curve of the day, with the curves of 1 month and 1 year before as dotted lines (`compare`, `1M,1Y` by default); `curve` and `date` as above.
- **Fonrex Treasury Spread** (`fonrex_treasury_spread`): the 10-year minus 2-year spread over the last 10 years, with a zero line; `tenor` also takes `10Y-3M`, `30Y-5Y` or maturities (`2Y,10Y`).

Both are in the *Macro Context* tab of the **Fonrex — Screener & Macro** dashboard. See the [OpenBB Workspace guide](../guides/openbb-workspace.md).
