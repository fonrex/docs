---
id: "treasury-curves"
title: "美国国债收益率曲线 API 参考"
sidebar_label: "美国国债收益率曲线"
description: "美国财政部的每日收益率曲线，名义曲线自 1990 年起、实际曲线（TIPS）自 2003 年起：某一天的曲线、各期限和利差的走势、盈亏平衡通胀率"
---

# 美国国债收益率曲线 API 参考

Fonrex 读取[美国财政部](https://home.treasury.gov/resource-center/data-chart-center/interest-rates)的每日收益率曲线（免费文件，无需密钥），并按天保存在您自己的数据库中：

- **名义曲线**（平价收益率），自 1990 年起，期限 1 个月到 30 年；
- **实际曲线**（TIPS，通胀保值国债），自 2003 年起，期限 5 年到 30 年。

FRED 转载这条曲线的 10 年期利率（`DGS10`），并且需要密钥。财政部无需密钥即提供整条曲线，自 1990 年起每天一条：当 FRED 不提供利率时，它也是 DCF 的美国无风险利率（参见[估值](./valuation-dcf.md)）。

| 路由 | 作用 |
|---|---|
| `GET /macro/treasury/curve` | 某一天的曲线，附盈亏平衡通胀率以及与其他日期的比较 |
| `GET /macro/treasury/series` | 各期限（`10Y`）和利差（`10Y-2Y`）随时间的走势 |
| `POST /macro/treasury/refresh` | 按需从财政部读取曲线的年份 |

## 期限

| `tenor` | 期限 | 名义曲线 | 实际曲线 |
|---|---|---|---|
| `1M`、`2M`、`3M`、`4M`、`6M` | 1、2、3、4、6 个月 | ✓ | |
| `6W` | 6 周（财政部的“1.5 Month”） | ✓ | |
| `1Y`、`2Y`、`3Y` | 1、2、3 年 | ✓ | |
| `5Y`、`7Y`、`10Y`、`20Y`、`30Y` | 5、7、10、20、30 年 | ✓ | ✓ |

公布的期限随年份变化：`1M` 自 2001 年 7 月起，`2M` 自 2018 年 10 月起，`4M` 自 2022 年 10 月起，`6W` 自 2025 年 2 月起；1993 年 10 月之前没有 `20Y`，2002 年 2 月至 2006 年 2 月没有 `30Y`；实际曲线上，`20Y` 自 2004 年 7 月起，`30Y` 自 2010 年 2 月起。某天未公布的期限没有利率：1990 年的曲线有 9 个期限，2026 年的曲线有 14 个。

- **利率为比率**：`0.0509` 即 5.09%。实际收益率可能为负（2012 年和 2021 年的每一天），名义收益率可能为零（2008 至 2015 年、2020 年、2021 年）。
- **日期为财政部的工作日**：周末或节假日没有曲线，请求这样的日期会得到之前的工作日。

## 新鲜度

当请求第一次需要某条曲线的某一年时，从财政部读取：每年一个文件，几 KB。之后：

- 在年末之后读取过的**过去年份**是完整的：不会再次请求；
- **当年**在上次读取超过 **`TREASURY_REFRESH_HOURS`** 小时（默认 12）后重新读取；
- 财政部无响应时，返回已保存的利率，`load.status` = `failed` 并附带原因，且不再请求该请求中后续的年份。

一次性加载全部历史（名义曲线 37 个文件，实际曲线 24 个）：

```bash
docker compose exec fonrex-api python scripts/load_treasury_curve.py
```

每个答案都在 `load` 中说明做了什么：`fetched`（本次读取了某一年）、`fresh`（所需内容均已保存）或 `failed`，以及读取的年份和保存的第一天与最后一天。

---

## <span className="api-method get">GET</span> `/macro/treasury/curve`

某一天的曲线，期限由短到长，附当天的**盈亏平衡通胀率**（名义收益率减实际收益率，5 至 30 年）。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `curve` | `nominal` | `nominal` 或 `real` |
| `date` | 最近一天 | 该日或之前的工作日 |
| `compare` | — | 最多 5 个其他日期，可重复：一个日期，或相对该日的偏移（`1W`、`1M`、`3M`、`1Y`） |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/treasury/curve?compare=1M&compare=1Y"
```

```json
{
  "curve": "nominal",
  "label": "Par yield curve (nominal)",
  "source": "US Treasury, Daily Treasury Par Yield Curve Rates (https://home.treasury.gov)",
  "requested_date": null,
  "date": "2026-10-16",
  "points": [
    { "tenor": "1M", "months": 1.0, "value": 0.0412 },
    { "tenor": "6W", "months": 1.5, "value": 0.0414 },
    { "tenor": "2Y", "months": 24.0, "value": 0.0474 },
    { "tenor": "10Y", "months": 120.0, "value": 0.0509 },
    { "tenor": "30Y", "months": 360.0, "value": 0.0543 }
  ],
  "comparisons": [
    {
      "requested": "1M",
      "date": "2026-09-16",
      "points": [{ "tenor": "10Y", "months": 120.0, "value": 0.0501, "change": 0.0008 }]
    },
    {
      "requested": "1Y",
      "date": "2025-10-16",
      "points": [{ "tenor": "10Y", "months": 120.0, "value": 0.0399, "change": 0.011 }]
    }
  ],
  "breakeven": [
    { "tenor": "5Y", "months": 60.0, "value": 0.0237 },
    { "tenor": "10Y", "months": 120.0, "value": 0.0235 },
    { "tenor": "30Y", "months": 360.0, "value": 0.0227 }
  ],
  "load": {
    "status": "fresh",
    "fetched_at": "2026-10-17T10:32:05Z",
    "first_day": "1990-01-02",
    "last_day": "2026-10-16",
    "years_read": [],
    "years_failed": [],
    "reason": null
  }
}
```

此处列表已缩短：答案给出当天的所有期限。`change` 是所请求日期的利率减去比较日期的利率（`0.011` 即 110 个基点）；早于第一个保存日的比较没有日期和数据点。没有实际收益率的日期（2003 年之前）`breakeven` 为空。

---

## <span className="api-method get">GET</span> `/macro/treasury/series`

各期限以及两个期限之间的利差，按天排列，最早的在前。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `tenor` | `10Y` | 最多 6 个期限（`10Y`）或利差（`10Y-2Y`），可重复或以逗号分隔 |
| `curve` | `nominal` | `nominal` 或 `real` |
| `start` | `end` 之前 10 年 | 包含的第一天 |
| `end` | 今天 | 包含的最后一天 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/treasury/series?tenor=10Y-2Y&start=2023-07-01&end=2023-07-05"
```

```json
{
  "curve": "nominal",
  "label": "Par yield curve (nominal)",
  "source": "US Treasury, Daily Treasury Par Yield Curve Rates (https://home.treasury.gov)",
  "start": "2023-07-01",
  "end": "2023-07-05",
  "series": [
    {
      "tenor": "10Y-2Y",
      "observations": [
        { "date": "2023-07-03", "value": -0.0108 },
        { "date": "2023-07-05", "value": -0.0099 }
      ]
    }
  ],
  "load": { "status": "fresh", "...": "..." }
}
```

利差只在两个期限都公布的日期给出。低于零时，曲线**倒挂**：10 年期减 2 年期利差在 2022 年 4 月 1 日和 4 日为负，随后从 2022 年 7 月到 2024 年 9 月为负，2023 年 7 月 3 日低至 -1.08%。

---

## <span className="api-method post">POST</span> `/macro/treasury/refresh`

从财政部读取曲线的年份并存入数据库。需要完全访问密钥：只读密钥会得到 `403`。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `curve` | 两条 | `nominal`、`real`，可重复 |
| `start_year`、`end_year` | 当年 | 读取的年份（1990 年或之后） |
| `force` | `false` | 即使已是最新的年份也读取 |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/treasury/refresh?start_year=1990"
```

答案为每条曲线列出一个 `load`，并注明其 `curve`。

## 错误

| 状态 | 何时 |
|---|---|
| `404` | 所请求日期当天或之前没有曲线（名义曲线始于 1990 年，实际曲线始于 2003 年） |
| `422` | 未知曲线、该曲线不公布的期限（实际曲线的 `2Y`）、超过两个期限的利差、超过 6 个序列或 5 个比较、`start` 晚于 `end`、既不是日期也不是偏移的 `compare` |
| `502` | 无法读取财政部，且该曲线尚无任何已保存的数据 |
| `503` | 没有数据库 |

## OpenBB 小组件

- **Fonrex Treasury Curve**（`fonrex_treasury_curve`）：当天的曲线，并以虚线显示 1 个月前和 1 年前的曲线（`compare`，默认 `1M,1Y`）；`curve` 和 `date` 同上。
- **Fonrex Treasury Spread**（`fonrex_treasury_spread`）：最近 10 年的 10 年期减 2 年期利差，带零线；`tenor` 也接受 `10Y-3M`、`30Y-5Y` 或期限（`2Y,10Y`）。

两者都在 **Fonrex — Screener & Macro** 仪表板的 *Macro Context* 标签页中。参见 [OpenBB Workspace 指南](../guides/openbb-workspace.md)。
