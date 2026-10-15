---
id: "macro-indicators"
title: "宏观指标 API 参考（Eurostat）"
sidebar_label: "宏观指标（Eurostat）"
description: "欧元区及各欧盟国家的通胀、失业、GDP 增长和商业调查，从 Eurostat 读取并按期间保存"
---

# 宏观指标 API 参考（Eurostat）

Fonrex 从 [Eurostat](https://ec.europa.eu/eurostat)（免费，无需密钥）读取欧元区和欧盟各国的主要宏观经济指标，并按期间保存在您自己的数据库中。它们相当于 FRED 为美国提供的数据在欧洲的对应：欧洲投资组合的宏观背景，以及 OpenBB 的 *Macro Context* 仪表板。

| 路由 | 作用 |
|---|---|
| `GET /macro/indicators` | 一个国家或地区每个指标的最新值 |
| `GET /macro/indicators/{indicator}` | 一个指标随时间的变化，最多 10 个国家 |
| `POST /macro/indicators/refresh` | 按需从 Eurostat 读取序列 |

FRED 和欧洲央行的利率（无风险利率、存款便利利率、CISS）仍在 [`GET /macro/rates`](./valuation-dcf.md)。

## 指标

| `indicator` | 含义 | 频率 | 单位 | Eurostat 数据流 |
|---|---|---|---|---|
| `hicp` | HICP 通胀，年变化率 | 月度 | ratio | `prc_hicp_minr` |
| `hicp_core` | 不含能源、食品、酒类和烟草的 HICP，年变化率 | 月度 | ratio | `prc_hicp_minr` |
| `unemployment` | 失业率，经季节调整 | 月度 | ratio | `une_rt_m` |
| `gdp_qoq` | GDP 环比增长（链式物量） | 季度 | ratio | `namq_10_gdp` |
| `gdp_yoy` | GDP 同比增长（与上年同季度相比） | 季度 | ratio | `namq_10_gdp` |
| `economic_sentiment` | 经济景气指标（100 = 长期平均） | 月度 | index | `ei_bssi_m_r2` |
| `consumer_confidence` | 消费者信心（正面与负面回答之差） | 月度 | balance | `ei_bssi_m_r2` |

- **利率以比率表示**（`0.038` = 3.8 %；Eurostat 发布的是百分比）。经济景气指标和信心差额按发布值保存。
- **期间以其第一天标注**：`2026-09-01` 表示 2026 年 9 月，`2026-04-01` 表示 2026 年第二季度。
- **`status`** 保留 Eurostat 的标记：`e` 表示估计值，例如最近一个月的通胀快速估计，几周后会被最终数据替换。
- **通胀** 来自 ECOICOP 2 分类的数据流 `prc_hicp_minr`。旧数据流 `prc_hicp_manr` 已于 2025 年 12 月停止更新。

## 国家和地区

`geo` 使用 Eurostat 的代码：`DE`、`FR`、`IT`、`ES`、`NL`、`BE`、`AT`、`PT`、`IE`、`FI`……以及代表欧盟的 `EU27_2020`。

**`EA` 表示欧元区**，按 `EA21` 读取：即 2026 年保加利亚加入后的构成，Eurostat 已对全部历史进行回溯计算。劳动力市场和调查数据流没有可变构成的代码，因此各处使用同一代码。

## 新鲜度与修订

序列在首次被请求时从 Eurostat 完整读取（通胀和失业自 2000 年起，GDP 自 1995 年起，调查自 20 世纪 80 年代起）。之后：

- 在 **`EUROSTAT_REFRESH_HOURS`** 小时内（默认 24）读取过的序列直接从数据库返回；
- 更早读取的序列会重新读取，从最后存储期间之前 24 个月（GDP 为 8 个季度）开始，使**修订替换该期间的值**；
- 当 Eurostat 无响应时，返回已存储的值，`load.status` 为 `failed` 并附原因。

每个响应在 `load` 中说明所做的操作：`fetched`（刚刚读取）、`fresh`（最近读取过）或 `failed`。

---

## <span className="api-method get">GET</span> `/macro/indicators`

一个国家或地区每个指标的最新值，以及上一期间和变化。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `geo` | `EA` | 一个国家或地区 |
| `indicator` | 所有指标 | 可重复以保留部分指标：`indicator=hicp&indicator=unemployment` |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/macro/indicators?geo=EA"
```

```json
{
  "geo": "EA21",
  "source": "Eurostat, https://ec.europa.eu/eurostat",
  "indicators": [
    {
      "indicator": "hicp",
      "label": "HICP inflation, annual rate of change",
      "frequency": "monthly",
      "unit": "ratio",
      "period": "2026-09-01",
      "value": 0.038,
      "status": "e",
      "previous_period": "2026-08-01",
      "previous_value": 0.032,
      "change": 0.006,
      "load": {
        "status": "fresh",
        "fetched_at": "2026-10-15T09:00:00Z",
        "first_period": "2000-12-01",
        "last_period": "2026-09-01",
        "reason": null
      }
    },
    { "indicator": "unemployment", "unit": "ratio", "period": "2026-08-01", "value": 0.064, "...": "..." },
    { "indicator": "economic_sentiment", "unit": "index", "period": "2026-09-01", "value": 97.9, "change": -0.5, "...": "..." }
  ]
}
```

`change` 为 `value - previous_value`，单位与指标相同（0.006 即 0.6 个百分点）。从未成功读取的序列 `value` 为 `null`，原因见 `load.reason`。

---

## <span className="api-method get">GET</span> `/macro/indicators/{indicator}`

一个指标随时间的变化，每个国家或地区一个序列，按期间从早到晚排列。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `geo` | `EA` | 最多 10 个国家或地区，用逗号分隔 |
| `start`、`end` | 整个序列 | 包含的第一个和最后一个期间（`YYYY-MM-DD`） |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/indicators/hicp?geo=EA,FR,DE&start=2026-07-01"
```

```json
{
  "indicator": "hicp",
  "label": "HICP inflation, annual rate of change",
  "frequency": "monthly",
  "unit": "ratio",
  "source": "Eurostat, https://ec.europa.eu/eurostat",
  "series": [
    {
      "geo": "EA21",
      "load": { "status": "fresh", "...": "..." },
      "observations": [
        { "period": "2026-07-01", "value": 0.029, "status": null },
        { "period": "2026-08-01", "value": 0.032, "status": null },
        { "period": "2026-09-01", "value": 0.038, "status": "e" }
      ]
    },
    { "geo": "FR", "...": "..." },
    { "geo": "DE", "...": "..." }
  ]
}
```

---

## <span className="api-method post">POST</span> `/macro/indicators/refresh`

将 Eurostat 序列读入数据库。需要完全访问密钥：只读密钥会收到 `403`。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `geo` | `EA` | 国家或地区，用逗号分隔 |
| `indicator` | 所有指标 | 可重复以只读取部分指标 |
| `force` | `false` | 即使最近读取过也重新读取 |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/macro/indicators/refresh?geo=EA,FR,DE,IT,ES&force=true"
```

响应为每个序列列出一个 `load`，包含 `indicator`、`geo` 和 `received`（读取的观测值数量）。

## 错误

| 状态码 | 情况 |
|---|---|
| `404` | 未知指标 |
| `422` | `geo` 不是有效代码、超过 10 个国家、在 `GET /macro/indicators` 上指定多个国家、`start` 晚于 `end` |
| `503` | 没有数据库 |

Eurostat 不认识的代码（`geo=XX`）不是请求错误：该序列没有值，`load.reason` 给出 Eurostat 的回复（不允许 `GEO=XX`）。

## OpenBB 小组件

- **Fonrex Macro Indicators**（`fonrex_macro_indicators`）：一个国家每个指标一张卡片；delta 为相对上一期间的变化，利率以百分点表示。
- **Fonrex Macro Indicator Chart**（`fonrex_macro_indicator_chart`）：一个指标随时间的变化，每个国家一条线，默认近 10 年。

两者都位于 **Fonrex — Screener & Macro** 仪表板的 *Macro Context* 标签页。参见 [OpenBB Workspace 指南](../guides/openbb-workspace.md)。
