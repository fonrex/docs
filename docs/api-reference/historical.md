---
id: "historical"
title: "Historical Ingestion API Reference"
sidebar_label: "Historical Prices"
description: "Ingest end-of-day prices into TimescaleDB and read them back"
---

# Historical Ingestion API Reference

Prices are stored per **listing**, resolution (`1D`, `1W`, `1M`) and trading session in the `prices_eod` hypertable. The ingestion routes change data: they need a **full-access** key (a read-only key gets `403`).

---

## <span className="api-method post">POST</span> `/historical/ingest`

Ingest the history of one listing. The parameters are **query parameters**.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `ticker` | string | — | Ticker to ingest (required) |
| `resolution` | string | `1D` | `1D`, `1W` or `1M` |
| `source` | string | `auto` | `auto` (Yahoo Finance, then TradingView), `yfinance` or `tradingview` |
| `force_refresh` | boolean | `false` | Fetch the whole range again, replace the stored bars of that range and look the source symbol up again |
| `from_date`, `to_date` | date | — | Window `YYYY-MM-DD`. Without them: ten years on a first ingestion, otherwise from the day after the last stored session |
| `currency`, `exchange` | string | — | Choose the listing when several share the ticker (the primary one otherwise) |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/historical/ingest?ticker=AIR.PA"
```

```json
{
  "ticker": "AIR.PA",
  "resolution": "1D",
  "status": "success",
  "source_used": "yfinance",
  "provider_symbol": "AIR.PA",
  "records_added": 2531,
  "from_date": "2016-10-10",
  "to_date": "2026-10-07",
  "duration_ms": 1840,
  "error": null,
  "note": null
}
```

| Field | Meaning |
|---|---|
| `status` | `success`, `up_to_date` (nothing to fetch) or `failed` |
| `source_used` | `yfinance` or `tradingview`; on a failure, the source that was asked (`auto`…) |
| `provider_symbol` | The symbol asked to the source — the Yahoo symbol verified for the listing, or the TradingView symbol |
| `note` | Why Yahoo was not the source, when the prices come from TradingView |
| `error` | Why nothing could be ingested, e.g. no Yahoo symbol quoted in the currency of the listing |

---

## <span className="api-method post">POST</span> `/historical/ingest/bulk`

Ingest several tickers in parallel. JSON body:

```json
{
  "tickers": ["AIR.PA", "BNP.PA", "MC.PA"],
  "resolution": "1D",
  "source": "auto",
  "force_refresh": false,
  "concurrency": 5
}
```

`concurrency` is between 1 and 20. Each ticker designates its primary listing. The answer is `{"status": "completed", "results": [...]}` with one result per ticker, in the format above.

---

## <span className="api-method get">GET</span> `/ticker/{symbol}/history`

OHLCV bars of a listing, read from the database only — this route never ingests. Bars are returned newest first.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `symbol` | string | — | Ticker |
| `start_date`, `end_date` | date | — | Window `YYYY-MM-DD` |
| `interval` | string | `1D` | `1D`, `1W`, `1M` (or `daily`, `weekly`, `monthly`) |
| `currency`, `exchange` | string | — | Choose the listing |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/ticker/AIR.PA/history?start_date=2026-09-28&end_date=2026-10-02"
```

```json
{
  "ticker": "AIR.PA",
  "interval": "1D",
  "count": 5,
  "data": [
    { "time": "2026-10-02T00:00:00Z", "open": 149.07, "high": 151.07, "low": 147.07, "close": 150.07, "adj_close": 150.07, "volume": 1395000 },
    { "time": "2026-10-01T00:00:00Z", "open": 147.97, "high": 149.97, "low": 145.97, "close": 148.97, "adj_close": 148.97, "volume": 1394000 }
  ]
}
```

`time` is the date of the trading session, at midnight UTC. Answers are cached 24 hours and dropped when the ticker is ingested again.

---

## Weekly and monthly bars

Besides the `1W` and `1M` bars you can ingest, the database maintains two continuous aggregates computed from the daily bars of each listing, `prices_weekly` and `prices_monthly`. They are refreshed daily and answer from the daily bars for the recent period.

See [Ingesting historical data](../guides/ingest-historical-data.md) for the pipeline and the choice of the source symbol.
