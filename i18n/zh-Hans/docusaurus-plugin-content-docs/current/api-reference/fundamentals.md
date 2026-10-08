---
id: "fundamentals"
title: "基本面财务 API 参考"
sidebar_label: "基本面"
description: "EODHD 格式的多数据提供方基本面数据，以及已存储的深度基本面数据"
---

# 基本面财务 API 参考

有两个路由提供基本面数据：

- `GET /fundamental` 基于 Yahoo Finance、数据库中存储的数据以及抓取的数据提供方构建一份文档，并注明每项数据的来源。
- `GET /fundamental/deep` 返回深度补全（deep enrichment）所存储的内容：要点指标、财务报表、盈利历史和分析师评级。

比率以比率形式表示：0.32 % 的股息率为 `0.0032`。

---

## <span className="api-method get">GET</span> `/fundamental`

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `ticker` | string | — | 代码（例如 `AIR.PA`）。`ticker` 和 `isin` 必须提供其一 |
| `isin` | string | — | 金融工具的 ISIN |
| `exchange` | string | — | 交易所，用于选择上市品种 |
| `currency` | string | — | 货币，用于选择上市品种 |
| `provider` | string | all | 一个数据提供方名称，或以逗号分隔的多个名称，用于替代全部数据提供方 |
| `fmt` | string | `eodhd` | `eodhd`（渲染后的文档）或 `raw`（每个数据提供方的原始响应） |
| `nocache` | boolean | `false` | 忽略已缓存的响应 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/fundamental?ticker=AIR.PA"
```

### 渲染后的文档（`fmt=eodhd`）

| 部分 | 内容 |
|---|---|
| `General` | 名称、ISIN、交易所、货币、国家、行业板块与细分行业、描述、地址、网站 |
| `Highlights` | 市值、EBITDA、市盈率、每股收益、股息率、利润率、回报率、营收…… |
| `Valuation` | 滚动与预期市盈率、市销率、市净率、企业价值比率 |
| `SharesStats` | 流通股本与自由流通股、内部人士与机构持股、空头头寸 |
| `Technicals` | Beta、52 周最高与最低价、移动平均线 |
| `SplitsDividends` | 股息金额与股息率、派息率、相关日期、最近一次拆股 |
| `AnalystRatings` | 一致评级、目标价、买入/持有/卖出评级数量 |
| `Holders`, `InsiderTransactions`, `ESGScores` | 持有人、SEC Form 4 交易（美股）、ESG 评分 |
| `Earnings`, `Financials` | 已存储的盈利历史和财务报表 |
| `Providers` | 每个数据提供方返回的内容 |
| `Sources` | 每项数据的来源，例如 `{"Highlights": {"PERatio": "YahooFinance", "PEGRatio": "database (2026-10-01)"}}` |
| `ETF_Data` | 仅适用于 ETF |

每项数据按以下顺序取值：

1. 本次请求中 Yahoo Finance 的响应；
2. 深度补全所存储的数据，标注为 `database (获取日期)`；
3. 仅对于滚动市盈率、每股收益和股息率：发布相同指标的抓取类数据提供方（Google Finance、Barron's、MarketWatch、WSJ、Investing.com）。

当年预估值（Boursorama、ZoneBourse）和季度数据（Google Finance）属于不同的指标：它们从不作为后备来源，但可通过 `fmt=raw` 获取。

### 查询的是哪个金融工具

对于目录中的上市品种，向 Yahoo Finance 查询时使用的是**为该上市品种验证过的代码**（根据 ISIN 查得并按上市品种的货币进行核对），而不是裸代码——后者在 Yahoo 上可能对应另一个金融工具。没有已验证的代码时，不会查询 Yahoo，其条目会说明原因。抓取类数据提供方通过映射、ISIN 或代码进行搜索；如果某个数据提供方返回的是另一个 ISIN 的数据，则会报告为错误。

每个值在使用前都会经过[校验层](../monitoring/validation-layer.md)。

完整响应缓存一小时；`nocache=true` 可绕过缓存。

---

## <span className="api-method get">GET</span> `/fundamental/deep`

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `ticker` / `isin` | string | — | 金融工具（二者必须提供其一） |
| `refresh` | boolean | `false` | 重新从 Yahoo Finance 获取，而不使用已缓存的响应 |
| `sections` | string | `all` | `all`，或以逗号分隔的列表，可选 `highlights`、`statements`、`earnings`、`ratings` |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/fundamental/deep?ticker=AIR.PA&sections=highlights,ratings"
```

响应结构：

```json
{
  "asset_profile": { "isin": "NL0000235190", "ticker": "AIR.PA", "name": "Airbus SE", "exchange": "XPAR", "currency": "EUR" },
  "highlights": { "pe_ratio": 28.5, "dividend_yield": 0.0125, "roe": 0.162, "...": "..." },
  "statements": {
    "income":   { "annual": [ { "period_end": "2025-12-31", "...": "..." } ], "quarterly": [] },
    "balance":  { "annual": [], "quarterly": [] },
    "cashflow": { "annual": [], "quarterly": [] }
  },
  "earnings_history": [ { "...": "..." } ],
  "analyst_ratings": { "...": "..." },
  "meta": { "fetched_at": "2026-10-08T16:40:00+00:00", "source": "yfinance", "cache_hit": false, "symbol": "AIR.PA" }
}
```

数据使用已验证的代码（`meta.symbol`）从 Yahoo Finance 获取并存储。没有已验证的代码时不会获取任何数据：响应为数据库中已有的内容，`meta.source` 为 `database`，`meta.note` 给出原因。完整响应缓存 24 小时；每个请求只会收到其所请求的部分。

---

## 旧版路由

`GET /stocks`（市场概览）和 `GET /stocks/{ticker}/financials` 是早期版本遗留的路由。它们直接使用输入的代码查询 Yahoo Finance；建议优先使用 `/fundamental`。
