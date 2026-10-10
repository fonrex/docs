---
id: "python-jupyter"
title: "Using Fonrex from Python and Jupyter"
sidebar_label: "Python & Jupyter"
description: "Load prices from your Fonrex instance into pandas, and replace OpenBB price calls in a notebook"
---

# Using Fonrex from Python and Jupyter

Fonrex is an HTTP API: there is no `fonrex` Python package to import, and Fonrex is not an OpenBB Platform provider (`obb`). From Python, you call your instance with `requests` and build pandas objects from the JSON answers. A dozen lines replace a call such as `obb.equity.price.historical(...)`.

## Prerequisites

- A running instance — see [Installation](../getting-started/installation.md).
- An API key in the environment, set before starting Jupyter. A **read-only** key is enough to read prices:

```bash
export FONREX_URL=http://localhost:5000
export FONREX_API_KEY=frx_live_...
jupyter lab
```

- The listings you need in the catalogue (next section).

## 1. Put the listings in the catalogue

Fonrex stores prices per **listing** of an instrument known by its ISIN. A ticker that is not in the catalogue has no prices: `GET /eod/{ticker}` answers `404` with `"reason": "No listing found for ticker ..."`.

The example below uses eight US stocks and the SPY ETF. Write them in a CSV file ([download it](pathname:///notebooks/us-hedging-listings.csv)):

```csv
name,ticker,isin,productType,currency
Newmont Corporation,NEM,US6516391066,STOCK,USD
Royal Gold Inc,RGLD,US7802871084,STOCK,USD
SSR Mining Inc,SSRM,CA7847301032,STOCK,USD
Coeur Mining Inc,CDE,US1921085049,STOCK,USD
Eli Lilly and Co,LLY,US5324571083,STOCK,USD
UnitedHealth Group Inc,UNH,US91324P1021,STOCK,USD
Johnson & Johnson,JNJ,US4781601046,STOCK,USD
Merck & Co Inc,MRK,US58933Y1055,STOCK,USD
SPDR S&P 500 ETF Trust,SPY,US78462F1030,ETF,USD
```

Send the file to the container through standard input, then import it. The file is created by the user of the container, which can read it; with `docker compose cp` it would keep the permissions of your machine and the import could fail with `Permission denied`.

```bash
docker compose exec -T fonrex-api sh -c 'cat > /tmp/us-hedging-listings.csv' < us-hedging-listings.csv
docker compose exec fonrex-api python import_assets.py --file /tmp/us-hedging-listings.csv
```

See [Importing assets](import-assets.md) for the CSV rules.

## 2. Read prices into pandas

`GET /eod/{ticker}` with `from` and `to` returns the daily bars of a window. When the database has no bar in that window, the route first ingests it from Yahoo Finance (with the symbol verified for the listing), so the first call of a ticker takes a few seconds.

A ticker alone does not always designate one instrument. In the default catalogue, `NEM` is Newmont in USD, its Australian line in AUD and Nemetschek in EUR; `MRK` is also Merck KGaA, and `CDE` also City Developments. Name each instrument with its **ISIN** (`isin`) and the listing with its **currency** (`currency`): together they designate one listing.

```python
import os

import pandas as pd
import requests

FONREX_URL = os.environ.get("FONREX_URL", "http://localhost:5000")
FONREX_API_KEY = os.environ["FONREX_API_KEY"]


def fonrex_prices(instruments, start_date, end_date, currency="USD"):
    """Daily closing prices of several listings, one column per ticker.

    ``instruments`` maps each ticker to the ISIN of its instrument.
    """
    session = requests.Session()
    session.headers["X-API-KEY"] = FONREX_API_KEY
    closes = {}
    for ticker, isin in instruments.items():
        response = session.get(
            f"{FONREX_URL}/eod/{ticker}",
            params={"from": start_date, "to": end_date, "isin": isin, "currency": currency},
            timeout=120,  # the first call ingests the prices from Yahoo Finance
        )
        if response.status_code != 200:
            raise RuntimeError(f"{ticker}: {response.status_code} {response.text}")
        bars = pd.DataFrame(response.json()["data"])
        closes[ticker] = bars.set_index(pd.to_datetime(bars["Date"]))["Close"]
    data = pd.DataFrame(closes).sort_index(axis=1)
    data.index.name = "date"
    data.columns.name = "symbol"
    return data


data = fonrex_prices(
    {"NEM": "US6516391066", "LLY": "US5324571083", "SPY": "US78462F1030"},
    "2020-01-01",
    "2022-12-31",
)
```

Each bar has `Date`, `Open`, `High`, `Low`, `Close`, `Adj Close` and `Volume`. The answer also gives the `listing` that was read (`ticker`, `isin`, `currency`, `exchange`) — see [`GET /eod/{ticker}`](../api-reference/assets.md).

:::tip Without the ISIN
`isin` is optional. Without it, Fonrex takes, among the listings bearing the ticker, the primary one first, then by currency in alphabetical order: `/eod/NEM` without `isin` nor `currency` returns the Australian line in AUD. With `currency="USD"` alone, the nine tickers of the example happen to be unique, but 196 ticker and currency pairs of the default catalogue still belong to several instruments. Check `listing.isin` in the answer when you do not pass `isin`.
:::

## Replacing OpenBB in a notebook

| OpenBB | Fonrex |
|---|---|
| `from openbb import obb` | `import requests` and the `fonrex_prices()` function above |
| `obb.equity.price.historical(symbols, start_date=..., end_date=..., provider="yfinance")` | `fonrex_prices(instruments, start_date, end_date)`, with `instruments` mapping each ticker to its ISIN |
| `.pivot(columns="symbol", values="close")` | Already done: one column per symbol, index `date` |
| `obb.user.preferences.output_type = "dataframe"` | Not needed |

The rest of a notebook that works on the DataFrame (`pct_change()`, regressions, plots) does not change.

:::note Close or Adj Close
`Close` is the traded close, adjusted for splits only — the default of OpenBB's `yfinance` provider, so the notebook gives the same numbers as with OpenBB. `Adj Close` is also adjusted for dividends: use it for returns that include dividends, the usual choice to measure alpha and beta.
:::

## Example notebook: beta hedging

[beta-hedging-fonrex.ipynb](pathname:///notebooks/beta-hedging-fonrex.ipynb) builds an equally weighted portfolio of gold stocks (NEM, RGLD, SSRM, CDE) and healthcare stocks (LLY, UNH, JNJ, MRK), estimates its alpha and beta against SPY with an OLS regression (`statsmodels`), then builds a beta-hedged portfolio whose beta is about zero.

Its only Fonrex-specific part is the price loading:

```python
instruments = {
    "NEM": "US6516391066",   # Newmont
    "RGLD": "US7802871084",  # Royal Gold
    "SSRM": "CA7847301032",  # SSR Mining
    "CDE": "US1921085049",   # Coeur Mining
    "LLY": "US5324571083",   # Eli Lilly
    "UNH": "US91324P1021",   # UnitedHealth
    "JNJ": "US4781601046",   # Johnson & Johnson
    "MRK": "US58933Y1055",   # Merck & Co
    "SPY": "US78462F1030",   # SPDR S&P 500 ETF
}
data = fonrex_prices(instruments, start_date="2020-01-01", end_date="2022-12-31")

benchmark_returns = data.pop("SPY").pct_change().dropna()
portfolio_returns = data.pct_change().dropna().sum(axis=1)
```

Import the listings of step 1, set `FONREX_API_KEY`, then open the notebook in Jupyter.

## Troubleshooting

| Answer | Cause |
|---|---|
| `401` | `FONREX_API_KEY` is missing or not a key of the instance |
| `400` with `L'ISIN ... n'est pas valide` | The ISIN does not have 12 characters (two letters, then ten letters or digits) |
| `404` with `No listing found for ticker` | No listing of the catalogue has this ticker with this ISIN and currency: import it, or check the ISIN |
| `404` with another `reason` | The ingestion failed, e.g. no Yahoo symbol quoted in the currency of the listing |
| `404` `No data found` without `reason`, or fewer rows than expected | The database already holds other dates of the listing: `/eod` ingests only an empty window, and the ingestion completes after the last stored date. Fetch the window again with a full-access key: `POST /historical/ingest?ticker=NEM&isin=US6516391066&currency=USD&from_date=2020-01-01&to_date=2022-12-31&force_refresh=true` |

## Related pages

- [Historical prices API](../api-reference/historical.md)
- [Ingesting historical data](ingest-historical-data.md)
- [Quant & Algo-Trader pathway](../pathways/quant-trader.md)
