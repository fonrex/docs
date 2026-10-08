---
id: "valuation-dcf"
title: "DCF 估值 API 参考"
sidebar_label: "估值与 DCF"
description: "基于三种 DCF 模型的内在价值、动态 WACC、模型对比、敏感性矩阵及宏观利率"
---

# DCF 估值 API 参考

共有三种模型可用。当一次请求计算其中多个模型时，一致估值为它们的加权平均：

| 模型 | 依据 | 默认权重 |
|---|---|---|
| `fcf` | 最近三个财年的平均自由现金流，进行预测，加上 Gordon 终值，减去净债务 | 50 % |
| `eps` | 每股收益增长（历史与分析师趋势）以及终值市盈率（公司市盈率限定在 10–30 之间，未知时取 15） | 30 % |
| `ddm` | 股息贴现（Gordon）——仅适用于派发股息的公司 | 20 % |

权重在本次请求所计算的模型之间分配：仅计算 `fcf` 和 `eps` 时，一致估值按 50/30 加权并归一化。`GET /dcf/{ticker}` 只计算 `fcf`，因此其一致估值即为 FCF 估值。

**输入数据仅来自数据库。** 服务读取深度补全所存储的要点指标、年度报表（按财年分组，五年）、盈利趋势和分析师评级，以及主上市品种的最新日收盘价。请先运行 `GET /fundamental/deep?ticker=...`：从未补全过的代码会返回 `404`，并给出缺失数据的名称。

**WACC。** 股权成本按 CAPM 计算（无风险利率 + beta × 股权风险溢价），债务成本根据利息和债务计算，权重根据市值和债务确定；WACC 被限定在 5–20 % 之间。无风险利率取 FRED 提供的美国 10 年期国债收益率（参见 `GET /macro/rates`），否则使用 `DCF_RISK_FREE_RATE`。缺失的输入使用文档中规定的默认值（beta 1、税率 25 %、债务成本 = 无风险利率 + 2 个百分点），并添加一条警告。

---

## <span className="api-method get">GET</span> `/dcf/{ticker}`

**仅使用 FCF 模型**，采用默认假设：`consensus_value` 即为 FCF 估值。缓存 6 小时；`force_refresh=true` 会重新计算。如需三种模型请使用 `/compare`，或使用 `POST` 自行选择模型。

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/dcf/AIR.PA"
```

响应结构：

```json
{
  "ticker": "AIR.PA",
  "currency": "EUR",
  "current_price": "155.42",
  "shares_outstanding": "790000000",
  "wacc": {
    "wacc": "0.0865",
    "cost_of_equity": "0.0912",
    "cost_of_debt": "0.032",
    "tax_rate": "0.25",
    "weight_equity": "0.93",
    "weight_debt": "0.07",
    "beta_used": "1.1",
    "cost_of_debt_source": "calculated",
    "risk_free_rate_source": "fred_cached"
  },
  "models": {
    "fcf": {
      "model_name": "...",
      "intrinsic_value_per_share": "168.20",
      "upside_pct": "8.22",
      "projected_values": ["..."],
      "terminal_value": "...",
      "present_values": ["..."],
      "pv_terminal": "...",
      "warnings": []
    }
  },
  "solvency": { "debt_to_equity_ratio": "...", "net_debt_to_ebitda": "...", "interest_coverage_ratio": "...", "...": "..." },
  "consensus_value": "168.20",
  "consensus_upside_pct": "8.22",
  "analyst_target": "175.00",
  "computed_at": "2026-10-08T16:50:00Z"
}
```

以上数值仅作说明。金额和比率均为十进制数，序列化为**字符串**。`models` 以模型名（`fcf`、`eps`、`ddm`）为键；每个模型的 `warnings` 会说明何时应用了默认值或上限。`risk_free_rate_source` 为 `fred_cached`（FRED 利率）、`env_fallback`（`DCF_RISK_FREE_RATE`）或 `client_override`（你在 `POST` 中提供的假设）。

---

## <span className="api-method post">POST</span> `/dcf/{ticker}`

使用你自己的假设进行估值；从不缓存。它只做计算，因此只读密钥也可以调用。

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `models` | list | `["fcf"]` | 从 `fcf`、`eps`、`ddm` 中选择 |
| `projection_years` | integer | `5` | 3 到 10 |
| `terminal_growth_rate` | number | `0.025` | 比率（0.025 = 2.5 %） |
| `wacc_params` | object | — | `risk_free_rate`、`equity_risk_premium`、`beta_override`、`cost_of_debt_override`、`tax_rate_override` |
| `fcf_growth_override`, `eps_growth_override`, `dividend_growth_override` | number | — | 强制指定某个模型的初始增长率 |
| `model_weights` | object | — | 一致估值的权重，例如 `{"fcf": 0.6, "eps": 0.4, "ddm": 0}` |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" -H "Content-Type: application/json" \
  -d '{"models": ["fcf", "eps"], "projection_years": 10, "terminal_growth_rate": 0.02,
       "wacc_params": {"risk_free_rate": 0.035}}' \
  http://localhost:5000/dcf/AIR.PA
```

终值增长率与贴现率之差在半个百分点以内时，会被限定（贴现率 − 0.5 %）并附带一条警告。对不派发股息的公司请求 `ddm` 会返回 `404`。

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/compare`

并列展示三种模型及其加权一致估值。不派发股息的公司会得到一个估值为零的 DDM 条目，并附带一条警告，一致估值则由 FCF 和 EPS 计算得出。

---

## <span className="api-method get">GET</span> `/dcf/{ticker}/sensitivity`

按 WACC（行）× 终值增长率（列）网格计算的内在价值。

| 参数 | 默认值 |
|---|---|
| `model` | `fcf` |
| `wacc_min`, `wacc_max`, `wacc_step` | `0.06`, `0.16`, `0.02` |
| `growth_min`, `growth_max`, `growth_step` | `0.01`, `0.05`, `0.01` |
| `force_refresh` | `false` |

响应包含 `ticker`、`model`、`wacc_range`、`growth_range` 和 `matrix`；每个单元格给出内在价值以及相对当前价格的上涨或下跌空间。

---

## <span className="api-method get">GET</span> `/macro/rates`

估值所使用的无风险利率：

```json
{
  "risk_free_rate": {
    "series_id": "DGS10",
    "label": "10-Year Treasury Constant Maturity Rate",
    "value": "0.0412",
    "unit": "percent",
    "observation_date": "2026-10-07"
  }
}
```

`value` 是比率（0.0412 = 4.12 %），序列化为字符串，尽管 `unit` 写的是 `percent`。它依次取自：Redis（6 小时）；`macro_rates_cache` 中存储的值（前提是该值在 6 小时内从 FRED 读取）；FRED API（`FRED_API_KEY`）；最后是较早存储的值。如果没有任何值，`risk_free_rate` 为 `null`，估值将使用 `DCF_RISK_FREE_RATE`。
