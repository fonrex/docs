---
id: "assets"
title: "资产与上市品种 API 参考"
sidebar_label: "资产与上市品种"
description: "Fonrex 目录中的金融工具、上市品种及日终价格"
---

# 资产与上市品种 API 参考

Fonrex 将**金融工具**（一个 ISIN，对应 `assets` 表中的一行）与其**上市品种（listing）**（每个代码、交易所和货币组合对应 `asset_listings` 表中的一行）区分开来。同一只 ETF 分别以 EUR 和 USD 报价时，是一个金融工具加两个上市品种，每个上市品种都有各自的价格序列。

本页所有路由都需要 API 密钥（`X-API-KEY` 或 `Authorization: Bearer`）。

---

## <span className="api-method get">GET</span> `/assets/by-isin/{isin}`

返回某个 ISIN 对应的金融工具，包含其首选上市品种以及其所有上市品种。

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/assets/by-isin/NL0000235190"
```

```json
{
  "asset_id": 1,
  "name": "Airbus SE",
  "ticker": "AIR.PA",
  "exchange": "XPAR",
  "currency": "EUR",
  "sector": "Industrials",
  "industry": "Aerospace & Defense",
  "quote_type": "EQUITY",
  "isin": "NL0000235190",
  "listing_id": 1,
  "listings": [
    {
      "id": 1, "asset_id": 1, "ticker": "AIR.PA", "exchange": "XPAR", "currency": "EUR",
      "isin": "NL0000235190", "name": "Airbus SE", "source": "csv_import",
      "is_primary": true, "is_active": true
    },
    {
      "id": 2, "asset_id": 1, "ticker": "AIR.DE", "exchange": "XETR", "currency": "EUR",
      "isin": "NL0000235190", "name": "Airbus SE", "source": "csv_import",
      "is_primary": false, "is_active": true
    }
  ]
}
```

已知时，响应中还会包含 `display_name`、`official_symbol`、`logo_path`、`ir_website` 和 `long_business_summary`。未知的 ISIN 返回 `404`。

---

## <span className="api-method get">GET</span> `/listings`

返回符合筛选条件的活跃上市品种。至少需要一个筛选条件（否则返回 `400`）。

| 参数 | 类型 | 说明 |
|---|---|---|
| `ticker` | string | 上市品种的代码（例如 `AIR.PA`） |
| `isin` | string | 金融工具的 ISIN |
| `exchange` | string | 目录中存储的交易所代码 |
| `currency` | string | 上市品种的货币（例如 `EUR`） |

```json
{
  "count": 2,
  "listings": [
    { "id": 1, "asset_id": 1, "ticker": "AIR.PA", "exchange": "XPAR", "currency": "EUR", "isin": "NL0000235190", "name": "Airbus SE", "source": "csv_import", "is_primary": true, "is_active": true }
  ]
}
```

---

## <span className="api-method get">GET</span> `/eod/{ticker}`

以 JSON 或 CSV 返回某个上市品种的日终价格。如果请求的数据尚未存储，会先对该上市品种进行采集（使用为该上市品种验证过的代码从 Yahoo Finance 获取，TradingView 作为后备）。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `ticker` | string | — | 代码（最多 10 个字符：字母、数字、`.` 和 `-`） |
| `period` | string | — | `1d`、`5d`、`1mo`、`3mo`、`6mo`、`1y`、`2y`、`5y`、`10y`、`ytd`、`max`、`daily`、`weekly`、`monthly`。除非同时提供 `from` 和 `to`，否则必填 |
| `from`, `to` | date | — | 时间窗口 `YYYY-MM-DD`，需同时提供 |
| `fmt` | string | `json` | `json` 或 `csv` |
| `order` | string | `a` | `a`（最早的在前）或 `d`（最新的在前） |
| `currency` | string | — | 上市品种的货币，用于多个上市品种共用同一代码时 |
| `exchange` | string | — | 上市品种的交易所，用于多个上市品种共用同一代码时 |

`weekly` 返回周线，`monthly` 返回月线；其他所有周期都返回日线。未提供 `currency` 或 `exchange` 时，使用主上市品种。

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/eod/AIR.PA?period=5d"
```

```json
{
  "ticker": "AIR.PA",
  "period": "5d",
  "format": "json",
  "count": 3,
  "retrieved_at": "2026-10-08T16:34:42.404598+00:00",
  "data_source": "database",
  "data": [
    { "Date": "2026-10-06", "Open": 153.44, "High": 155.44, "Low": 151.44, "Close": 154.44, "Adj Close": 154.44, "Volume": 1399000 },
    { "Date": "2026-10-07", "Open": 154.46, "High": 156.46, "Low": 152.46, "Close": 155.46, "Adj Close": 155.46, "Volume": 1400000 }
  ]
}
```

`Date` 是交易日的日期。价格已存储时 `data_source` 为 `database`，否则为采集来源（`yfinance` 或 `tradingview`）。响应在 Redis 中缓存 24 小时。

使用 `fmt=csv` 时：

```
Date,Open,High,Low,Close,Adj Close,Volume
2026-10-06,153.44,155.44,151.44,154.44,154.44,1399000
2026-10-07,154.46,156.46,152.46,155.46,155.46,1400000
```

### 错误

| 状态码 | 响应体 | 触发条件 |
|---|---|---|
| `400` | `{"error": "Invalid request", "message": "..."}` | 代码、周期、格式、排序或日期无效 |
| `404` | `{"error": "No data found", "message": "...", "reason": "..."}` | 没有已存储的数据，也无法采集到任何数据。`reason` 说明原因，例如 Yahoo 上没有以该上市品种货币报价的代码 |

关于如何为上市品种选择数据源代码，请参阅[采集历史数据](../guides/ingest-historical-data.md)。
