---
id: "technical-indicators"
title: "技术指标 API 参考"
sidebar_label: "技术指标"
description: "计算趋势、动量、波动性和成交量技术指标、批量计算及市场筛选"
---


# 技术指标 API 参考

技术指标 API 利用 `pandas-ta` 计算引擎来计算 18+ 种技术指标、返回 OHLCV 图表叠加数据、批量计算多股票代码指标，并根据技术条件筛选市场。

---

## <span className="api-method get">GET</span> `/technical/{ticker}`

针对股票代码计算单个技术指标。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Financial ticker (e.g. `AIR.PA`) |
| `indicator` | `string` | ✅ | — | Indicator code (`sma`, `ema`, `rsi`, `macd`, `bbands`, `stoch`, `atr`, `obv`, `adx`, `vwap`, etc.) |
| `period` | `integer` | ❌ | `14` | Main lookback period |
| `resolution` | `string` | ❌ | `d` | K 线周期 (`d`, `w`, `m`) |

### 响应示例

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

在单个 HTTP 请求中计算多个技术指标。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker symbol |
| `indicators` | `string` | ✅ | — | Comma-separated indicator list (e.g. `rsi,sma,macd`) |
| `period` | `integer` | ❌ | `14` | 默认值 period applied to simple indicators |

---

## <span className="api-method get">GET</span> `/technical/{ticker}/chart`

获取与所选技术指标序列叠加的组合 OHLCV K 线，格式专为图表库（TradingView Lightweight Charts、Highcharts）定制。

---

## <span className="api-method post">POST</span> `/technical/batch`

跨多个股票代码和指标进行批量计算。

### 请求体 (Request Body)

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

获取支持的技术指标目录、默认参数及说明描述。

---

## <span className="api-method get">GET</span> `/technical/screen`

根据技术条件筛选数据库中的资产（例如 RSI 低于超卖阈值 30）。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `indicator` | `string` | ✅ | — | Indicator to evaluate (e.g. `rsi`) |
| `condition` | `string` | ✅ | — | Logical operator (`lt`, `gt`, `crosses_above`, `crosses_below`) |
| `target_value` | `number` | ✅ | — | Numeric threshold (e.g. `30.0`) |
