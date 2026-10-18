---
id: "cot"
title: "交易商持仓报告（COT）API 参考"
sidebar_label: "交易商持仓报告（COT）"
description: "CFTC 每周发布的交易商持仓报告（Commitments of Traders）：美国期货市场（股指、利率、货币、大宗商品）中投机者与套期保值者的持仓、净持仓、COT 指数"
---

# 交易商持仓报告（COT）API 参考

美国商品期货交易委员会（CFTC）每周按交易商类型公布美国期货市场在周二的持仓，即[交易商持仓报告](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm)（Commitments of Traders）。Fonrex 读取这些报告的免费文件（无需密钥），并按周保存在您自己的数据库中。

这是一种**情绪信号**：谁在持有市场，以及其持仓离通常水平有多远。它变化缓慢（每周一个数值，三天后才公布），主要用于进阶的量化研究。

| 路由 | 作用 |
|---|---|
| `GET /cot/markets` | 数据库中的市场，附 CFTC 代码和最新名称 |
| `GET /cot/positions` | 某一市场中各类交易商的持仓，逐期报告 |
| `GET /cot/signals` | 某一类交易商在某一市场的头寸：净持仓、占未平仓合约的比例、变化、COT 指数 |
| `GET /cot/extremes` | 多个市场的最新一期报告，头寸最极端的排在最前 |
| `POST /cot/refresh` | 按需从 CFTC 读取报告的年份 |

## 报告与交易商类型

Fonrex 读取三种报告，仅期货（futures only）：

| `report` | 市场 | 起始时间 | 交易商类型（`category`） |
|---|---|---|---|
| `legacy` | 所有市场 | 1986 年 1 月 | `noncommercial`（投机者）、`commercial`（套期保值者）、`nonreportable`（小型交易商） |
| `tff`（Traders in Financial Futures） | 金融市场：股指、利率、货币、VIX、比特币 | 2006 年 6 月 | `dealer`、`asset_manager`、`leveraged_funds`（对冲基金、CTA）、`other_reportable`、`nonreportable` |
| `disaggregated` | 大宗商品：能源、金属、农产品 | 2006 年 6 月 | `producer_merchant`、`swap_dealer`、`managed_money`（对冲基金、CTA）、`other_reportable`、`nonreportable` |

默认跟踪每种报告的**投机者**：`noncommercial`、`leveraged_funds`、`managed_money`。CFTC 根据交易商自己申报的内容进行分类；单个交易商的分类不予公布。

每类交易商持有**多头**、**空头**，部分类型还持有**价差**（spreading，即在同一市场不同月份同时持有多头和空头）头寸，单位为合约数。所有类型的多头头寸之和等于未平仓合约，空头头寸之和也一样。

## 市场

一个市场由其 **CFTC 合约市场代码**标识，共六个字符：E-mini 标普 500 为 `13874A`，10 年期美国国债期货为 `043602`，WTI 原油为 `067651`，黄金为 `088691`。市场名称变化时代码不变（`067651` 曾名为 `CRUDE OIL, LIGHT SWEET`，如今名为 `WTI-PHYSICAL`）；响应给出最新名称。`GET /cot/markets` 列出所有代码。

某个市场在大型交易商少于 20 家的那几周会从报告中消失，之后再回来。Legacy 报告在 1992 年 9 月之前**每月发布两次**，此后每周发布。

未指定市场时显示**重点市场**：

| 报告 | 重点市场 |
|---|---|
| `tff` | E-mini 标普 500 `13874A`、纳斯达克迷你 `209742`、罗素 2000 E-mini `239742`、2 年期国债 `042601`、10 年期国债 `043602`、欧元 `099741`、日元 `097741`、英镑 `096742`、VIX `1170E1`、比特币 `133741` |
| `disaggregated` | WTI `067651`、天然气 `023651`、黄金 `088691`、白银 `084691`、铜 `085692`、玉米 `002602`、大豆 `005602`、小麦 `001602` |
| `legacy` | E-mini 标普 500、纳斯达克迷你、10 年期国债、欧元、日元、黄金、WTI、天然气、玉米 |

## 信号

对某一类交易商，逐期报告给出：

- **`net`**：多头减空头，单位为合约数；
- **`net_share`**：`net` 占未平仓合约的比例（`-0.2116` 即 -21.16 %）；
- **`change`**：`net` 相对于数据库中上一期报告的变化；
- **`cot_index`**：`net` 在一个**窗口**期内（`window`，默认 156 周，即三年）介于最低值（0）和最高值（100）之间的位置。窗口是一段时间长度，而不是报告的期数。在市场覆盖整个窗口之前，以及 `net` 在窗口内没有变化时，该指数为空。接近 100 表示该类交易商处于窗口内最多头的位置；接近 0 表示最空头。

### 报告日期与发布日期

持仓为**周二**的数据（`date`）。CFTC 在纽约时间**周五**下午 3:30 公布：`published_on` 给出这个周五。这是一个估计值：节假日会使发布推迟一两天，1992 年 10 月之前的报告发布得更晚，而 CFTC 只保留最近 13 个月的真实发布日期。

:::caution 回测
回测必须使用 `published_on`，而不是 `date`：在周二当天，还没有人知道当天的持仓。
:::

## 新鲜度

CFTC 每种报告每年发布一个文件，2016 年及以前的所有年份合为一个文件（Legacy：23 MB）。某一年在请求第一次需要时读取。此后：

- **2016 年及以前的年份**一起来自其报告的历史文件：只读取一次，此后不再读取；
- **2016 年以后的过去年份**若在次年 1 月 15 日或之后读取，即视为完整：不再请求；
- **当年**在上次读取超过 **`COT_REFRESH_HOURS`** 小时（默认 24）后重新读取；
- 当 CFTC 没有响应时（尚未发布的年份返回 `404`），返回已存储的报告，并给出 `load.status` = `failed` 及原因，同时不再请求该请求中后续的年份。

文件要么完整读取，要么完全不读取：版式变化、日期超出文件范围、同一行出现两次或持仓之和与未平仓合约不符，都会导致该文件被拒绝，而已存储的数据保持不变。

一次性加载三种报告的全部历史（需要几分钟）：

```bash
docker compose exec fonrex-api python scripts/load_cot.py
docker compose exec fonrex-api python scripts/load_cot.py --report tff --start-year 2020 --force
```

脚本为每种报告打印一行，若有年份未能读取则以 `1` 退出。各路由的每个响应都在 `load` 中说明所做的操作：`fetched`（本次读取了某一年）、`fresh`（所需数据均已存储）或 `failed`，并附读取的年份以及已存储的首个和最后一个报告日期。

---

## <span className="api-method get">GET</span> `/cot/markets`

数据库中的市场，按报告再按代码排序，附最新名称、合约单位和已存储的报告日期。请求的每种报告会先按需读取当年数据，因此新安装的实例也能列出最新报告中的市场；更早的年份由单个市场的路由或 `POST /cot/refresh` 读取。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `report` | 三种都有 | `legacy`、`tff` 或 `disaggregated` |
| `q` | — | 名称或代码的一部分，不区分大小写（`gold`、`S&P`、`13874`） |
| `key` | `false` | 仅重点市场 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/markets?report=tff&q=13874A"
```

```json
{
  "markets": [
    {
      "report": "tff",
      "market": "13874A",
      "name": "E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE",
      "contract_units": "($50 X S&P 500 INDEX)",
      "first_date": "2006-06-13",
      "last_date": "2026-10-13",
      "...": "...",
      "key": true
    }
  ],
  "loads": [{ "report": "tff", "status": "fresh", "...": "..." }],
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

`weeks` 为该市场已存储的报告日期数量。

---

## <span className="api-method get">GET</span> `/cot/positions`

某一市场中各类交易商的持仓，逐期报告，从旧到新。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `market` | — | CFTC 合约市场代码（必填） |
| `report` | `legacy` | `legacy`、`tff` 或 `disaggregated` |
| `start` | `end` 之前 3 年 | 包含的第一个报告日期 |
| `end` | 今天 | 包含的最后一个报告日期 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/positions?market=088691&report=disaggregated&start=2026-10-13"
```

```json
{
  "report": "disaggregated",
  "market": "088691",
  "name": "GOLD - COMMODITY EXCHANGE INC.",
  "categories": [
    { "code": "producer_merchant", "label": "Producer / merchant / processor / user" },
    { "code": "swap_dealer", "label": "Swap dealers" },
    { "code": "managed_money", "label": "Managed money" },
    { "code": "other_reportable", "label": "Other reportables" },
    { "code": "nonreportable", "label": "Non-reportable" }
  ],
  "start": "2026-10-13",
  "end": "2026-10-18",
  "weeks": [
    {
      "date": "2026-10-13",
      "published_on": "2026-10-16",
      "open_interest": 396345,
      "positions": [
        { "category": "producer_merchant", "long": 18386, "short": 36823, "spreading": null, "net": -18437 },
        { "category": "swap_dealer", "long": 13976, "short": 238070, "spreading": 22057, "net": -224094 },
        { "category": "managed_money", "long": 124747, "short": 17658, "spreading": 33557, "net": 107089 },
        { "category": "other_reportable", "long": 120553, "short": 19763, "spreading": 12338, "net": 100790 },
        { "category": "nonreportable", "long": 50731, "short": 16079, "spreading": null, "net": 34652 }
      ]
    }
  ],
  "load": { "report": "disaggregated", "status": "fresh", "...": "..." },
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

---

## <span className="api-method get">GET</span> `/cot/signals`

某一类交易商在某一市场的头寸，逐期报告，从旧到新。`start` 之前一个窗口期的报告也会被读取，以便计算 `start` 当天的 COT 指数。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `market` | — | CFTC 合约市场代码（必填） |
| `report` | `legacy` | `legacy`、`tff` 或 `disaggregated` |
| `category` | 该报告的投机者 | 该报告中的一类交易商 |
| `window` | `156` | COT 指数窗口的周数（1 到 520） |
| `start` | `end` 之前 3 年 | 给出的第一个报告日期 |
| `end` | 今天 | 给出的最后一个报告日期 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/signals?market=13874A&report=tff&window=52&start=2026-10-01"
```

```json
{
  "report": "tff",
  "market": "13874A",
  "name": "E-MINI S&P 500 - CHICAGO MERCANTILE EXCHANGE",
  "category": { "code": "leveraged_funds", "label": "Leveraged funds" },
  "window_weeks": 52,
  "start": "2026-10-01",
  "end": "2026-10-18",
  "signals": [
    {
      "date": "2026-10-06",
      "published_on": "2026-10-09",
      "open_interest": 1932227,
      "long": 113223,
      "short": 528310,
      "spreading": 48436,
      "net": -415087,
      "net_share": -0.214823,
      "change": -42598,
      "cot_index": 35.6
    },
    {
      "date": "2026-10-13",
      "published_on": "2026-10-16",
      "open_interest": 1931607,
      "long": 121404,
      "short": 530130,
      "spreading": 46956,
      "net": -408726,
      "net_share": -0.211599,
      "change": 6361,
      "cot_index": 37.9
    }
  ],
  "load": { "report": "tff", "status": "fresh", "...": "..." },
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

2026 年 10 月 13 日，杠杆基金在 E-mini 标普 500 上净空头 408,726 张合约，占未平仓合约的 21 %：在过去 52 周的最低与最高净持仓之间处于 37.9 的位置。

---

## <span className="api-method get">GET</span> `/cot/extremes`

多个市场的最新一期报告，COT 指数离 50 最远的排在最前。没有指数的市场排在最后；请求了但数据库中没有任何报告的市场列在 `missing` 中。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `report` | `legacy` | `legacy`、`tff` 或 `disaggregated` |
| `market` | 该报告的重点市场 | 最多 20 个代码，可重复或以逗号分隔 |
| `category` | 该报告的投机者 | 该报告中的一类交易商 |
| `window` | `156` | COT 指数窗口的周数 |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/extremes?report=tff&window=52"
```

```json
{
  "report": "tff",
  "category": { "code": "leveraged_funds", "label": "Leveraged funds" },
  "window_weeks": 52,
  "markets": [
    {
      "market": "099741",
      "name": "EURO FX - CHICAGO MERCANTILE EXCHANGE",
      "signal": { "date": "2026-10-13", "net": -68001, "net_share": -0.077756, "change": -23740, "cot_index": 0.0, "...": "..." }
    },
    {
      "market": "133741",
      "name": "BITCOIN - CHICAGO MERCANTILE EXCHANGE",
      "signal": { "date": "2026-10-13", "net": -5844, "net_share": -0.281611, "change": 1008, "cot_index": 95.5, "...": "..." }
    },
    {
      "market": "1170E1",
      "name": "VIX FUTURES - CBOE FUTURES EXCHANGE",
      "signal": { "date": "2026-10-13", "net": 1105, "net_share": 0.002464, "change": -4389, "cot_index": 90.7, "...": "..." }
    }
  ],
  "missing": [],
  "load": { "report": "tff", "status": "fresh", "...": "..." },
  "source": "CFTC, Commitments of Traders (https://www.cftc.gov)"
}
```

此处列表有所删减：实际响应给出所有重点市场。2026 年 10 月 13 日，杠杆基金在欧元上的头寸处于过去 52 周最空头的位置（指数为 0）。

---

## <span className="api-method post">POST</span> `/cot/refresh`

从 CFTC 读取报告的年份并写入数据库。需要完全访问密钥：只读密钥会收到 `403`。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `report` | 三种都有 | `legacy`、`tff`、`disaggregated`，可重复 |
| `start_year`、`end_year` | 当年 | 读取的年份（1986 年或之后） |
| `force` | `false` | 即使已是最新的年份也重新读取 |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/cot/refresh?report=tff&start_year=2006"
```

响应为每种报告列出一个 `load`。

## 错误

| 状态码 | 情形 |
|---|---|
| `404` | 该市场在此期间没有报告（`GET /cot/markets` 列出数据库中的市场） |
| `422` | 未知报告、市场不是 CFTC 代码（六个字母、数字或 `+`）、属于其他报告的交易商类型（`tff` 中的 `managed_money`）、窗口不在 1 到 520 之间、超过 20 个市场、`start` 晚于 `end` |
| `502` | 无法读取 CFTC，且数据库中没有任何数据 |
| `503` | 没有数据库 |

## OpenBB 小组件

- **Fonrex COT Positioning**（`fonrex_cot_positioning`）：某类交易商在某一市场的净持仓（面积图，左轴）及其 COT 指数（虚线，右轴，0 到 100），显示最近 3 年；默认为杠杆基金在 E-mini 标普 500 上的头寸。`market`、`report`、`category`、`window` 和 `start` 同上。
- **Fonrex COT Extremes**（`fonrex_cot_extremes`）：某种报告中各重点市场的最新一期报告，最极端的排在最前，附净持仓、占未平仓合约的比例、变化以及解读（指数 90 及以上为 *Extreme long*，10 及以下为 *Extreme short*）。

两者都位于 **Fonrex — Screener & Macro** 仪表板的 *Macro Context* 标签页中，使用 TFF 报告。参见 [OpenBB Workspace 指南](../guides/openbb-workspace.md)。
