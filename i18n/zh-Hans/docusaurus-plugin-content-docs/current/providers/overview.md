---
id: "overview"
title: "数据提供方架构概览"
sidebar_label: "概览"
description: "Fonrex 如何并行查询数据提供方、选择搜索词、验证数值并共享同一个 HTTP 层"
---

# 数据提供方架构概览

Fonrex 通过**数据提供方**从公开来源采集数据：14 个基本面数据提供方、4 个专用数据提供方、7 个新闻数据提供方，以及用于价格的 Yahoo Finance 和 TradingView。它们全部运行在您的实例内部，使用您的 IP 地址（或您的代理）。

## 一次 `/fundamental` 请求

```
GET /fundamental?ticker=AIR.PA
      │
      ▼
GetFundamentals  ── listing, ISIN, mappings, verified Yahoo symbol
      │
      ▼
FinancialProviderRunner.run()  ── all providers in parallel (12 s each)
      │      ZoneBourse, GoogleFinance, Boursorama, Barrons, WSJ, MarketWatch,
      │      MorningStar, Investing, Gurufocus, Fortuneo, BourseDirect, MSN,
      │      InvestirLesEchos, YahooFinance  (+ SEC EDGAR insider data, 15 s max)
      ▼
ValidationLayer.validate_results()  ── range and consensus checks, outliers → None
      ▼
FinancialsFormatter.to_eodhd()  ── each figure: Yahoo → stored figures → scraped providers
      ▼
JSON document with a Sources section (cached 1 hour)
```

## 每个数据提供方的搜索词

运行器按以下顺序，为每个数据提供方提供其所拥有的最可靠的标识符：

1. 对于 Yahoo Finance，使用**为该上市品种验证过的代码**（根据 ISIN 查找，并以该上市品种的货币报价）。没有已验证代码的上市品种不会发送给 Yahoo，因为其裸 ticker 可能对应另一个金融工具。
2. 对于 Google Finance，使用根据上市品种交易所构建的 ticker（`EPA:AIR`）；对于 Gurufocus，使用带 Yahoo 后缀的 ticker（`AIR.PA`）。
3. 活动的 `provider_url` 映射，其次是活动的 `provider_ticker` 映射。
4. ISIN，适用于按 ISIN 搜索的数据提供方（ZoneBourse、Investing、WSJ、MarketWatch、Fortuneo、BourseDirect、Boursorama、Gurufocus、InvestirLesEchos）。
5. 请求中的 ticker。

每个数据提供方所用的搜索词会在 `raw_providers`（`fmt=raw`）中报告。

## 韧性

- **数据提供方相互独立。** 失败或超时的数据提供方返回一条错误记录；其他数据提供方照常响应。
- **拒绝同名证券。** 如果抓取类数据提供方返回的 ISIN 与该金融工具的 ISIN 不同，会被报告为错误，而不会被合并。
- **数值经过验证。** [验证层](../monitoring/validation-layer.md)会在构建文档之前丢弃超出范围的值和共识异常值。
- **单一 HTTP 层。** 每个数据提供方都经由 `BaseFinancialProvider`：遇到网络错误和 429/5xx 时尝试三次，暂停时间逐渐增加；遇到 401/403/404 时最终失败；每个数据提供方最多同时发出 `FONREX_PROVIDER_MAX_CONCURRENCY` 个请求；可选代理（`FONREX_PROXY_URL`，可用 `FONREX_PROXY_PROVIDERS` 限定于部分数据提供方）。

## 当网站拒绝您的请求时

受反爬虫服务保护的网站越来越多地拒绝来自个人网络连接的请求（通常返回 `403`）。此时该数据提供方会报告错误，其他数据提供方照常响应。请让这些数据提供方通过您选择的 HTTP 代理访问：

```env
FONREX_PROXY_URL=http://user:password@proxy.example:8888
FONREX_PROXY_PROVIDERS=Investing,Gurufocus,wallStreetJournal
```

代理适用于被抓取的网站，不适用于 `yfinance` 和 TradingView 库。

## 相关页面

- [基本面数据提供方](fundamentals-providers.md)
- [新闻数据提供方](news-providers.md)
- [添加数据提供方](../guides/adding-providers.md)
