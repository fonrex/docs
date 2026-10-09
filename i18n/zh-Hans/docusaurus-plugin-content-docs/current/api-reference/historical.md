---
id: "historical"
title: "历史数据采集 API 参考"
sidebar_label: "历史价格"
description: "将日终价格采集到 TimescaleDB 并读取"
---

# 历史数据采集 API 参考

价格按**上市品种**、分辨率（`1D`、`1W`、`1M`）和交易日存储在 `prices_eod` 超表（hypertable）中。采集路由会修改数据：它们需要**完全访问密钥**（只读密钥会收到 `403`）。

---

## <span className="api-method post">POST</span> `/historical/ingest`

采集单个上市品种的历史数据。参数为**查询参数**。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `ticker` | string | — | 要采集的代码（必填） |
| `resolution` | string | `1D` | `1D`、`1W` 或 `1M` |
| `source` | string | `auto` | `auto`（先 Yahoo Finance，再 TradingView）、`yfinance` 或 `tradingview` |
| `force_refresh` | boolean | `false` | 将请求的区间和已存储的区间一次性整体重新获取，替换已存储的 K 线，并重新查找数据源代码 |
| `from_date`, `to_date` | date | — | 时间窗口 `YYYY-MM-DD`。未提供时：首次采集取十年，否则从最后一个已存储交易日的次日开始 |
| `currency`, `exchange` | string | — | 多个上市品种共用同一代码时用于选择上市品种（否则使用主上市品种） |
| `isin` | string | — | 多个金融工具共用同一代码时，只保留该金融工具的上市品种。格式错误的 ISIN 会被拒绝，返回 `422` |

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

| 字段 | 含义 |
|---|---|
| `status` | `success`、`up_to_date`（无需获取）或 `failed` |
| `source_used` | `yfinance` 或 `tradingview`；失败时为请求的数据源（`auto`……） |
| `provider_symbol` | 向数据源查询时使用的代码——为该上市品种验证过的 Yahoo 代码，或 TradingView 代码 |
| `note` | 价格来自 TradingView 时，说明为何未使用 Yahoo 作为数据源；已存储的序列被替换时为 `Whole history fetched again: ...`（自上次采集以来发生了拆股或分红、强制刷新，或该序列存储于迁移 016 之前） |
| `error` | 说明为何无法采集任何数据，例如 Yahoo 上没有以该上市品种货币报价的代码 |

---

## <span className="api-method post">POST</span> `/historical/ingest/bulk`

并行采集多个代码。JSON 请求体：

```json
{
  "tickers": ["AIR.PA", "BNP.PA", "MC.PA"],
  "resolution": "1D",
  "source": "auto",
  "force_refresh": false,
  "concurrency": 5
}
```

`concurrency` 取值在 1 到 20 之间。每个代码指向其主上市品种。响应为 `{"status": "completed", "results": [...]}`，每个代码对应一个结果，格式同上。

---

## <span className="api-method get">GET</span> `/ticker/{symbol}/history`

某个上市品种的 OHLCV K 线，仅从数据库读取——该路由从不进行采集。K 线按最新的在前返回。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `symbol` | string | — | 代码 |
| `start_date`, `end_date` | date | — | 时间窗口 `YYYY-MM-DD` |
| `interval` | string | `1D` | `1D`、`1W`、`1M`（或 `daily`、`weekly`、`monthly`） |
| `currency`, `exchange` | string | — | 选择上市品种 |
| `isin` | string | — | 只保留该金融工具的上市品种（格式错误时返回 `422`） |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/ticker/AIR.PA/history?start_date=2026-09-28&end_date=2026-10-02"
```

```json
{
  "ticker": "AIR.PA",
  "listing": { "ticker": "AIR.PA", "isin": "NL0000235190", "currency": "EUR", "exchange": "XPAR" },
  "interval": "1D",
  "count": 5,
  "data": [
    { "time": "2026-10-02T00:00:00Z", "open": 149.07, "high": 151.07, "low": 147.07, "close": 150.07, "adj_close": 150.07, "volume": 1395000 },
    { "time": "2026-10-01T00:00:00Z", "open": 147.97, "high": 149.97, "low": 145.97, "close": 148.97, "adj_close": 148.97, "volume": 1394000 }
  ]
}
```

`close` 是成交收盘价（已针对拆股调整）；`adj_close` 还针对分红进行了调整，对于 TradingView 的 K 线为空。`listing` 是实际读取的上市品种（代码未指向任何上市品种时为 `null`）。`time` 是交易日的日期，取 UTC 午夜时刻。响应缓存 24 小时，并在该代码被重新采集时清除。

---

## 周线与月线

除了可以采集的 `1W` 和 `1M` K 线之外，数据库还维护两个基于每个上市品种日线计算的连续聚合：`prices_weekly` 和 `prices_monthly`。它们每天刷新，对于近期时段则直接根据日线计算结果。

关于采集流水线和数据源代码的选择，请参阅[采集历史数据](../guides/ingest-historical-data.md)。
