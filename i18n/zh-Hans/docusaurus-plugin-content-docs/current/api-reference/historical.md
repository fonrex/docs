---
id: "historical"
title: "历史数据摄取 API 参考"
sidebar_label: "历史摄取"
description: "用于回填历史 OHLCV 数据、批量摄取和历史查询的 Endpoint"
---


# 历史数据摄取 API 参考

历史数据 API 提供了将历史每日 OHLCV K 线数据摄取、回填和查询到 TimescaleDB 存储中的方法。

---

## <span className="api-method post">POST</span> `/historical/ingest`

触发单个资产的历史数据摄取或回填。

### 请求体 (Request Body)

```json
{
  "ticker": "BNP.PA",
  "resolution": "d",
  "from_date": "2020-01-01",
  "to_date": "2026-08-01",
  "force": false
}
```

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | 要摄取的股票代码 |
| `resolution` | `string` | ❌ | `d` | K 线周期 (`d`, `w`, `m`) |
| `from_date` | `string` | ❌ | — | 开始日期 (`YYYY-MM-DD`) |
| `to_date` | `string` | ❌ | — | 结束日期 (`YYYY-MM-DD`) |
| `force` | `boolean` | ❌ | `false` | 重新下载并覆盖数据库中的现有记录 |

### 响应示例

```json
{
  "status": "success",
  "ticker": "BNP.PA",
  "records_added": 1650,
  "source": "YahooFinance",
  "duration_ms": 1240
}
```

---

## <span className="api-method post">POST</span> `/historical/ingest/bulk`

在具有并发控制的情况下触发跨多个股票代码的大批量数据摄取。

### 请求体 (Request Body)

```json
{
  "tickers": ["AIR.PA", "BNP.PA", "TTE.PA", "MC.PA"],
  "resolution": "d",
  "concurrency": 4
}
```

### 响应示例

```json
{
  "total": 4,
  "successful": 4,
  "failed": 0,
  "details": [
    { "ticker": "AIR.PA", "status": "success", "records_added": 250 },
    { "ticker": "BNP.PA", "status": "success", "records_added": 250 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/ticker/{symbol}/history`

从 `prices_eod` 表中查询历史 OHLCV K 线。如果 `auto_ingest=true`，将自动摄取缺失的数据。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `symbol` | `string` | ✅ | — | 金融工具代码 |
| `resolution` | `string` | ❌ | `d` | 周期 (`d`, `w`, `m`) |
| `limit` | `integer` | ❌ | `500` | 历史 K 线数量 |
| `auto_ingest` | `boolean` | ❌ | `true` | 自动从 yfinance 回填缺失的 K 线 |

### 使用示例

#### cURL
```bash
curl -s "http://localhost:5000/ticker/AAPL/history?limit=10"
```

#### Python
```python
import requests

resp = requests.get("http://localhost:5000/ticker/AAPL/history", params={"limit": 10})
bars = resp.json()["data"]
print("Fetched bars:", len(bars))
```
