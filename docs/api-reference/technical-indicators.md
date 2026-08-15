---
id: "technical-indicators"
title: "Technical Indicators API Reference"
sidebar_label: "Technical Indicators"
description: "Compute trend, momentum, volatility, and volume technical indicators, batch calculation, and market screening"
---

# Technical Indicators API Reference

The Technical Indicators API leverages the `pandas-ta` calculation engine to compute 18+ technical indicators, return OHLCV chart overlays, batch multi-ticker indicator calculations, and screen markets based on technical criteria.

---

## <span className="api-method get">GET</span> `/technical/{ticker}`

Calculate a single technical indicator for a ticker.

:::note Prerequisite
Requires prior historical data ingestion via `POST /historical/ingest?ticker={ticker}`. Returns `404` (`{"detail": "No historical data found for {ticker}"}`) if no historical data exists for the given ticker.
:::

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Financial ticker (e.g. `AIR.PA`) |
| `indicator` | `string` | ✅ | — | Indicator code (`sma`, `ema`, `rsi`, `macd`, `bbands`, `stoch`, `atr`, `obv`, `adx`, `vwap`, etc.) |
| `period` | `integer` | ❌ | `14` | Main lookback period |
| `resolution` | `string` | ❌ | `d` | Candle resolution (`d`, `w`, `m`) |

### Response Example

```json
{
  "ticker": "AIR.PA",
  "indicator": "rsi",
  "period": 14,
  "count": 50,
  "values": [
    { "time": "2026-08-10T00:00:00Z", "value": 58.42 },
    { "time": "2026-08-11T00:00:00Z", "value": 61.15 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/technical/{ticker}/multi`

Compute multiple technical indicators in a single HTTP request.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker symbol |
| `indicators` | `string` | ✅ | — | Comma-separated indicator list (e.g. `rsi,sma,macd`) |
| `period` | `integer` | ❌ | `14` | Default period applied to simple indicators |

---

## <span className="api-method get">GET</span> `/technical/{ticker}/chart`

Retrieve combined OHLCV candles overlaid with selected technical indicator series formatted for charting libraries (TradingView Lightweight Charts, Highcharts).

---

## <span className="api-method post">POST</span> `/technical/batch`

Batch calculation across multiple tickers and indicators.

### Request Body

```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL"],
  "indicators": [
    { "name": "rsi", "period": 14 },
    { "name": "sma", "period": 50 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/technical/list`

Retrieve the catalog of supported technical indicators, default parameters, and descriptions.

---

## <span className="api-method get">GET</span> `/technical/screen`

Screen database assets against technical conditions (e.g., RSI under oversold threshold 30).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `indicator` | `string` | ✅ | — | Indicator to evaluate (e.g. `rsi`) |
| `condition` | `string` | ✅ | — | Logical operator (`lt`, `gt`, `crosses_above`, `crosses_below`) |
| `target_value` | `number` | ✅ | — | Numeric threshold (e.g. `30.0`) |
