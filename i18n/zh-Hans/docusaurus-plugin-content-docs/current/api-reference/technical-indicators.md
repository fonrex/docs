---
id: "technical-indicators"
title: "技术指标 API 参考"
sidebar_label: "技术指标"
description: "18 个服务端技术指标、多指标请求、图表数据及筛选器"
---

# 技术指标 API 参考

Fonrex 使用 pandas-ta 基于**数据库中存储的价格**计算 18 个指标。请求某个上市品种的指标之前，请先采集该上市品种（`GET /eod/{ticker}` 或 `POST /historical/ingest`）。没有价格时，`GET /technical/{ticker}` 返回 `404`；`/multi` 和 `/chart` 返回空的 K 线，并在 `errors` 中给出原因。

| 类别 | 指标（默认参数） |
|---|---|
| 趋势 | `sma` (20)、`ema` (20)、`wma` (20)、`dema` (20)、`tema` (20)、`vwap`（仅日内） |
| 动量 | `rsi` (14)、`macd` (12, 26, 9)、`stoch` (14, 3, 3)、`cci` (20)、`roc` (10)、`mom` (10) |
| 波动率 | `bbands` (20, 2.0)、`atr` (14)、`kc` (20) |
| 成交量 | `obv`、`ad`、`mfi` (14) |

`GET /technical/list` 返回此目录，包括每个指标的参数、输出列以及所需的最少 K 线数量。

分辨率 `1D`（默认）、`1W` 和 `1M` 读取该上市品种的日终价格；日内分辨率（如 `1min`）读取实时数据流保存的 1 分钟 K 线（`prices_intraday`）。当 `TECHNICAL_CACHE_ENABLED=true` 时，结果缓存在 Redis 中（日线为 1 小时，1 分钟线为 60 秒）。

---

## <span className="api-method get">GET</span> `/technical/{ticker}`

单个指标。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `indicator` | string | `rsi` | 指标名称 |
| `period` | integer | — | 设置 `length` 参数（`macd` 和 `stoch` 不使用该参数，它们使用 `fast`/`slow`/`signal` 或其默认值） |
| `fast`, `slow`, `signal` | integer | — | MACD 参数 |
| `std` | number | — | 布林带标准差倍数 |
| `resolution` | string | `1D` | `1D`、`1W`、`1M` 或日内（`1min`） |
| `from_date`, `to_date` | date | — | 时间窗口 `YYYY-MM-DD` |
| `limit` | integer | `500` | 加载的 K 线数量（`TECHNICAL_DEFAULT_LIMIT`） |

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

有多个输出的指标（MACD、布林带、随机指标……）在 `series` 中每个输出各占一项。值为十进制字符串；在指标的 K 线数量不足时为 `null`。

| 状态码 | 触发条件 |
|---|---|
| `400` | 未知指标，或在日线上请求 VWAP |
| `404` | 该代码没有已存储的价格 |
| `422` | K 线数量不足以满足参数要求 |

---

## <span className="api-method get">GET</span> `/technical/{ticker}/multi`

基于一次价格读取计算多个指标。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `indicators` | string | `sma_20,ema_50,rsi_14,macd` | 以逗号分隔的名称；后缀用于设置第一个参数（`sma_50`、`bbands_20`） |
| `resolution`, `from_date`, `to_date`, `limit` | | | 同上 |
| `include_ohlcv` | boolean | `false` | 同时返回 K 线 |

响应在 `indicators` 中为每个指标保存一个结果（格式同上），失败的指标列在 `errors` 中。

---

## <span className="api-method get">GET</span> `/technical/{ticker}/chart`

K 线与指标列按相同时间戳对齐，可直接用于图表库。

| 参数 | 默认值 |
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

一次处理多个代码。JSON 请求体：

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

最多 `TECHNICAL_MAX_BATCH_TICKERS` 个代码（20）和 `TECHNICAL_MAX_BATCH_INDICATORS` 个指标（10）。响应将每个代码映射到一个多指标结果。该路由只做计算：只读密钥也可以调用。

---

## <span className="api-method get">GET</span> `/technical/screen`

筛选目录中某个指标最新值满足条件的金融工具。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `indicator` | string | `rsi` | 指标 |
| `operator` | string | `lt` | `lt`、`gt`、`lte`、`gte` |
| `value` | number | `30` | 阈值 |
| `resolution` | string | `1D` | 分辨率 |
| `period` | integer | `14` | 指标长度 |
| `limit` | integer | `50` | 最大匹配数 |

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

筛选器结果缓存 15 分钟。
