---
id: "openbb"
title: "OpenBB Workspace 集成 API"
sidebar_label: "OpenBB 集成"
description: "为 OpenBB Workspace 组件提供数据的 /openbb 路由和发现文件"
---

# OpenBB Workspace 集成 API

`/openbb` 路由从你自己的实例为 [OpenBB Workspace](https://openbb.co) 的组件提供数据。每个路由调用其所适配的 Fonrex 路由，并将响应重塑为 OpenBB 所需的三种格式之一：

- **metric**：指标卡片列表 `[{"label": "...", "value": ..., "delta": ...}]`
- **chart**：Plotly 图形 `{"data": [...], "layout": {...}}`
- **table**：供 AgGrid 使用的扁平行列表 `[{...}, {...}]`

配置方法见 [OpenBB Workspace 指南](../guides/openbb-workspace.md)。

## 认证

| 路由 | 密钥 |
|---|---|
| `GET /widgets.json`, `GET /apps.json` | 无需密钥——OpenBB 在配置密钥之前就会获取它们 |
| `GET /openbb/...` | 必需，放在 `X-API-KEY` 请求头中（或 `Authorization: Bearer`） |

只读密钥（`FONREX_READ_ONLY_API_KEYS`）即可使用所有组件。CORS 接受 `OPENBB_ALLOWED_ORIGIN` 中的来源（默认为 `https://pro.openbb.co`）。

## 发现文件

- `GET /widgets.json`——21 个组件：每个组件的名称、类别、类型、路由和参数（`integrations/openbb/widgets.json`）。
- `GET /apps.json`——两个预先组装好的仪表板：**Fonrex — EU Markets** 和 **Fonrex — Screener & Macro**（`integrations/openbb/apps.json`）。

## 路由

| 组件 | 类型 | 路由 | 适配自 |
|---|---|---|---|
| `fonrex_quote` | metric | `GET /openbb/quote/{ticker}` | `/quote/{ticker}` |
| `fonrex_macro_rates` | metric | `GET /openbb/macro/rates` | `/macro/rates` |
| `fonrex_eod` | chart | `GET /openbb/eod/{ticker}`（`period` 默认为 1y） | `/eod/{ticker}` |
| `fonrex_history` | chart | `GET /openbb/ticker/{symbol}/history` | `/ticker/{symbol}/history` |
| `fonrex_technical` | chart | `GET /openbb/technical/{ticker}` | `/technical/{ticker}` |
| `fonrex_technical_multi` | chart | `GET /openbb/technical/{ticker}/multi` | `/technical/{ticker}/multi` |
| `fonrex_technical_chart` | chart | `GET /openbb/technical/{ticker}/chart` | `/technical/{ticker}/chart` |
| `fonrex_fundamentals` | table | `GET /openbb/fundamental` | `/fundamental` |
| `fonrex_fundamentals_deep` | table | `GET /openbb/fundamental/deep` | `/fundamental/deep` |
| `fonrex_quotes_batch` | table | `GET /openbb/quotes` | `/quotes` |
| `fonrex_screener` | table | `GET /openbb/technical/screen` | `/technical/screen` |
| `fonrex_news` | table | `GET /openbb/news/{ticker}` | `/news/{ticker}` |
| `fonrex_news_feed` | table | `GET /openbb/news/feed` | `/news/feed` |
| `fonrex_dcf` | table | `GET /openbb/dcf/{ticker}` | `/dcf/{ticker}` |
| `fonrex_dcf_compare` | table | `GET /openbb/dcf/{ticker}/compare` | `/dcf/{ticker}/compare` |
| `fonrex_dcf_sensitivity` | table | `GET /openbb/dcf/{ticker}/sensitivity` | `/dcf/{ticker}/sensitivity` |
| `fonrex_insider_transactions` | table | `GET /openbb/insider-transactions/{ticker}` | `/insider-transactions/{ticker}` |
| `fonrex_etf_details` | table | `GET /openbb/etf/{isin}/details` | `/etf/{isin}/details` |
| `fonrex_index_constituents` | table | `GET /openbb/index/{index_name}/constituents` | `/index/{index_name}/constituents` |
| `fonrex_factor_exposure` | table | `GET /openbb/factors/exposure/{ticker}` | `/factors/exposure/{ticker}` |
| `fonrex_factor_returns` | chart | `GET /openbb/factors/{dataset}/chart` | `/factors/{dataset}` |

宏观组件接受 `currency` 参数（`USD`、`EUR`，留空表示两者），每个序列显示一张卡片：美国 10 年期利率、欧元区 AAA 10 年期利率、欧洲央行存款利率以及 CISS 压力指数。

每个路由接受其所适配路由的参数（参见相应的 API 参考页面），但有少数差异：`/openbb/fundamental` 没有 `fmt`；`/openbb/technical/{ticker}/multi` 没有 `include_ohlcv`，默认为 `sma_20,ema_50,rsi_14`；`/openbb/technical/{ticker}/chart` 默认为 `sma_20,rsi_14`；`/openbb/news/feed` 默认返回 20 篇文章。

因子暴露组件接受 `model`（`ff3`、`ff5`、`carhart`）、`frequency` 和 `window`。其各行给出年化阿尔法、每个因子的贝塔及其标准误和 t 统计量、R²、调整后 R²、年化残差波动率和周期数，然后是价格换算前的原始货币以及警告。因子收益组件绘制一个数据集中每个因子（不含 `RF`）以美元计的累计收益，默认显示最近 10 年，除非指定 `start`。请参阅 [Fama/French 因子](./factors.md)。

`GET /openbb/quote/{ticker}` 从不启动实时数据流：当该代码已通过 `POST /realtime/subscribe` 订阅时，报价为实时报价，否则为 Yahoo Finance 的延迟价格。

## 示例

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/openbb/quote/AIR.PA"
```

```json
[
  { "label": "AIR.PA Price", "value": 154.6, "delta": 0.13 },
  { "label": "Change", "value": "+0.20", "delta": "+0.13%" },
  { "label": "Previous Close", "value": 154.4, "delta": null },
  { "label": "Day High", "value": 155.48, "delta": null },
  { "label": "Day Low", "value": 155.1, "delta": null },
  { "label": "Volume", "value": 18250, "delta": null }
]
```

此示例为 Yahoo Finance 的延迟报价。没有值的卡片（无前收盘价、无成交量……）会被省略。
