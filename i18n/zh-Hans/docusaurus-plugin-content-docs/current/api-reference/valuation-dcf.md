---
id: "valuation-dcf"
title: "DCF 估值 API 参考"
sidebar_label: "DCF 估值"
description: "内在价值计算、WACC 估计、多模型共识及敏感性矩阵 Endpoint"
---


# DCF 估值 API 参考

估值 API 执行现金流折现 (DCF) 内在价值模型、计算动态加权平均资本成本 (WACC)、构建多模型共识报告并生成敏感性矩阵。

---

## <span className="api-method get">GET</span> `/dcf/{ticker}`

使用自由现金流 (FCF) DCF 模型计算默认内在价值。结果在 Redis 中缓存 6 小时。

### 请求参数

| 参数名 | 类型 | 是否必需 | 默认值 | 说明描述 |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | 股票代码（例如 `AAPL`） |

### 响应示例

```json
{
  "ticker": "AAPL",
  "model": "FCF",
  "current_price": 224.50,
  "intrinsic_value": 248.20,
  "margin_of_safety_pct": 10.56,
  "recommendation": "UNDERVALUED",
  "wacc": 0.0845,
  "terminal_growth_rate": 0.025,
  "projections": [
    { "year": 1, "fcf": 115000000000, "pv": 105990000000 },
    { "year": 2, "fcf": 124000000000, "pv": 105430000000 },
    { "year": 3, "fcf": 133000000000, "pv": 104270000000 },
    { "year": 4, "fcf": 142000000000, "pv": 102550000000 },
    { "year": 5, "fcf": 151000000000, "pv": 100290000000 }
  ],
  "terminal_value": 2580000000000,
  "enterprise_value": 3098430000000
}
```

---

## <span className="api-method post">POST</span> `/dcf/{ticker}`

运行具有自定义增长率、无风险利率或 WACC 覆盖的自定义 DCF 估值（绕过 Redis 缓存）。

### 请求体 (Request Body)

```json
{
  "projection_years": 5,
  "revenue_growth_rate": 0.08,
  "operating_margin": 0.30,
  "risk_free_rate": 0.042,
  "terminal_growth_rate": 0.02
}
```

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/compare`

比较所有三个 DCF 模型的共识内在估值：**自由现金流 (FCF)**、**每股收益 (EPS)** 和 **股息折现模型 (DDM)**。

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/sensitivity`

生成一个 5x5 敏感性矩阵，分析内在价值在 WACC（折现率）和终值增长率组合变化下的演变。

### 响应示例

```json
{
  "ticker": "AAPL",
  "sensitivity_matrix": {
    "wacc_axis": [0.075, 0.080, 0.0845, 0.090, 0.095],
    "growth_axis": [0.015, 0.020, 0.025, 0.030, 0.035],
    "values": [
      [275.40, 284.10, 294.20, 305.80, 319.40],
      [252.10, 259.30, 267.80, 277.50, 288.70],
      [234.80, 241.00, 248.20, 256.40, 265.80]
    ]
  }
}
```
