---
id: "factors"
title: "Fama/French Factors API Reference"
sidebar_label: "Fama/French Factors"
description: "Factor returns of the Kenneth French Data Library, factor exposure of a listing, and the ECB exchange rates used to compare it in US dollars"
---

# Fama/French Factors API Reference

Fonrex stores the factor returns of the [Kenneth R. French Data Library](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html) (free, no key) and measures how a listing is exposed to them: market, size, value, profitability, investment and momentum.

| Route | What it does |
|---|---|
| `GET /factors` | The datasets, and what is stored of each file |
| `GET /factors/{dataset}` | The factor returns of one dataset |
| `POST /factors/refresh` | Downloads files of the library |
| `GET /factors/exposure/{ticker}` | The factor exposure of a listing: betas, alpha, R² |

The factors can also be used for the cost of equity of a valuation: see [`cost_of_equity_model`](./valuation-dcf.md#factor-cost-of-equity).

## Datasets

Nine datasets, each **monthly** and **daily**:

| Dataset | Factors |
|---|---|
| `us_3`, `europe_3`, `developed_3` | `MKT_RF`, `SMB`, `HML`, `RF` |
| `us_5`, `europe_5`, `developed_5` | `MKT_RF`, `SMB`, `HML`, `RMW`, `CMA`, `RF` |
| `us_mom`, `europe_mom`, `developed_mom` | `MOM` |

- `MKT_RF`: the market return minus the risk-free rate. `SMB`: small minus big (size). `HML`: high minus low book-to-market (value). `RMW`: robust minus weak profitability. `CMA`: conservative minus aggressive investment. `MOM`: winners minus losers of the last year (momentum). `RF`: the US one-month Treasury bill rate.
- **Every return is in US dollars**, the European and developed datasets included, and `RF` is the US rate for every region.
- Values are **ratios** (`0.0289` = 2.89 %; the library publishes percentages). A month is dated by its last day.
- History: the US since 1926 (1963 for the 5 factors), Europe and developed markets since 1990. The monthly files come out with a delay of one or two months.

## Loading the files

A file is downloaded on first use. To load them in advance:

```bash
docker compose exec fonrex-api python scripts/load_factors.py
docker compose exec fonrex-api python scripts/load_factors.py --dataset us_5 europe_5 --frequency monthly daily
```

Without option, the script loads the monthly file of every dataset. A file read less than `FACTORS_REFRESH_DAYS` days ago (7 by default) is not downloaded again; `--force` downloads it anyway. A download that fails keeps the stored values.

---

## <span className="api-method get">GET</span> `/factors`

The nine datasets, with what the database holds of each file. Downloads nothing.

```json
{
  "source": "Kenneth R. French Data Library, https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html",
  "datasets": [
    {
      "dataset": "us_3",
      "region": "us",
      "label": "US 3 factors",
      "factors": ["MKT_RF", "SMB", "HML", "RF"],
      "currency": "USD",
      "loads": [
        {
          "dataset": "us_3",
          "frequency": "monthly",
          "status": "fresh",
          "fetched_at": "2026-10-10T15:25:00Z",
          "first_period": "1926-07-31",
          "last_period": "2026-08-31",
          "periods": 1202,
          "source_note": "CRSP 202608",
          "reason": null
        },
        { "dataset": "us_3", "frequency": "daily", "status": "missing", "periods": 0, "...": "..." }
      ]
    }
  ]
}
```

`status`:

| Value | Meaning |
|---|---|
| `fetched` | Downloaded for this answer |
| `fresh` | Downloaded less than `FACTORS_REFRESH_DAYS` days ago |
| `stale` | Downloaded before: it will be downloaded again at the next read |
| `failed` | The last download failed (`reason`); the stored values are kept |
| `missing` | Never downloaded |

`source_note` is the database the library built the file from (`CRSP 202608`: CRSP data up to August 2026).

---

## <span className="api-method get">GET</span> `/factors/{dataset}`

The returns of one dataset, oldest period first. A file never downloaded, or older than `FACTORS_REFRESH_DAYS` days, is downloaded first.

| Parameter | Default | Description |
|---|---|---|
| `frequency` | `monthly` | `monthly` or `daily` |
| `start`, `end` | — | First and last period included (`YYYY-MM-DD`) |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/factors/us_3?start=2026-07-01"
```

```json
{
  "dataset": "us_3",
  "frequency": "monthly",
  "region": "us",
  "label": "US 3 factors",
  "factors": ["MKT_RF", "SMB", "HML", "RF"],
  "currency": "USD",
  "unit": "ratio",
  "source": "Kenneth R. French Data Library, https://...",
  "load": { "status": "fresh", "last_period": "2026-08-31", "periods": 1202, "source_note": "CRSP 202608", "...": "..." },
  "data": [
    { "date": "2026-07-31", "MKT_RF": -0.0061, "SMB": -0.0192, "HML": 0.0211, "RF": 0.0033 },
    { "date": "2026-08-31", "MKT_RF": 0.0256, "SMB": 0.0034, "HML": -0.0354, "RF": 0.0029 }
  ]
}
```

The figures are illustrative. When a download fails, the stored values are answered with `load.status` = `failed`.

| Code | When |
|---|---|
| `404` | Unknown dataset |
| `422` | `start` after `end`, or an unknown `frequency` |
| `503` | Nothing stored and the download failed, or no database |

---

## <span className="api-method post">POST</span> `/factors/refresh`

Downloads files of the library into the database. It changes the database: a **full-access key** is needed.

| Parameter | Default | Description |
|---|---|---|
| `dataset` | every dataset | Repeat it for several: `?dataset=us_3&dataset=europe_3` |
| `frequency` | `monthly` | Repeat it for both: `?frequency=monthly&frequency=daily` |
| `force` | `false` | Download even a file read recently |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/factors/refresh?dataset=europe_5&frequency=monthly&frequency=daily"
```

The answer lists one `load` per file, with the same fields as `GET /factors`. A file read less than `FACTORS_REFRESH_DAYS` days ago keeps its `fresh` status and is not downloaded.

---

## <span className="api-method get">GET</span> `/factors/exposure/{ticker}`

Regresses the excess returns of a listing on the factors of its region, by ordinary least squares:

> r − RF = α + Σ βₖ · Fₖ + ε

| Parameter | Default | Description |
|---|---|---|
| `model` | `ff3` | `ff3` (MKT_RF, SMB, HML), `ff5` (plus RMW, CMA) or `carhart` (ff3 plus MOM) |
| `frequency` | `monthly` | `monthly` or `daily` |
| `window` | 60 months or 252 days | Number of periods regressed (24 to 10 000) |
| `end` | last period available | Last period of the regression |
| `region` | from the currency | `us`, `europe` or `developed` |
| `currency`, `exchange`, `isin` | — | Choose the listing, as on the price routes |

**Prices first.** The regression reads the daily closes stored for the listing (`adj_close`, dividends included). Ingest them before:

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/historical/ingest?ticker=AIR.PA"
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/factors/exposure/AIR.PA?model=ff5"
```

**Region.** A listing in USD takes the US factors; in a European currency (EUR, GBP, CHF, SEK, DKK, NOK…) the European factors; in any other currency the developed-markets factors. `region` chooses another one.

**Returns in US dollars.** The factors are in dollars, so the closes of a listing in another currency are converted with the ECB reference rate of their day (or the last one within a week) before the returns are computed; `converted_from` names the original currency. A close without a rate within a week is left out, with a warning. A price in pence is turned into pounds first. The rates are downloaded when needed: see [Exchange rates](#exchange-rates).

**Periods.** A monthly return goes from the last close of a month to the last close of the next one; a daily return from one close to the next. The regression keeps the last `window` periods that have a return and every factor.

| Periods available | Result |
|---|---|
| fewer than 24 months (60 days) | `422` |
| fewer than 36 months (126 days) | Measured, with a warning: the estimates are imprecise |

```json
{
  "ticker": "AIR.PA",
  "listing": { "ticker": "AIR", "isin": "NL0000235190", "currency": "EUR", "exchange": "XPAR" },
  "model": "ff5",
  "region": "europe",
  "frequency": "monthly",
  "datasets": ["europe_5"],
  "return_currency": "USD",
  "converted_from": "EUR",
  "start": "2021-09-30",
  "end": "2026-08-31",
  "periods": 60,
  "alpha": { "value": 0.0021, "std_error": 0.0035, "t_stat": 0.6, "annualized": 0.0252 },
  "betas": {
    "MKT_RF": { "value": 1.21, "std_error": 0.14, "t_stat": 8.64 },
    "SMB": { "value": -0.35, "std_error": 0.31, "t_stat": -1.13 },
    "HML": { "value": 0.42, "std_error": 0.22, "t_stat": 1.91 },
    "RMW": { "value": 0.18, "std_error": 0.37, "t_stat": 0.49 },
    "CMA": { "value": -0.27, "std_error": 0.41, "t_stat": -0.66 }
  },
  "r_squared": 0.58,
  "adj_r_squared": 0.54,
  "residual_volatility": 0.21,
  "warnings": [],
  "source": "Kenneth R. French Data Library, https://..."
}
```

The figures are illustrative.

- `alpha.value` is per period; `alpha.annualized` multiplies it by 12 (monthly) or 252 (daily).
- `t_stat` = value / standard error. An absolute value below 2 means the coefficient is not clearly different from zero.
- `residual_volatility`: the annualised standard deviation of what the factors do not explain (the specific risk of the listing).

| Code | When |
|---|---|
| `404` | Unknown listing, or no daily prices stored |
| `422` | Too few periods, or a parameter out of range |
| `503` | No factor file or no ECB rate could be downloaded, or no database |

---

## Exchange rates {#exchange-rates}

To convert prices into dollars, Fonrex keeps the **ECB reference rates** of the euro, day by day since 1999 (free, no key), in the `fx_rates` table. The rate between two currencies goes through the euro: dollars per pound = (USD per EUR) / (GBP per EUR). A currency read less than `FX_RATES_REFRESH_HOURS` hours ago (12 by default) is not asked again; a refresh only asks for the new days.

The exposure route downloads the rates it needs. To load them in advance (USD, GBP, CHF, SEK, DKK, NOK, JPY, CAD, AUD and HKD by default):

```bash
docker compose exec fonrex-api python scripts/load_fx_rates.py
docker compose exec fonrex-api python scripts/load_fx_rates.py --currency USD GBP CHF --force
```

## Settings

| Variable | Default | Description |
|---|---|---|
| `FACTORS_REFRESH_DAYS` | `7` | Days before a factor file is downloaded again (1 to 90); the library is updated about once a month |
| `FRENCH_LIBRARY_URL` | `https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp` | Address of the library files; set only to use a mirror |
| `FX_RATES_REFRESH_HOURS` | `12` | Hours before the ECB rates of a currency are asked again (1 to 720) |

## In OpenBB Workspace

Two widgets show these routes: **Fonrex Factor Exposure** (table) and **Fonrex Factor Returns** (cumulative returns chart). See the [OpenBB reference](./openbb.md).
