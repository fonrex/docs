---
id: "openbb-workspace"
title: "将 Fonrex 连接到 OpenBB Workspace"
sidebar_label: "OpenBB Workspace 指南"
description: "将您自托管的 Fonrex 实例连接到 OpenBB Workspace 的小组件和仪表板"
---

# 将 Fonrex 连接到 OpenBB Workspace

[OpenBB Workspace](https://openbb.co) 可以将您的 Fonrex 实例用作自定义后端：欧洲市场基本面数据、DCF 估值、技术指标和新闻会以 OpenBB 小组件的形式呈现。

## 前提条件

1. 一个 OpenBB 能够访问的正在运行的 Fonrex 实例。浏览器中的 OpenBB Workspace（`pro.openbb.co`）从您的浏览器调用您的实例：当浏览器运行在同一台机器上时，`http://localhost:5000` 即可使用；否则请通过隧道或您的网络公开该实例。
2. 该实例的一个 API 密钥。**只读**密钥（`FONREX_READ_ONLY_API_KEYS`）足以支持所有小组件，也是推荐使用的密钥。

## 第 1 步 — 将 Fonrex 添加为数据源

1. 在 OpenBB Workspace 中，右键单击仪表板并选择 **Add data**（或打开后端连接）。
2. 输入您实例的 URL，例如 `http://localhost:5000` 或 `https://myfonrex.share.zrok.io`。
3. OpenBB 读取 `/widgets.json` 并列出 21 个小组件。该文件和 `/apps.json` 无需密钥即可响应。

## 第 2 步 — 添加密钥

为连接添加一个自定义请求头：

- **Name**：`X-API-KEY`
- **Value**：`frx_live_...`

每个 `/openbb/...` 路由都需要它。

## 第 3 步 — 导入仪表板

`/apps.json` 包含两个仪表板：

**Fonrex — EU Markets** — 单个 ticker：
- *Overview*：报价、宏观利率、EOD 图表、深度基本面数据、新闻
- *Valuation*：DCF 估值、模型对比和敏感性矩阵
- *Technical*：技术图表和多指标图表
- *News*：该 ticker 的新闻和全局资讯流
- *Watchlist*：批量报价
- *Factors*：该代码对 Fama/French 5 因子的暴露，以及欧洲因子的收益

**Fonrex — Screener & Macro** — 发现：
- *Screener*：技术筛选器（例如 RSI < 30）
- *Macro Context*：FRED 与 ECB 利率（USD 和 EUR）以及指数成分股

可以从 OpenBB 的 Apps 菜单导入它们，也可以将小组件逐个添加到您自己的仪表板。

## 小组件

| 小组件 | 名称 | 类别 | 类型 |
|---|---|---|---|
| `fonrex_fundamentals` | Fonrex Fundamentals | Fundamentals | table |
| `fonrex_fundamentals_deep` | Fonrex Deep Fundamentals | Fundamentals | table |
| `fonrex_insider_transactions` | Fonrex Insider Transactions | Fundamentals | table |
| `fonrex_etf_details` | Fonrex ETF Details | Fundamentals | table |
| `fonrex_eod` | Fonrex EOD History | Historical | chart |
| `fonrex_history` | Fonrex OHLCV History | Historical | chart |
| `fonrex_quote` | Fonrex Quote | Market Data | metric |
| `fonrex_quotes_batch` | Fonrex Batch Quotes | Market Data | table |
| `fonrex_index_constituents` | Fonrex Index Constituents | Market Data | table |
| `fonrex_technical` | Fonrex Technical Indicator | Technical | chart |
| `fonrex_technical_multi` | Fonrex Multi-Indicator | Technical | chart |
| `fonrex_technical_chart` | Fonrex Technical Chart | Technical | chart |
| `fonrex_screener` | Fonrex Technical Screener | Technical | table |
| `fonrex_news` | Fonrex News | News | table |
| `fonrex_news_feed` | Fonrex News Feed | News | table |
| `fonrex_dcf` | Fonrex DCF Valuation | Valuation | table |
| `fonrex_dcf_compare` | Fonrex DCF Models Comparison | Valuation | table |
| `fonrex_dcf_sensitivity` | Fonrex DCF Sensitivity Matrix | Valuation | table |
| `fonrex_macro_rates` | Fonrex Macro Rates | Macro | metric |
| `fonrex_factor_exposure` | Fonrex Factor Exposure | Factors | table |
| `fonrex_factor_returns` | Fonrex Factor Returns | Factors | chart |

它们背后的路由列在 [OpenBB API 参考](../api-reference/openbb.md)中。

## 须知

- **报价**：报价小组件永远不会启动实时流。该 ticker 被订阅后（使用完全访问密钥调用 `POST /realtime/subscribe`），它显示实时价格；否则显示 Yahoo Finance 的延迟价格。
- **价格和指标**需要数据库中有该 ticker 的价格；EOD 小组件在首次使用时会采集这些价格。
- **DCF** 需要该 ticker 的深度基本面数据：请先打开深度基本面小组件。
- **因子暴露**需要该代码的日度价格（`POST /historical/ingest`，或先打开 EOD 小组件）；因子文件和欧洲央行汇率会在首次使用时下载。

## 故障排查

- **连接被拒绝**：检查 `docker compose ps`，并确认 OpenBB 能够访问该 URL。
- **401 / 403**：缺少 `X-API-KEY` 请求头，或其值与 `.env` 中的任何密钥都不匹配（修改后请重启 API）。
- **CORS 错误**：浏览器从 OpenBB 的来源调用您的实例。`OPENBB_ALLOWED_ORIGIN`（默认 `https://pro.openbb.co`）列出允许的来源，以逗号分隔。
