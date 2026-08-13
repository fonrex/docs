---
id: "specialized"
title: "专业提供商 API 参考"
sidebar_label: "专业提供商"
description: "SEC EDGAR 内部交易、JustETF 元数据及指数成分股列表 Endpoint"
---


# 专业提供商 API 参考

专业提供商 API 暴露了针对 SEC EDGAR 内部交易、JustETF 详细信息和股票指数成分股的特定 Endpoint。

---

## <span className="api-method get">GET</span> `/insider-transactions/{ticker}`

获取提交给美国证券交易委员会 (SEC EDGAR) 的 Form 4 内部交易。缓存 12 小时。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | 美股代码（例如 `AAPL`、`TSLA`） |

### 响应示例

```json
{
  "ticker": "AAPL",
  "source": "SEC_EDGAR",
  "count": 1,
  "transactions": [
    {
      "filing_date": "2026-08-01",
      "reporting_owner": "COOK TIMOTHY D",
      "officer_title": "Chief Executive Officer",
      "transaction_type": "P - Purchase",
      "shares": 50000,
      "price_per_share": 220.50,
      "total_value": 11025000
    }
  ]
}
```

---

## <span className="api-method get">GET</span> `/etf/{isin}/details`

从 JustETF 抓取 ETF 元数据、费率 (TER)、资产管理规模 (AUM) 及前 10 大持仓。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `isin` | `string` | ✅ | — | 欧洲 ETF ISIN（例如 `IE00B4L5Y983`） |

### 响应示例

```json
{
  "isin": "IE00B4L5Y983",
  "name": "iShares Core MSCI World UCITS ETF",
  "ter_pct": 0.20,
  "aum_eur": 65000000000,
  "replication": "Physical",
  "top_holdings": [
    { "name": "Apple Inc.", "weight_pct": 4.85 },
    { "name": "Microsoft Corp.", "weight_pct": 4.20 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/index/{index_name}/constituents`

获取主要金融市场指数（`sp500`、`cac40`、`nasdaq100`、`dax`）的当前成分股。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `index_name` | `string` | ✅ | — | Index name (`sp500`, `cac40`, `nasdaq100`, `dax`) |
