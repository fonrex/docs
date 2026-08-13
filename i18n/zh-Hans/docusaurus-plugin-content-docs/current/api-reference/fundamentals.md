---
id: "fundamentals"
title: "基本面财务 API 参考"
sidebar_label: "基本面数据"
description: "多提供商基本面指标、财务报表和估值比率 Endpoint"
---


# 基本面财务 API 参考

基本面 API 聚合了来自 14+ 个基本面提供商的财务指标、关键统计数据、资产负债表、利润表、现金流量表及分析师共识。

---

## <span className="api-method get">GET</span> `/fundamental`

跨提供商聚合关键财务统计数据（市盈率 P/E、股息率、市值、企业价值 EV、Beta、ESG 得分）。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ❌ | — | Ticker symbol (e.g. `TSLA`) |
| `isin` | `string` | ❌ | — | ISIN 代码 (e.g. `US88160R1014`) |
| `exchange` | `string` | ❌ | — | Financial exchange code |
| `currency` | `string` | ❌ | — | Currency filter |
| `provider` | `string` | ❌ | — | Specific provider override (e.g. `ZoneBourse`, `Gurufocus`, `YahooFinance`) |

### 响应示例

```json
{
  "asset_profile": {
    "isin": "US88160R1014",
    "name": "Tesla, Inc.",
    "ticker": "TSLA",
    "sector": "Consumer Cyclical"
  },
  "metrics": {
    "market_cap": 750230000000,
    "pe_ratio": 62.4,
    "forward_pe": 48.1,
    "dividend_yield": 0.0,
    "beta": 2.34,
    "price_to_sales": 7.82,
    "roe": 0.194
  },
  "providers_used": ["ZoneBourse", "Gurufocus", "YahooFinance"]
}
```

### 使用示例

#### cURL
```bash
curl -s "http://localhost:5000/fundamental?ticker=TSLA"
```

#### Python
```python
import requests

resp = requests.get("http://localhost:5000/fundamental", params={"ticker": "TSLA"})
data = resp.json()
print("Market Cap:", data["metrics"]["market_cap"])
```

---

## <span className="api-method get">GET</span> `/fundamental/deep`

获取深层结构化财务数据，包括每日快照、财务报表、每股收益 (EPS) 历史记录及分析师共识评级。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Ticker symbol (e.g. `AIR.PA`) |

### 响应示例

```json
{
  "highlights": {
    "pe_ratio": 28.5,
    "enterprise_value": 110500000000,
    "roe": 0.162,
    "roa": 0.054
  },
  "financial_statements": [
    {
      "statement_type": "income",
      "period_type": "annual",
      "period_end": "2025-12-31",
      "revenue": 65400000000,
      "net_income": 4200000000
    }
  ],
  "analyst_ratings": {
    "consensus": "Buy",
    "target_mean": 165.0,
    "strong_buy": 12,
    "buy": 8,
    "hold": 4,
    "sell": 1
  }
}
```
