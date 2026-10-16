---
id: "sec-filings"
title: "SEC 申报 API 参考（XBRL）"
sidebar_label: "SEC 申报（XBRL）"
description: "向 SEC 提交的年度报表，从 EDGAR 的 XBRL 事实中读取，并用来核对 Yahoo 的报表"
---

# SEC 申报 API 参考（XBRL）

在美国上市的公司会向 [SEC](https://www.sec.gov/edgar) 提交年度报告，报告中的每个数字都以 **XBRL 事实**的形式公布：一个概念（`us-gaap:Revenues`）、一个单位、一个期间、一个数值，以及它所来自的申报文件。Fonrex 读取这些事实（免费 API，无需密钥），保存在您自己的数据库中，并把它们作为从 Yahoo Finance 保存的报表的**核对来源**。

| 路由 | 作用 |
|---|---|
| `GET /sec/{ticker}/statements` | 向 SEC 提交的年度报表，每个数字附带其概念和申报文件 |
| `GET /sec/{ticker}/check` | 逐个数字将 Yahoo 的报表与 SEC 申报进行核对 |
| `POST /sec/{ticker}/refresh` | 重新查找公司并立即读取其事实 |

Form 4 内部人交易仍在 [`GET /insider-transactions/{ticker}`](./specialized.md)。

## 适用的金融工具

SEC 按公司归档数据，使用 **CIK**（Central Index Key）。Fonrex 从不根据代码猜测 CIK：`AIR.PA` 是巴黎上市的空客，而 SEC 的 `AIR` 是美国公司 AAR Corp。用错误代码得到的 CIK 会给出另一家公司的报表，而且不会报任何错。

- 只查找该金融工具的**美国上市品种**：以 USD 报价、在美国交易所上市、代码不指向任何外国交易所。`AIR.PA` 和 `SAP.DE` 永远不会发送给 SEC。
- 代码必须出现在 [SEC 的代码表](https://www.sec.gov/files/company_tickers_exchange.json)中，且表中的公司**名称**必须与您目录中该金融工具的名称一致。
- 找到的 CIK 保存在**金融工具**上：它的所有上市品种共享同样的申报文件。如果您的目录中有 SAP 的纽交所上市品种（`SAP`），就能通过它找到 SAP，`SAP.DE` 随后也会得到同样的答案。
- 没有美国上市品种的金融工具返回 `404` 并附带原因。7 天内不会再次查找；`POST /sec/{ticker}/refresh` 会立即查找（例如在添加美国上市品种之后）。
- 您在 `asset_mappings` 中自行设置的 CIK（提供方 `SEC`，`source` = `manual`，不关联上市品种）会被直接采信。

## 报表的读取方式

- **只取年度报告**：表格 `10-K`（美国公司）、`20-F`（外国公司）、`40-F`（加拿大公司）及其修订版。
- **一个财年是 350 到 380 天的期间**；资产负债表数字是财年结束日的时点事实。季度报告中的九个月数字绝不会被当作一年。
- **重述优先**：10-K 会重复前两年的数据并可能对其更正。每个期间保留最新申报文件中的值，并注明数字来自哪份申报文件。
- **一个数字对应多个概念**：营业收入在 JPMorgan 是 `Revenues`，在 Apple 是 `RevenueFromContractWithCustomerExcludingAssessedTax`，在 SAP 是 `Revenue`（IFRS）。每个数字按顺序列出其概念，取该年第一个已申报的概念；答案中会注明。
- **每年一种货币**：最新年度报告的货币。以欧元报告的外国公司给出欧元，绝不混用欧元和美元。
- **数值保持申报原样**：支出（`capex`、`dividends_paid`、`stock_repurchases`）为**正**金额，而 Yahoo 给出的是负的现金流。公司未申报的数字不出现：银行没有 `operating_income`。

### 数字

| 报表 | 数字 |
|---|---|
| 利润表 | `revenue`、`gross_profit`、`operating_income`、`net_income`、`eps_basic`、`eps_diluted`、`shares_basic`、`shares_diluted`、`rd_expense`、`sga_expense`、`interest_expense`、`tax_provision` |
| 资产负债表 | `total_assets`、`total_liabilities`、`total_equity`、`cash_and_equivalents`、`short_term_investments`、`accounts_receivable`、`inventory`、`goodwill`、`intangible_assets`、`long_term_debt`、`retained_earnings` |
| 现金流量表 | `operating_cashflow`、`investing_cashflow`、`financing_cashflow`、`capex`、`dividends_paid`、`stock_repurchases`、`depreciation_amortization` |

这些名称就是 `financial_statements` 的列名，因此 SEC 的数字和 Yahoo 的同一数字名称相同。

## 新鲜度

公司的事实在第一次被请求时从 SEC 一次性读取（每家公司一个文件，最大的公司为 4 到 8 MB）。之后：

- 不到 **`SEC_XBRL_REFRESH_HOURS`** 小时（默认 24）前读取过的公司直接从数据库返回；
- 更早读取的公司会被重新读取；新的申报文件会添加其年份，并替换它所重述的值；
- SEC 无响应时，返回已保存的数字，`load.status` = `failed` 并附带原因。

每个答案都在 `load` 中说明做了什么：`fetched`（本次读取）、`fresh`（最近读取过）或 `failed`，以及 `last_filed`（保存的最新申报）和 `facts`（保存的事实数量）。

SEC 要求每个自动化客户端提供联系地址。请将 **`SEC_EDGAR_EMAIL`** 设置为您自己的地址：只要它仍是示例地址，API 启动时就会记录一条警告。

---

## <span className="api-method get">GET</span> `/sec/{ticker}/statements`

向 SEC 提交的年度报表，最近的财年在前。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `ticker` | — | 您目录中的一个代码 |
| `years` | 所有年份 | 返回最近的财年数（1 到 30） |
| `isin` | — | 当多个金融工具共用该代码时，指定金融工具 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/sec/AAPL/statements?years=1"
```

```json
{
  "ticker": "AAPL",
  "cik": "0000320193",
  "entity_name": "Apple Inc.",
  "source": "SEC EDGAR, XBRL company facts (https://www.sec.gov/edgar)",
  "load": {
    "status": "fresh",
    "fetched_at": "2026-10-16T09:00:00Z",
    "last_filed": "2025-10-31",
    "facts": 1240,
    "reason": null
  },
  "years": [
    {
      "period_end": "2025-09-27",
      "currency": "USD",
      "figures": {
        "revenue": {
          "value": 416161000000.0,
          "concept": "RevenueFromContractWithCustomerExcludingAssessedTax",
          "taxonomy": "us-gaap",
          "unit": "USD",
          "form": "10-K",
          "filed": "2025-10-31",
          "accession": "0000320193-25-000079",
          "filing_url": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/"
        },
        "net_income": { "value": 112010000000.0, "concept": "NetIncomeLoss", "...": "..." },
        "eps_diluted": { "value": 7.46, "unit": "USD/shares", "...": "..." },
        "capex": { "value": 12715000000.0, "concept": "PaymentsToAcquirePropertyPlantAndEquipment", "...": "..." }
      }
    }
  ]
}
```

`period_end` 是申报的财年结束日：Apple 的财年在九月最后一个星期六结束。`filing_url` 打开 EDGAR 上该申报文件的目录。

---

## <span className="api-method get">GET</span> `/sec/{ticker}/check`

将从 Yahoo 保存的报表与 SEC 申报进行核对。对每个已申报的财年，两个来源定义相同的每个数字都会得到一个状态：

| `status` | 含义 |
|---|---|
| `match` | 在 **`SEC_CHECK_TOLERANCE`**（默认 1%）范围内数值相同 |
| `mismatch` | 差距大于容差：值得查看 |
| `missing_yahoo` | 已向 SEC 申报，Yahoo 中缺失 |
| `missing_sec` | Yahoo 提供，但未向 SEC 申报 |

| 参数 | 默认值 | 说明 |
|---|---|---|
| `ticker` | — | 您目录中的一个代码 |
| `years` | 所有年份 | 返回最近的财年数（1 到 30） |
| `isin` | — | 当多个金融工具共用该代码时，指定金融工具 |

两个来源如何并列对比：

- **按结束日匹配年份**，最多相差两周：Apple 于 2025 年 9 月 27 日结束的财年，Yahoo 标注为 30 日。`yahoo_period_end` 给出匹配到的日期，Yahoo 没有该年份时为 `null`。
- **`difference`** 等于 `(yahoo - sec) / |sec|`，以比率表示。资本支出、已付股息和利息费用按**金额**比较，不考虑符号。
- **比较的数字**：营业收入、毛利、营业利润、净利润、每股收益和股数（基本和稀释）、利息费用、所得税、总资产、总负债、三项现金流、资本支出和已付股息。
- **不比较**的数字（列在 `not_compared` 中），因为两个来源的定义不同：现金（Yahoo 可能加入短期投资）和股东权益（Yahoo 包含少数股东权益）。
- **货币不同的年份**不进行比较：该年没有数字，并有一条 `note` 说明原因。

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/sec/AAPL/check?years=1"
```

```json
{
  "ticker": "AAPL",
  "cik": "0000320193",
  "entity_name": "Apple Inc.",
  "source": "SEC EDGAR, XBRL company facts (https://www.sec.gov/edgar)",
  "tolerance": 0.01,
  "not_compared": {
    "cash_and_equivalents": "Yahoo may add the short-term investments",
    "total_equity": "Yahoo includes the minority interests"
  },
  "load": { "status": "fresh", "...": "..." },
  "years": [
    {
      "period_end": "2025-09-27",
      "yahoo_period_end": "2025-09-30",
      "currency": "USD",
      "yahoo_currency": "USD",
      "note": null,
      "match": 14,
      "mismatch": 1,
      "missing_yahoo": 0,
      "missing_sec": 0,
      "figures": [
        {
          "column": "revenue",
          "statement": "income",
          "status": "match",
          "sec": 416161000000.0,
          "yahoo": 416161000000.0,
          "difference": 0.0,
          "concept": "RevenueFromContractWithCustomerExcludingAssessedTax",
          "filing_url": "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/"
        },
        { "column": "capex", "statement": "cashflow", "status": "match", "sec": 12715000000.0, "yahoo": -12715000000.0, "difference": 0.0, "...": "..." }
      ]
    }
  ]
}
```

示例中的数值仅作说明。`mismatch` 并不总是 Yahoo 的错误：在修正任何数据之前，请先在申报文件（`filing_url`）中核对该数字。

---

## <span className="api-method post">POST</span> `/sec/{ticker}/refresh`

在 SEC 的代码表中重新查找该金融工具的 CIK，并立即读取公司的事实，即使最近已读取过。需要完全访问密钥：只读密钥会得到 `403`。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `ticker` | — | 您目录中的一个代码 |
| `isin` | — | 当多个金融工具共用该代码时，指定金融工具 |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/sec/AAPL/refresh"
```

答案给出 `ticker`、`cik`、`entity_name` 以及本次读取的 `load`。

## 错误

| 状态 | 何时 |
|---|---|
| `404` | 未知代码，或该金融工具没有 SEC 申报公司（会给出原因：没有美国上市品种、名称不一致……） |
| `422` | `years` 不在 1 到 30 之间 |
| `502` | 无法读取 SEC，且该公司尚无任何已保存的数据 |
| `503` | 没有数据库 |

## OpenBB 小组件

**Fonrex SEC Check**（`fonrex_sec_check`）以表格显示核对结果：每个年份和数字一行，差异排在前面，列出 SEC 和 Yahoo 的数值、百分比差距、XBRL 概念以及申报文件链接。其 `years` 参数默认为 3。

它不在预先组装好的仪表板中，因为这些仪表板跟踪的是没有 SEC 申报的欧洲代码：请为美国代码将其添加到您自己的仪表板。参见 [OpenBB Workspace 指南](../guides/openbb-workspace.md)。
