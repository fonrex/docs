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

**WACC。** 股权成本按 CAPM 计算（无风险利率 + beta × 股权风险溢价），债务成本根据利息和债务计算，权重根据市值和债务确定；WACC 被限定在 5–20 % 之间。无风险利率取**财务报表货币**的 10 年期利率：USD 取 FRED 提供的美国国债收益率，EUR 取欧洲央行（ECB）提供的欧元区 AAA 级政府债券利率（参见 `GET /macro/rates`）。其他货币，或来源未给出利率时，使用 `DCF_RISK_FREE_RATE`：欧元公司绝不会用美国利率贴现。缺失的输入使用文档中规定的默认值（beta 1、税率 25 %、债务成本 = 无风险利率 + 2 个百分点），并添加一条警告。

**货币。** 估值以财务报表的货币进行（Yahoo 的 `financialCurrency`，由深度补全记录）；对于 Fonrex 开始记录之前补全的报表，在运行 `GET /fundamental/deep?ticker=...&refresh=true` 之前，使用价格所属上市品种的货币。价格取主上市品种的最新收盘价：以便士（`GBX`）计价的价格会换算为英镑；以其他货币计价的价格（例如欧洲公司的美国上市品种）不会被换算——此时上涨空间为 `null`，并由 `warnings` 说明原因。

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
  "price_currency": "EUR",
  "warnings": [],
  "shares_outstanding": 790000000,
  "wacc": {
    "wacc": "0.0907",
    "cost_of_equity": "0.0957",
    "cost_of_debt": "0.032",
    "tax_rate": "0.25",
    "weight_equity": "0.93",
    "weight_debt": "0.07",
    "beta_used": "1.1",
    "cost_of_debt_source": "calculated",
    "risk_free_rate": "0.035192",
    "risk_free_rate_source": "ecb_live",
    "risk_free_rate_date": "2026-10-08",
    "risk_free_rate_currency": "EUR"
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

以上数值仅作说明。金额和比率均为十进制数，序列化为**字符串**。`currency` 是估值的货币，`price_currency` 是 `current_price` 的货币。`models` 以模型名（`fcf`、`eps`、`ddm`）为键：每个模型给出相对价格的自身 `upside_pct`，其 `warnings` 会说明何时应用了默认值或上限。`risk_free_rate_source` 为 `fred_live`、`fred_cached` 或 `fred_stale`（FRED），`ecb_live`、`ecb_cached` 或 `ecb_stale`（ECB），`env_fallback`（`DCF_RISK_FREE_RATE`）或 `client_override`（你在 `POST` 中提供的假设）；`stale` 表示较早存储的利率，在无法读取来源时使用。`risk_free_rate_currency` 表示从 FRED 或 ECB 读取的利率所属货币，后两种来源时为 `null`。

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

响应包含 `ticker`、`model`、`wacc_range`、`growth_range` 和 `matrix`；每个单元格给出内在价值以及相对当前价格的上涨或下跌空间。当价格的计价货币与财务报表不同时，上涨空间为 `null`。

---

## <span className="api-method get">GET</span> `/macro/rates`

两个来源的利率，或通过 `currency=USD` 或 `currency=EUR` 只取一种货币的利率：

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/macro/rates?currency=EUR"
```

```json
{
  "currency": "EUR",
  "risk_free_rate": {
    "series_id": "YC.B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y",
    "label": "Euro area AAA government 10-year spot rate",
    "value": "0.035192",
    "unit": "ratio",
    "observation_date": "2026-10-08",
    "freshness": "live",
    "source": "ecb",
    "currency": "EUR"
  },
  "rates": [
    { "series_id": "YC.B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y", "value": "0.035192", "unit": "ratio", "...": "..." },
    { "series_id": "FM.D.U2.EUR.4F.KR.DFR.LEV", "label": "ECB deposit facility rate", "value": "0.02", "unit": "ratio", "...": "..." },
    { "series_id": "CISS.D.U2.Z0Z.4F.EC.SS_CIN.IDX", "label": "Composite Indicator of Systemic Stress (euro area)", "value": "0.081234", "unit": "index", "...": "..." }
  ]
}
```

| 序列 | 来源 | 货币 | 含义 |
|---|---|---|---|
| `DGS10` | FRED | USD | 美国 10 年期国债收益率——USD 的无风险利率 |
| `YC.B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y` | ECB | EUR | 欧元区 AAA 级政府债券收益率曲线的 10 年期即期利率——EUR 的无风险利率 |
| `FM.D.U2.EUR.4F.KR.DFR.LEV` | ECB | EUR | 存款便利利率（欧洲央行的政策利率） |
| `CISS.D.U2.Z0Z.4F.EC.SS_CIN.IDX` | ECB | EUR | 系统性压力综合指标（CISS），介于 0 和 1 之间的指数 |

- 不带 `currency` 时，`rates` 包含四个序列，`risk_free_rate` 为美国利率。其他货币返回 `422`：没有来源发布其利率。
- 利率是比率（`0.0412` = 4.12 %，`unit` = `ratio`），序列化为字符串；可以为零或负数。CISS 是指数（`unit` = `index`）。
- `freshness`：`live`（本次响应从来源读取）、`cached`（Redis，或已存储且在 6 小时内读取——`MACRO_RATES_CACHE_TTL`）、`stale`（较早存储的值：无法读取来源）。FRED 需要 `FRED_API_KEY`；ECB 无需密钥。
- 没有任何值的序列会被省略，未启动的来源也会被省略（当它是唯一请求的来源时返回 `503`）。
