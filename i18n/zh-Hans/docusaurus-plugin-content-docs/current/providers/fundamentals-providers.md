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
| `MorningStar` | Morningstar JSON 服务（筛选器和 `sal-service`） | ISIN，或后缀所指交易所上的 ticker | 全球 |
| `Investing` | investing.com | ISIN | 全球 |
| `Barrons` | barrons.com | Ticker | 美国 |
| `wallStreetJournal` | wsj.com | ISIN | 美国 |
| `Marketwatch` | marketwatch.com | ISIN | 美国 |
| `Gurufocus` | gurufocus.com | 带交易所后缀的 ticker（`AIR.PA`），否则为 ISIN | 全球 |

该上市品种的活动映射（先 `provider_url`，后 `provider_ticker`）优先于 ISIN 或 ticker；当请求指定 ISIN 时，MSN 会收到由该 ISIN 解析出的 ticker。每个数据提供方都返回一个 `FinancialMetrics` 对象（市盈率、EPS、股息收益率、利润率、营收、净利润、ESG 评分、Gurufocus 评分…）。有些数据提供方发布的是显示用的百分数：它们在 `monitoring/units.py` 中声明，并在验证之前进行转换。

在生成的文档中，Yahoo 的响应和已存储的深度基本面数据优先；抓取类数据提供方（Google Finance、Barron's、MarketWatch、WSJ、Investing.com）仅在追踪市盈率（trailing P/E）、EPS 和股息收益率缺失时进行补充。每个数据提供方的响应都可以通过 `fmt=raw` 获取。

可选 token：`BARRONS_TOKEN`、`MARKETWATCH_TOKEN`、`WSJ_TOKEN`。

### 部分数据提供方读取的内容 {#what-some-providers-read}

- **MorningStar** 从不读取 global.morningstar.com 的行情页面（该页面由 JavaScript 填充，会对脚本返回 AWS WAF 挑战）。Morningstar 的筛选器把 ISIN，或不带 Yahoo 后缀的 ticker，转换为股票标识符（`0P0000OQN8`）：只接受 ISIN 或 ticker 与请求一致、且位于后缀所指交易所的股票（`AIR.PA` 是巴黎，绝不是纽约的 AAR Corp）。随后并行读取三个服务：概览（价格、市值、成交量、市销率、市净率、市盈率、股息率、星级）、公司简介（行业板块、行业、员工人数）和交易信息（贝塔、股本、卖空）。仅对付费用户开放的数据会被排除。站点的公开密钥已内置；只有当 Morningstar 更换它们时（HTTP 401/403），才需用 `MORNINGSTAR_SAL_API_KEY` 和 `MORNINGSTAR_SAL_REALTIME_TOKEN` 替换。
- **Gurufocus** 读取股票的摘要页面（`/stock/TSLA/summary`、`/stock/XPAR:AIR/summary`）：GF Score（`/100`）、Piotroski F-Score（`/9`）、Beneish M-Score、Altman Z-Score、ROIC、市盈率、净利润率和营业利润率、负债权益比、过去十二个月的 EPS 和营收。每个数值都来自标签链接到其术语的那一行，绝不取页面上的第一个数字；各项评分和 ROIC 会按取值范围校验。当 GF Score 徽章在浏览器中渲染时，从服务器写入的页面状态中读取该股票本身的分数，绝不取同类公司的分数。
- **ZoneBourse** 读取通过其搜索找到的行情页面：名称、ISIN、行业、最新价格和货币、分析师一致评级、分析师人数和目标价、员工人数、MSCI ESG 评级、市值、企业价值、EV/营收、自由流通比例、营收、净利润和净负债。市盈率、营收、净利润、净负债和 EV/营收为当前财年的预估值。
- **Investing** 读取英文（`www.investing.com`）或法文（`fr.investing.com`，小数点为逗号）的股票页面：价格、涨跌、货币，以及关键数据（市盈率、EPS、股息、市值、营收、净利润、EBITDA、市净率、ROA、ROE、毛利率、贝塔、52 周区间），还有行业、板块和员工人数。

## 专用数据提供方

| 数据提供方 | 来源 | 路由 |
|---|---|---|
| `SECEdgar` | SEC EDGAR，Form 4 | `/insider-transactions/{ticker}`，以及美国股票在 `/fundamental` 中的 `InsiderTransactions` 部分 |
| `JustETF` | justetf.com | `/etf/{isin}/details` |
| `IndexConstituents` | Wikipedia | `/index/{index_name}/constituents` |
| `OpenFIGI` | openfigi.com | 已加载，目前没有任何路由使用 |
| `Treasury` | home.treasury.gov，每日平价收益率曲线 | `/macro/treasury/curve`、`/macro/treasury/series`，以及 FRED 不提供时 DCF 的美国无风险利率 |
| `CFTC` | cftc.gov，每周交易商持仓报告（Legacy、TFF、Disaggregated） | `/cot/markets`、`/cot/positions`、`/cot/signals`、`/cot/extremes` |
| `ESEF` | filings.xbrl.org（欧洲上市公司的 ESEF 年度报告）和 GLEIF（ISIN 对应的 LEI） | `/esef/{ticker}/statements`、`/esef/{ticker}/check`、`/esef/{ticker}/filings` |

## 健康状况

每个基本面数据提供方每天都会由 [canary 监控](../monitoring/canary-monitor.md)检查；`GET /health/providers` 显示检查结果。启动时无法导入的数据提供方会列在 `GET /health` 的 `providers.unavailable` 中。
