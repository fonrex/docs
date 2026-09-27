---
id: "openbb"
title: "OpenBB Workspace 集成 API"
sidebar_label: "OpenBB 集成"
description: "OpenBB Workspace 适配器、组件发现、预置应用及身份验证 API 参考文档"
---

# OpenBB Workspace 集成 API

Fonrex 为 **OpenBB Workspace**（桌面端与云端）提供原生后端接口。`/openbb` 路由将 Fonrex 核心金融数据模型转换为 OpenBB 小组件（Widget）所需的严格 Schema 契约：

- **指标卡片** (`type: "metric"`): `[ { "label": "...", "value": ..., "delta": ... } ]`
- **Plotly 图表** (`type: "chart"`): `Plotly.js` 图表 JSON 对象 `{ "data": [...], "layout": {...} }`
- **数据表格** (`type: "table"`): 适用于 AgGrid 的展平行记录数组 `[ { ... }, { ... } ]`

---

## 身份验证 (Authentication)

OpenBB Workspace 支持通过自定义 HTTP 请求头进行 REST 后端身份验证。Fonrex 通过双重提取验证请求凭据：

| 验证方式 | 请求头 (Header) | 使用示例 |
|---|---|---|
| **API Key 请求头 (推荐)** | `X-API-KEY: frx_live_...` | OpenBB Workspace 中配置的原生自定义请求头 |
| **Bearer Token** | `Authorization: Bearer frx_live_...` | 标准 HTTP 客户端与 curl 请求 |

> **提示**：两种请求头格式最终均映射至相同的底层密钥验证逻辑。如果您的实例启用了身份验证，请在 `.env` 文件中设置 `OPENBB_API_KEY` 或 `FONREX_API_KEY`。

---

## 发现与应用端点

### 发现可用小组件

```http
GET /openbb/widgets.json
```

返回 Fonrex 实例提供的全部 19 个交互式小组件清单。添加 Fonrex 为自定义数据源时，OpenBB Workspace 会自动查询此端点。

### 获取预置应用配置

```http
GET /openbb/apps.json
```

返回 OpenBB Workspace 的预置 Dashboard 应用配置：
1. **Fonrex — EU Markets**：单代码深度分析仪表盘（概览、估值、技术分析、新闻标签页）。
2. **Fonrex — Screener & Macro**：市场选股与宏观分析仪表盘（技术指标选股器与 FRED 宏观经济数据）。

---

## 数据接口 (Data Endpoints)

### 指标端点 (`type: "metric"`)

#### 实时行情指标
```http
GET /openbb/quote/{ticker}
```
返回实时价格快照、涨跌幅、成交量及当日高低价指标卡片。

#### 宏观利率
```http
GET /openbb/macro/rates
```
返回当前宏观经济利率与收益率数据（结合 FRED API）。

---

### 图表端点 (`type: "chart"`)

#### EOD K线图
```http
GET /openbb/eod/{ticker}?period=1y&order=a
```
返回日线级 OHLCV 历史价格 Plotly K线图表。

#### 历史 K线数据
```http
GET /openbb/ticker/{symbol}/history?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&interval=1D
```
返回指定日期范围的 Plotly K线图表。

#### 单技术指标图表
```http
GET /openbb/technical/{ticker}?indicator=rsi&period=14
```
返回单个技术指标时间序列 Plotly 折线图。

#### 多技术指标组合图表
```http
GET /openbb/technical/{ticker}/multi?indicators=sma_20,ema_50,rsi_14
```
在单个 Plotly 图表中叠加展示多个技术指标。

#### 技术分析叠加图表
```http
GET /openbb/technical/{ticker}/chart?indicators=sma_20,rsi_14
```
返回包含 K线价格主图及技术指标主/副图的叠加 Plotly 图表。

---

### 表格端点 (`type: "table"`)

#### 多源基本面数据
```http
GET /openbb/fundamental?ticker=AAPL
```
将多源基本面指标（市盈率 P/E、净资产收益率 ROE、股息率、市值）展平为表格记录。

#### 深度财务报表与 ESG
```http
GET /openbb/fundamental/deep?ticker=AAPL&sections=all
```
返回财务报表、ESG 评分、分析师评级及内部交易数据。

#### 批量行情表格
```http
GET /openbb/quotes?tickers=AAPL,MSFT,SAP.DE
```
返回多个代码的实时价格快照结构化表格。

#### DCF 内在价值估值
```http
GET /openbb/dcf/{ticker}
```
返回自由现金流 (FCF)、每股收益 (EPS) 及股息贴现 (DDM) 模型的估值结果。

#### DCF 模型对比
```http
GET /openbb/dcf/{ticker}/compare
```
返回 3 种 DCF 估值模型的横向对比表格。

#### DCF 敏感性分析矩阵
```http
GET /openbb/dcf/{ticker}/sensitivity?model=fcf&wacc_min=0.06&wacc_max=0.16&growth_min=0.01&growth_max=0.05
```
返回 WACC × 永续增长率敏感性分析矩阵。

#### 技术指标选股器
```http
GET /openbb/technical/screen?indicator=rsi&operator=lt&value=30
```
筛选满足技术指标阈值的股票并返回表格结果。

#### 聚合新闻表格
```http
GET /openbb/news/{ticker}?limit=20
```
返回经过去重处理的 7 大新闻源财经营销新闻。

#### 全球财经新闻流
```http
GET /openbb/news/feed?limit=20
```
返回全球实时财经新闻资讯列表。

#### 内部人交易
```http
GET /openbb/insider_transactions/{ticker}?limit=20
```
返回美股 SEC Form 4 高管/内部人交易记录。

#### ETF 详情
```http
GET /openbb/etf/{isin}/details
```
返回 UCITS ETF 元数据、基金规模、管理费率 (TER)、前十大持仓及行业分布。

#### 指数成分股
```http
GET /openbb/index/{index_name}/constituents
```
返回主要指数（`sp500`、`cac40`、`nasdaq100`、`dax`）的成分股列表。
