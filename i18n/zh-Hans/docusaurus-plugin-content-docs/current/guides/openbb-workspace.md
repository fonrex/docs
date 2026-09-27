---
id: "openbb-workspace"
title: "将 Fonrex 连接至 OpenBB Workspace"
sidebar_label: "OpenBB Workspace 指南"
description: "将自托管 Fonrex 数据管道连接至 OpenBB Workspace 仪表盘的逐步配置指南"
---

# 将 Fonrex 连接至 OpenBB Workspace

[OpenBB Workspace](https://openbb.co) 是一款现代化的开源金融终端与仪表盘平台。Fonrex 提供了原生集成适配器，允许您将自托管的 Fonrex API 实例直接无缝连接至 OpenBB Workspace。

连接后，您可以直接在 OpenBB 桌面端或云端工作区中无缝接入欧洲基本面数据、DCF 内在价值估值、自定义技术指标计算以及多源聚合财经新闻。

---

## 准备工作 (Prerequisites)

在开始前，请确保您具备：

1. 一个正常运行的 Fonrex API 实例（在本地通过 `http://localhost:5000` 访问或通过自定义域名 / 远程 Relay 访问）。
2. OpenBB Workspace 应用程序（桌面端或 Web 界面）。
3. 如果您的 Fonrex 实例启用了身份验证（`FONREX_AUTH_REQUIRED=true` 或已设置 `OPENBB_API_KEY`），请准备好您的 API Key（例如 `frx_live_...`）。

---

## 逐步配置步骤

### 步骤 1：在 OpenBB 中将 Fonrex 添加为数据源

1. 打开 **OpenBB Workspace**。
2. 在工作区网格的任意位置右键点击并选择 **"Add data"**（或在设置中打开 **Backend Connections**）。
3. 输入您的 Fonrex 后端地址：
   - 本地开发环境：`http://localhost:5000`
   - 远程部署环境：`https://your-fonrex-instance.com`
4. OpenBB Workspace 将会自动请求 `/openbb/widgets.json` 端点以检索全部 19 个可用小组件。

### 步骤 2：配置身份验证请求头

如果您的 Fonrex 服务器需要 API 密钥：

1. 在 OpenBB 的后端连接设置弹窗中，添加自定义请求头：
   - 请求头名称 (Header Name)：`X-API-KEY`
   - 请求头数值 (Header Value)：`frx_live_your_api_key_here`
2. 此外，标准请求头 `Authorization: Bearer frx_live_...` 同样受到支持。
3. 点击 **Save Connection** 保存连接。

### 步骤 3：导入预置仪表盘应用

Fonrex 通过 `/openbb/apps.json` 提供了两个预先配置的多标签页应用：

#### 1. Fonrex — EU Markets
单代码全方位分析套件，包含：
- **概览标签页 (Overview)**：实时行情指标、深度基本面及日线 K线图。
- **估值标签页 (Valuation)**：DCF 内在价值计算及 WACC × 永续增长率敏感性分析矩阵。
- **技术分析标签页 (Technical)**：叠加技术指标图表（RSI、SMA、MACD）。
- **新闻标签页 (News)**：来自 7 大财经新闻源的去重新闻流。

#### 2. Fonrex — Screener & Macro
选股与宏观分析工作区：
- **选股器标签页 (Screener)**：实时技术指标选股表格。
- **宏观背景标签页 (Macro Context)**：主要宏观经济利率数据 (FRED) 及核心指数成分股（S&P 500、CAC 40、NASDAQ 100、DAX）。

导入方法：
1. 打开 OpenBB 中的 **Apps / Marketplace** 菜单。
2. 选择 **"Import App"** 并选择 **Fonrex — EU Markets**。

---

## 小组件 (Widget) 汇总一览

| Widget ID | 小组件名称 | 分类 | 输出类型 |
|---|---|---|---|
| `fonrex_fundamentals` | Fonrex 基本面 | Fundamentals | 表格 (Table) |
| `fonrex_fundamentals_deep` | Fonrex 深度基本面 | Fundamentals | 表格 (Table) |
| `fonrex_eod` | Fonrex EOD 历史图表 | Historical | Plotly 图表 |
| `fonrex_history` | Fonrex OHLCV 历史图表 | Historical | Plotly 图表 |
| `fonrex_quote` | Fonrex 实时报价 | Market Data | 指标卡片 |
| `fonrex_quotes_batch` | Fonrex 批量报价 | Market Data | 表格 (Table) |
| `fonrex_technical` | Fonrex 技术指标 | Technical | Plotly 图表 |
| `fonrex_technical_multi` | Fonrex 多指标图表 | Technical | Plotly 图表 |
| `fonrex_technical_chart` | Fonrex 叠加技术图表 | Technical | Plotly 图表 |
| `fonrex_screener` | Fonrex 技术指标选股器 | Technical | 表格 (Table) |
| `fonrex_news` | Fonrex 个股新闻 | News | 表格 (Table) |
| `fonrex_news_feed` | Fonrex 全球新闻流 | News | 表格 (Table) |
| `fonrex_dcf` | Fonrex DCF 估值 | Valuation | 表格 (Table) |
| `fonrex_dcf_compare` | Fonrex DCF 模型对比 | Valuation | 表格 (Table) |
| `fonrex_dcf_sensitivity` | Fonrex DCF 敏感性矩阵 | Valuation | 表格 (Table) |
| `fonrex_insider_transactions` | Fonrex 高管交易 | Fundamentals | 表格 (Table) |
| `fonrex_etf_details` | Fonrex ETF 详情 | Fundamentals | 表格 (Table) |
| `fonrex_index_constituents` | Fonrex 指数成分股 | Market Data | 表格 (Table) |
| `fonrex_macro_rates` | Fonrex 宏观利率 | Macro | 指标卡片 |

---

## 常见连接故障排除

- **连接被拒绝 (Connection Refused)**：通过 `docker compose ps` 检查 `fonrex-api` 容器是否处于 running 状态且端口 `5000` 已正常对外映射。
- **401 / 403 错误**：检查 OpenBB 中配置的 `X-API-KEY` 请求头是否与 Fonrex `.env` 文件中的配置相匹配。
- **CORS 跨域错误**：若使用 OpenBB Web 版，请确保 Fonrex 允许来自 OpenBB 域名的跨域请求，或在 `.env` 中设置 `CORS_ORIGINS=*`。
