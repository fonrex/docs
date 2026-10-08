---
id: "technical-indicators"
title: "Technical Indicators API Reference"
sidebar_label: "Technical Indicators"
description: "18 server-side technical indicators, multi-indicator requests, chart data and a screener"
---

# Technical Indicators API Reference

Fonrex computes 18 indicators with pandas-ta on the prices **stored in the database**. Ingest a listing before asking for its indicators (`GET /eod/{ticker}` or `POST /historical/ingest`). Without prices, `GET /technical/{ticker}` answers `404`; `/multi` and `/chart` answer with no bars and the reason in `errors`.

| Category | Indicators (default parameters) |
|---|---|
| Trend | `sma` (20), `ema` (20), `wma` (20), `dema` (20), `tema` (20), `vwap` (intraday only) |
| Momentum | `rsi` (14), `macd` (12, 26, 9), `stoch` (14, 3, 3), `cci` (20), `roc` (10), `mom` (10) |
| Volatility | `bbands` (20, 2.0), `atr` (14), `kc` (20) |
| Volume | `obv`, `ad`, `mfi` (14) |

`GET /technical/list` returns this catalogue with the parameters, the output columns and the minimum number of bars of each indicator.

Resolutions `1D` (default), `1W` and `1M` read the end-of-day prices of the listing; an intraday resolution such as `1min` reads the 1-minute candles saved by the realtime stream (`prices_intraday`). Results are cached in Redis (1 hour for daily bars, 60 seconds for 1-minute bars) when `TECHNICAL_CACHE_ENABLED=true`.

---

## <span className="api-method get">GET</span> `/technical/{ticker}`

One indicator.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `indicator` | string | `rsi` | Indicator name |
| `period` | integer | — | Sets the `length` parameter (not used by `macd` and `stoch`, which take `fast`/`slow`/`signal` or their defaults) |
| `fast`, `slow`, `signal` | integer | — | MACD parameters |
| `std` | number | — | Bollinger standard deviations |
| `resolution` | string | `1D` | `1D`, `1W`, `1M`, or intraday (`1min`) |
| `from_date`, `to_date` | date | — | Window `YYYY-MM-DD` |
| `limit` | integer | `500` | Bars loaded (`TECHNICAL_DEFAULT_LIMIT`) |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/technical/AIR.PA?indicator=rsi&period=14&limit=60"
```

```json
{
  "ticker": "AIR.PA",
  "indicator": "rsi",
  "params": { "length": 14 },
  "resolution": "1D",
  "category": "momentum",
  "from_date": "2026-07-16T00:00:00Z",
  "to_date": "2026-10-07T00:00:00Z",
  "count": 60,
  "series": [
    {
      "name": "RSI_14",
      "label": "RSI",
      "values": [
        { "t": "2026-07-16T00:00:00Z", "v": null },
        { "t": "2026-10-07T00:00:00Z", "v": "74.81" }
      ]
    }
  ],
  "cached": false,
  "calculated_at": "2026-10-08T16:34:58Z"
}
```

An indicator with several outputs (MACD, Bollinger Bands, Stochastic…) has one entry per output in `series`. Values are decimal strings, `null` while the indicator has too few bars.

| Code | When |
|---|---|
| `400` | Unknown indicator, or VWAP asked on daily bars |
| `404` | No prices stored for the ticker |
| `422` | Not enough bars for the parameters |

---

## <span className="api-method get">GET</span> `/technical/{ticker}/multi`

Several indicators computed on one read of the prices.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `indicators` | string | `sma_20,ema_50,rsi_14,macd` | Comma-separated names; a suffix sets the first parameter (`sma_50`, `bbands_20`) |
| `resolution`, `from_date`, `to_date`, `limit` | | | As above |
| `include_ohlcv` | boolean | `false` | Also return the bars |

The answer holds one result per indicator in `indicators` (same format as above) and the failures in `errors`.

---

## <span className="api-method get">GET</span> `/technical/{ticker}/chart`

Bars and indicator columns aligned on the same timestamps, ready for a charting library.

| Parameter | Default |
|---|---|
| `indicators` | `sma_20,ema_50,volume` |
| `limit` | `200` |

```json
{
  "ticker": "AIR.PA",
  "resolution": "1D",
  "timestamps": ["2026-08-27", "2026-08-28"],
  "ohlcv": { "open": [158.14, 157.45], "high": [160.14, 159.45], "low": [156.14, 155.45], "close": [159.14, 158.45], "volume": [1359000, 1360000] },
  "indicators": { "SMA_20": [null, null], "RSI_14": [null, 0.0] }
}
```

---

## <span className="api-method post">POST</span> `/technical/batch`

Several tickers at once. JSON body:

```json
{
  "tickers": ["AIR.PA", "BNP.PA", "MC.PA"],
  "indicators": ["rsi_14", "sma_50"],
  "resolution": "1D",
  "from_date": null,
  "to_date": null,
  "limit": 500,
  "include_ohlcv": false
}
```

At most `TECHNICAL_MAX_BATCH_TICKERS` tickers (20) and `TECHNICAL_MAX_BATCH_INDICATORS` indicators (10). The answer maps each ticker to a multi-indicator result. This route only computes: a read-only key may call it.

---

## <span className="api-method get">GET</span> `/technical/screen`

Instruments of the catalogue whose last value of an indicator meets a condition.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `indicator` | string | `rsi` | Indicator |
| `operator` | string | `lt` | `lt`, `gt`, `lte`, `gte` |
| `value` | number | `30` | Threshold |
| `resolution` | string | `1D` | Resolution |
| `period` | integer | `14` | Indicator length |
| `limit` | integer | `50` | Maximum matches |

```json
{
  "indicator": "rsi",
  "params": { "length": 14 },
  "operator": "gt",
  "value": 50.0,
  "resolution": "1D",
  "matches": [ { "ticker": "AIR.PA", "name": "Airbus SE", "isin": "NL0000235190", "value": "74.81" } ],
  "total": 1,
  "calculated_at": "2026-10-08T16:34:59Z"
}
```

Screener results are cached 15 minutes.
