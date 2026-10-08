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
| `force_refresh` | boolean | `false` | 重新获取整个区间，替换该区间内已存储的 K 线，并重新查找数据源代码 |
| `from_date`, `to_date` | date | — | 时间窗口 `YYYY-MM-DD`。未提供时：首次采集取十年，否则从最后一个已存储交易日的次日开始 |
| `currency`, `exchange` | string | — | 多个上市品种共用同一代码时用于选择上市品种（否则使用主上市品种） |

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
| `note` | 价格来自 TradingView 时，说明为何未使用 Yahoo 作为数据源 |
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

`time` 是交易日的日期，取 UTC 午夜时刻。响应缓存 24 小时，并在该代码被重新采集时清除。

---

## 周线与月线

除了可以采集的 `1W` 和 `1M` K 线之外，数据库还维护两个基于每个上市品种日线计算的连续聚合：`prices_weekly` 和 `prices_monthly`。它们每天刷新，对于近期时段则直接根据日线计算结果。

关于采集流水线和数据源代码的选择，请参阅[采集历史数据](../guides/ingest-historical-data.md)。
