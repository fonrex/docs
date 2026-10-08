---
id: "fundamentals-providers"
title: "基本面数据提供方列表"
sidebar_label: "基本面数据提供方"
description: "/fundamental 查询的数据提供方以及专用数据提供方"
---

# 基本面数据提供方列表

## `/fundamental` 的数据提供方

这些名称是响应中的键，也是 `provider` 参数接受的值（不区分大小写）。

| 数据提供方 | 来源 | 搜索依据 | 区域 |
|---|---|---|---|
| `YahooFinance` | Yahoo Finance（`yfinance` 库） | 该上市品种的已验证代码 | 全球 |
| `ZoneBourse` | zonebourse.com | ISIN | 欧洲 |
| `Boursorama` | boursorama.com | ISIN | 法国 / 欧洲 |
| `Fortuneo` | fortuneo.fr | ISIN | 法国 |
| `BourseDirect` | boursedirect.fr | ISIN | 法国 |
| `InvestirLesEchos` | investir.lesechos.fr | ISIN | 法国 |
| `GoogleFinance` | google.com/finance | 带上市品种交易所的 ticker（`EPA:AIR`） | 全球 |
| `Msn` | msn.com/money | Ticker | 全球 |
| `MorningStar` | morningstar | Ticker | 全球 |
| `Investing` | investing.com | ISIN | 全球 |
| `Barrons` | barrons.com | Ticker | 美国 |
| `wallStreetJournal` | wsj.com | ISIN | 美国 |
| `Marketwatch` | marketwatch.com | ISIN | 美国 |
| `Gurufocus` | gurufocus.com | 带交易所后缀的 ticker（`AIR.PA`），否则为 ISIN | 全球 |

该上市品种的活动映射（先 `provider_url`，后 `provider_ticker`）优先于 ISIN 或 ticker；当请求指定 ISIN 时，MSN 会收到由该 ISIN 解析出的 ticker。每个数据提供方都返回一个 `FinancialMetrics` 对象（市盈率、EPS、股息收益率、利润率、营收、净利润、ESG 评分、Gurufocus 评分…）。有些数据提供方发布的是显示用的百分数：它们在 `monitoring/units.py` 中声明，并在验证之前进行转换。

在生成的文档中，Yahoo 的响应和已存储的深度基本面数据优先；抓取类数据提供方（Google Finance、Barron's、MarketWatch、WSJ、Investing.com）仅在追踪市盈率（trailing P/E）、EPS 和股息收益率缺失时进行补充。每个数据提供方的响应都可以通过 `fmt=raw` 获取。

可选 token：`BARRONS_TOKEN`、`MARKETWATCH_TOKEN`、`WSJ_TOKEN`。

## 专用数据提供方

| 数据提供方 | 来源 | 路由 |
|---|---|---|
| `SECEdgar` | SEC EDGAR，Form 4 | `/insider-transactions/{ticker}`，以及美国股票在 `/fundamental` 中的 `InsiderTransactions` 部分 |
| `JustETF` | justetf.com | `/etf/{isin}/details` |
| `IndexConstituents` | Wikipedia | `/index/{index_name}/constituents` |
| `OpenFIGI` | openfigi.com | 已加载，目前没有任何路由使用 |

## 健康状况

每个基本面数据提供方每天都会由 [canary 监控](../monitoring/canary-monitor.md)检查；`GET /health/providers` 显示检查结果。启动时无法导入的数据提供方会列在 `GET /health` 的 `providers.unavailable` 中。
