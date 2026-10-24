---
id: "esef-filings"
title: "ESEF 报告 API 参考（欧洲年度报告）"
sidebar_label: "ESEF 报告（欧洲）"
description: "欧洲上市公司的年度报表，从 filings.xbrl.org 上的 ESEF 报告中读取，并用来核对 Yahoo 的报表"
---

# ESEF 报告 API 参考（欧洲年度报告）

自 2020 年起始的财年起，在欧盟受监管市场上市的公司须以**欧洲单一电子格式**（ESEF）发布年度报告：这是一份 XHTML 文档，其中的数字使用 IFRS 分类标准以 XBRL 标记。由 XBRL International 运营的 [filings.xbrl.org](https://filings.xbrl.org) 收集这些报告，并将每份报告转换为 xBRL-JSON。Fonrex 读取这些报告（免费，无需密钥），把其中的数字保存在您自己的数据库中，并像对待美国公司的 [SEC 申报](./sec-filings.md) 一样，把它们作为从 Yahoo Finance 保存的报表的**核对来源**。

| 路由 | 作用 |
|---|---|
| `GET /esef/{ticker}/statements` | 以 ESEF 发布的年度报表，每个数字附带其概念、所属报告及其链接 |
| `GET /esef/{ticker}/check` | 逐个数字将 Yahoo 的报表与 ESEF 报告进行核对 |
| `GET /esef/{ticker}/filings` | 该公司在索引中的报告，以及读取结果 |
| `POST /esef/{ticker}/refresh` | 重新向 GLEIF 查询该公司，并立即读取所有报告 |

:::caution 覆盖范围
filings.xbrl.org 表示其索引**并不完整**。找不到任何德国公司的报告（SAP 没有），爱尔兰的覆盖也很差。ESEF 只发布年度报告；少数公司（Novo Nordisk）还会发布半年报和季报，Fonrex 会保存它们，但从不把它们当作一个财年。
:::

## 适用的金融工具

报告按 **LEI**（法人机构识别编码）归档，而不是按代码。Fonrex 用金融工具的 **ISIN** 向官方 LEI 登记机构 [GLEIF](https://www.gleif.org) 查询 LEI，从不使用代码：`NL0000235190` 是 Airbus 发行的一只证券，无论 `AIR` 在另一家交易所代表什么。

- **没有 ISIN** 的金融工具，或不发布年度报告的类型（ETF、基金、指数、货币）不会被查询。
- GLEIF 给出的实体必须带有您目录中该金融工具的**名称**（其法定名称或其他名称之一），法律形式不计在内（`S.A.`、`SE`、`N.V.`、`S.p.A.`、`A/S`、`AB (publ)`…）。`Novo Nordisk B` 即 `NOVO NORDISK A/S`；`Air Liquide` 可以在其很长的法定名称 `L'AIR LIQUIDE SOCIETE ANONYME POUR L'ETUDE…` 中找到。名称不符时会被拒绝，并给出 GLEIF 的名称：`Total` 不是 `TotalEnergies SE`。
- 找到的 LEI 按**金融工具**保存：它的所有上市都共享同样的报告。您自己在 `asset_mappings` 中设置的 LEI（提供方 `LEI`，`source` = `manual`，不关联上市）会被原样采用。
- 未找到 LEI 的金融工具在 30 天内不会再次查询；`POST /esef/{ticker}/refresh` 会立即查询。
- 当多个金融工具共用一个代码时，请加上 `isin=` 选择其中一个。

## 报告的读取方式

- **每个期间一份报告。** 索引中可能每种语言各有一份报告（TotalEnergies 用法语和英语发布），或有第二个版本（BNP Paribas，`-0` 和 `-1`）。在同一期间列出的报告中，只读取索引最后处理的那一份；其他报告留在索引中，不读取。
- **每份报告只读一次。** 已读取、被拒绝或没有 xBRL-JSON 的报告不会再次读取，除非其文件发生变化或您要求读取（`refresh`）。filings.xbrl.org 未提供的报告会在下次读取时再次请求。
- **只保留合计数。** 一份报告会标记数百个数字；Fonrex 只保留合计数，从不保留按分部或权益组成部分的细分，也不保留附注文字——附注文字占一份报告 0.1 至 32 MB 中的绝大部分。
- **期间来自数字本身。** 索引给报告标注的期间可能有误：Pernod Ricard 列在 2021 年 12 月 31 日的报告，实际包含截至 2021 年 6 月 30 日的财年。Fonrex 按每个数字自己的期间来标注日期。
- **重述优先**：一份报告会重复上一年的数据，并可能加以更正。对每个期间，保留最新报告的数值，并注明该数字来自哪份报告。
- **一个财年是 350 至 380 天的期间**；资产负债表数字是财年末的数值。半年和季度数据会被保存，但不计入报表。
- **每年一种货币**：最新报告的货币。法国公司 TotalEnergies 以**美元**报告：其数字以美元表示。
- **文件要么整体读取，要么完全不读**：出现另一家公司的数字、不是日期的期间或不是数字的数值，都会导致该报告被拒绝，`/filings` 会给出原因。同一数字出现两个不同数值时，只舍弃该数字。

### 数字

数字与 [SEC 申报](./sec-filings.md#数字) 相同，名称也相同：即 `financial_statements` 的列名。其 IFRS 概念按顺序如下：

| 数字 | IFRS 概念 |
|---|---|
| `revenue` | `Revenue`（Airbus、Novo Nordisk）、`RevenueFromContractsWithCustomers`（TotalEnergies、Pernod Ricard）、`RevenueFromSaleOfGoods` |
| `net_income` | `ProfitLossAttributableToOwnersOfParent`，对没有少数股东权益的公司（Novo Nordisk）再用 `ProfitLoss` |
| `total_equity` | `EquityAttributableToOwnersOfParent`，然后 `Equity` |
| `operating_income` | `ProfitLossFromOperatingActivities` |
| `total_assets` | `Assets` |
| `operating_cashflow` | `CashFlowsFromUsedInOperatingActivities` |

公司未标记的数字不会出现。ESEF 中很少标记加权平均股数，银行也没有营业收入：实际上，根据公司不同，30 个数字中会填入 14 至 21 个。

## 新鲜度

一家公司的报告在首次被请求时列出并读取。之后：

- 不到 **`ESEF_REFRESH_HOURS`** 小时（默认 24）前读取过的公司，直接从数据库返回；
- 更早读取的公司会重新读取其索引，只读取新的报告；
- 当 filings.xbrl.org 没有响应时，返回已保存的数字，`load.status` = `failed` 并附上原因。

每个响应都会在 `load` 中说明所做的操作：`fetched`（本次读取）、`fresh`（最近读取过）或 `failed`，并附上 `filings`（索引中的数量）、`last_report_end`（已读取的最新期间）、`facts`（保存的数值），以及本次读取的报告 `read` 和被拒绝的报告 `refused`。

一次性读取您目录中所有股票的报告：

```bash
docker compose exec fonrex-api python scripts/load_esef.py
docker compose exec fonrex-api python scripts/load_esef.py --ticker AIR.PA TTE.PA --force
```

每只股票一行：其状态、LEI 以及读取的内容。基金和没有 ISIN 的股票不在其中。首次读取一个大型目录需要一些时间；之后只读取新的报告。

---

## <span className="api-method get">GET</span> `/esef/{ticker}/statements`

以 ESEF 发布的年度报表，最近的财年排在最前。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `ticker` | — | 您目录中的一个代码 |
| `years` | 所有年份 | 返回最近的几个财年（1 至 30） |
| `isin` | — | 当多个金融工具共用该代码时，指定其中一个 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/statements?years=1"
```

```json
{
  "ticker": "AIR.PA",
  "lei": "MINO79WLOO247M1IL051",
  "entity_name": "AIRBUS SE",
  "source": "ESEF annual reports, filings.xbrl.org (XBRL International, https://filings.xbrl.org); LEI from GLEIF (https://www.gleif.org)",
  "load": {
    "status": "fresh",
    "fetched_at": "2026-10-21T07:00:00Z",
    "filings": 5,
    "last_report_end": "2025-12-31",
    "facts": 1310,
    "read": [],
    "refused": {},
    "reason": null
  },
  "years": [
    {
      "period_end": "2025-12-31",
      "currency": "EUR",
      "figures": {
        "revenue": {
          "value": 73420000000.0,
          "concept": "Revenue",
          "taxonomy": "ifrs-full",
          "unit": "EUR",
          "fxo_id": "MINO79WLOO247M1IL051-2025-12-31-ESEF-NL-0",
          "report_end": "2025-12-31",
          "viewer_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/MINO79WLOO247M1IL051-2025-12-31-1-en/reports/ixbrlviewer.html"
        },
        "net_income": { "value": 5221000000.0, "concept": "ProfitLossAttributableToOwnersOfParent", "...": "..." },
        "total_assets": { "value": 134939000000.0, "concept": "Assets", "...": "..." },
        "eps_diluted": { "value": 6.6, "unit": "EUR/shares", "...": "..." }
      }
    }
  ]
}
```

`fxo_id` 指明该数字所属的报告，`viewer_url` 在 filings.xbrl.org 的查看器中打开该报告，可以在报告原文中找到被标记的数字。

---

## <span className="api-method get">GET</span> `/esef/{ticker}/check`

将从 Yahoo 保存的报表与 ESEF 报告进行核对，规则与 [SEC 核对](./sec-filings.md#get-sectickercheck) 相同：比较相同的数字，使用相同的容差（**`SEC_CHECK_TOLERANCE`**，默认 1%），按结束日期在两周以内匹配年份，付款按金额比较，现金和权益不比较。

| `status` | 含义 |
|---|---|
| `match` | 在容差范围内数值相同 |
| `mismatch` | 差距大于容差：值得检查 |
| `missing_yahoo` | ESEF 报告中有，Yahoo 中缺失 |
| `missing_esef` | Yahoo 给出，ESEF 报告中未标记 |

| 参数 | 默认值 | 说明 |
|---|---|---|
| `ticker` | — | 您目录中的一个代码 |
| `years` | 所有年份 | 返回最近的几个财年（1 至 30） |
| `isin` | — | 当多个金融工具共用该代码时，指定其中一个 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/check?years=1"
```

```json
{
  "ticker": "AIR.PA",
  "lei": "MINO79WLOO247M1IL051",
  "entity_name": "AIRBUS SE",
  "tolerance": 0.01,
  "not_compared": {
    "cash_and_equivalents": "Yahoo may add the short-term investments",
    "total_equity": "Yahoo includes the minority interests"
  },
  "load": { "status": "fresh", "...": "..." },
  "years": [
    {
      "period_end": "2025-12-31",
      "yahoo_period_end": "2025-12-31",
      "currency": "EUR",
      "yahoo_currency": "EUR",
      "note": null,
      "match": 9,
      "mismatch": 1,
      "missing_yahoo": 2,
      "missing_esef": 2,
      "figures": [
        {
          "column": "revenue",
          "statement": "income",
          "status": "match",
          "esef": 73420000000.0,
          "yahoo": 73420000000.0,
          "difference": 0.0,
          "concept": "Revenue",
          "viewer_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/…/ixbrlviewer.html"
        }
      ]
    }
  ]
}
```

数值仅为示例。使用另一种货币的年份不作比较，其 `note` 会说明这一点：Yahoo 可能以欧元给出 TotalEnergies 的数据，而其报告使用美元。`mismatch` 并不总是 Yahoo 的错误：在做任何更正之前，请先打开报告（`viewer_url`）核实。

---

## <span className="api-method get">GET</span> `/esef/{ticker}/filings`

该公司在 filings.xbrl.org 索引中的报告，最近的期间排在最前，并附上读取结果。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `ticker` | — | 您目录中的一个代码 |
| `isin` | — | 当多个金融工具共用该代码时，指定其中一个 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/filings"
```

```json
{
  "ticker": "AIR.PA",
  "lei": "MINO79WLOO247M1IL051",
  "entity_name": "AIRBUS SE",
  "load": { "status": "fresh", "...": "..." },
  "filings": [
    {
      "fxo_id": "MINO79WLOO247M1IL051-2025-12-31-ESEF-NL-0",
      "listed_period_end": "2025-12-31",
      "report_end": "2025-12-31",
      "country": "NL",
      "read_status": "read",
      "read_reason": null,
      "facts": 269,
      "breakdowns": 171,
      "conflicts": 0,
      "error_count": 0,
      "warning_count": 2,
      "viewer_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/…/ixbrlviewer.html",
      "json_url": "https://filings.xbrl.org/MINO79WLOO247M1IL051/2025-12-31/ESEF/NL/0/MINO79WLOO247M1IL051-2025-12-31-1-en.json",
      "...": "..."
    }
  ]
}
```

| 字段 | 含义 |
|---|---|
| `listed_period_end` | 索引给该报告标注的期间：可能有误 |
| `report_end` | 读取后其数字中最新期间的结束日：真实的期间 |
| `read_status` | `read`；`refused`（`read_reason` 说明原因）；`missing`（没有 xBRL-JSON）；未读取时为 `null`：同一期间的另一份报告已被读取，或尚未提供 |
| `facts`、`breakdowns`、`conflicts` | 保存的数值、舍弃的细分、以两个不同数值出现而被舍弃的数字 |
| `error_count`、`warning_count`、`inconsistency_count` | filings.xbrl.org 对该报告的验证结果 |

---

## <span className="api-method post">POST</span> `/esef/{ticker}/refresh`

重新向 GLEIF 查询该金融工具的 LEI，列出其报告，并立即重新读取每个期间，即使最近已经读取过。需要完全访问权限的密钥：只读密钥会得到 `403`。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `ticker` | — | 您目录中的一个代码 |
| `isin` | — | 当多个金融工具共用该代码时，指定其中一个 |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/esef/AIR.PA/refresh"
```

响应给出 `ticker`、`lei`、`entity_name` 以及本次读取的 `load`，并附上读取的报告 `read` 和被拒绝的报告 `refused`。

## 错误

| 状态码 | 情形 |
|---|---|
| `404` | 未知代码，或该金融工具没有 ESEF 报告（会给出原因：没有 ISIN、基金、GLEIF 不确认的名称…） |
| `422` | `years` 不在 1 至 30 之间 |
| `502` | 无法读取 filings.xbrl.org，且该公司尚未保存任何数据 |
| `503` | 没有数据库 |

## OpenBB 小组件

**Fonrex ESEF Check**（`fonrex_esef_check`）以表格形式显示核对结果：每个年份和数字一行，差距排在最前，列出 ESEF 和 Yahoo 的数值、百分比差距、IFRS 概念以及在查看器中打开该报告的链接。其 `years` 参数默认为 3。请将它添加到您自己的仪表板中；参见 [OpenBB Workspace 指南](../guides/openbb-workspace.md)。
