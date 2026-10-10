---
id: "factors"
title: "Fama/French 因子 API 参考"
sidebar_label: "Fama/French 因子"
description: "Kenneth French Data Library 的因子收益、上市品种的因子暴露，以及用于以美元进行比较的欧洲央行汇率"
---

# Fama/French 因子 API 参考

Fonrex 存储 [Kenneth R. French Data Library](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html)（免费，无需密钥）的因子收益，并衡量一个上市品种对这些因子的暴露：市场、规模、价值、盈利能力、投资和动量。

| 路由 | 作用 |
|---|---|
| `GET /factors` | 数据集列表，以及每个文件已存储的内容 |
| `GET /factors/{dataset}` | 一个数据集的因子收益 |
| `POST /factors/refresh` | 下载因子库的文件 |
| `GET /factors/exposure/{ticker}` | 上市品种的因子暴露：贝塔、阿尔法、R² |

因子也可用于估值中的股权成本：请参阅 [`cost_of_equity_model`](./valuation-dcf.md#factor-cost-of-equity)。

## 数据集 {#datasets}

九个数据集，每个都有**月度**和**日度**数据：

| 数据集 | 因子 |
|---|---|
| `us_3`、`europe_3`、`developed_3` | `MKT_RF`、`SMB`、`HML`、`RF` |
| `us_5`、`europe_5`、`developed_5` | `MKT_RF`、`SMB`、`HML`、`RMW`、`CMA`、`RF` |
| `us_mom`、`europe_mom`、`developed_mom` | `MOM` |

- `MKT_RF`：市场收益减去无风险利率。`SMB`：小盘股减大盘股（规模）。`HML`：高账面市值比减低账面市值比（价值）。`RMW`：高盈利减低盈利。`CMA`：保守投资减激进投资。`MOM`：过去一年的赢家减输家（动量）。`RF`：美国一个月期国库券利率。
- **所有收益均以美元计**，欧洲和发达市场的数据集也是如此，并且所有地区的 `RF` 都是美国利率。
- 数值为**比率**（`0.0289` = 2.89 %；因子库发布的是百分比）。一个月以其最后一天标注日期。
- 历史：美国自 1926 年起（5 因子自 1963 年起），欧洲和发达市场自 1990 年起。月度文件会延迟一到两个月发布。

## 加载文件 {#loading-the-files}

文件在首次使用时下载。如需提前加载：

```bash
docker compose exec fonrex-api python scripts/load_factors.py
docker compose exec fonrex-api python scripts/load_factors.py --dataset us_5 europe_5 --frequency monthly daily
```

不带参数时，脚本会加载每个数据集的月度文件。在 `FACTORS_REFRESH_DAYS` 天（默认 7 天）内读取过的文件不会再次下载；`--force` 仍会下载。下载失败时会保留已存储的值。

---

## <span className="api-method get">GET</span> `/factors`

九个数据集，以及数据库中每个文件已存储的内容。不下载任何内容。

```json
{
  "source": "Kenneth R. French Data Library, https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html",
  "datasets": [
    {
      "dataset": "us_3",
      "region": "us",
      "label": "US 3 factors",
      "factors": ["MKT_RF", "SMB", "HML", "RF"],
      "currency": "USD",
      "loads": [
        {
          "dataset": "us_3",
          "frequency": "monthly",
          "status": "fresh",
          "fetched_at": "2026-10-10T15:25:00Z",
          "first_period": "1926-07-31",
          "last_period": "2026-08-31",
          "periods": 1202,
          "source_note": "CRSP 202608",
          "reason": null
        },
        { "dataset": "us_3", "frequency": "daily", "status": "missing", "periods": 0, "...": "..." }
      ]
    }
  ]
}
```

`status`：

| 值 | 含义 |
|---|---|
| `fetched` | 为本次响应而下载 |
| `fresh` | 在 `FACTORS_REFRESH_DAYS` 天内下载过 |
| `stale` | 较早前下载：下次读取时会重新下载 |
| `failed` | 上次下载失败（`reason`）；保留已存储的值 |
| `missing` | 从未下载 |

`source_note` 是因子库构建该文件所用的数据库（`CRSP 202608`：截至 2026 年 8 月的 CRSP 数据）。

---

## <span className="api-method get">GET</span> `/factors/{dataset}`

一个数据集的收益，按时间从早到晚排列。从未下载或早于 `FACTORS_REFRESH_DAYS` 天的文件会先被下载。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `frequency` | `monthly` | `monthly` 或 `daily` |
| `start`、`end` | — | 包含的第一个和最后一个周期（`YYYY-MM-DD`） |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/factors/us_3?start=2026-07-01"
```

```json
{
  "dataset": "us_3",
  "frequency": "monthly",
  "region": "us",
  "label": "US 3 factors",
  "factors": ["MKT_RF", "SMB", "HML", "RF"],
  "currency": "USD",
  "unit": "ratio",
  "source": "Kenneth R. French Data Library, https://...",
  "load": { "status": "fresh", "last_period": "2026-08-31", "periods": 1202, "source_note": "CRSP 202608", "...": "..." },
  "data": [
    { "date": "2026-07-31", "MKT_RF": -0.0061, "SMB": -0.0192, "HML": 0.0211, "RF": 0.0033 },
    { "date": "2026-08-31", "MKT_RF": 0.0256, "SMB": 0.0034, "HML": -0.0354, "RF": 0.0029 }
  ]
}
```

以上数字仅为示例。下载失败时，会返回已存储的值，并且 `load.status` = `failed`。

| 状态码 | 情况 |
|---|---|
| `404` | 未知的数据集 |
| `422` | `start` 晚于 `end`，或 `frequency` 未知 |
| `503` | 没有存储任何数据且下载失败，或没有数据库 |

---

## <span className="api-method post">POST</span> `/factors/refresh`

将因子库的文件下载到数据库中。此路由会修改数据库：需要**完全访问密钥**。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `dataset` | 所有数据集 | 重复该参数以指定多个：`?dataset=us_3&dataset=europe_3` |
| `frequency` | `monthly` | 重复该参数以同时指定两者：`?frequency=monthly&frequency=daily` |
| `force` | `false` | 即使文件最近读取过也下载 |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/factors/refresh?dataset=europe_5&frequency=monthly&frequency=daily"
```

响应为每个文件列出一个 `load`，字段与 `GET /factors` 相同。在 `FACTORS_REFRESH_DAYS` 天内读取过的文件保持 `fresh` 状态，不会被下载。

---

## <span className="api-method get">GET</span> `/factors/exposure/{ticker}`

用普通最小二乘法，将上市品种的超额收益对其所在地区的因子进行回归：

> r − RF = α + Σ βₖ · Fₖ + ε

| 参数 | 默认值 | 说明 |
|---|---|---|
| `model` | `ff3` | `ff3`（MKT_RF、SMB、HML）、`ff5`（再加 RMW、CMA）或 `carhart`（ff3 再加 MOM） |
| `frequency` | `monthly` | `monthly` 或 `daily` |
| `window` | 60 个月或 252 天 | 参与回归的周期数（24 到 10 000） |
| `end` | 可用的最后一个周期 | 回归的最后一个周期 |
| `region` | 由货币决定 | `us`、`europe` 或 `developed` |
| `currency`、`exchange`、`isin` | — | 选择上市品种，与价格路由相同 |

**先有价格。** 回归读取为该上市品种存储的日收盘价（`adj_close`，含股息）。请先采集价格：

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/historical/ingest?ticker=AIR.PA"
curl -s -H "X-API-KEY: $FONREX_API_KEY" "http://localhost:5000/factors/exposure/AIR.PA?model=ff5"
```

**地区。** 以 USD 计价的上市品种使用美国因子；以欧洲货币（EUR、GBP、CHF、SEK、DKK、NOK……）计价的使用欧洲因子；其他货币使用发达市场因子。`region` 可以选择其他地区。

**以美元计的收益。** 因子以美元计，因此以其他货币计价的收盘价会在计算收益之前，按当日（或一周内最近一天）的欧洲央行参考汇率换算；`converted_from` 给出原始货币。一周内没有汇率的收盘价会被剔除，并附带一条警告。以便士计价的价格会先换算为英镑。所需汇率会按需下载：请参阅[汇率](#exchange-rates)。

**周期。** 月度收益从一个月的最后收盘价到下一个月的最后收盘价；日度收益从一个收盘价到下一个收盘价。回归保留最后 `window` 个同时具有收益和全部因子的周期。

| 可用周期 | 结果 |
|---|---|
| 少于 24 个月（60 天） | `422` |
| 少于 36 个月（126 天） | 仍会计算，但附带警告：估计不够精确 |

```json
{
  "ticker": "AIR.PA",
  "listing": { "ticker": "AIR", "isin": "NL0000235190", "currency": "EUR", "exchange": "XPAR" },
  "model": "ff5",
  "region": "europe",
  "frequency": "monthly",
  "datasets": ["europe_5"],
  "return_currency": "USD",
  "converted_from": "EUR",
  "start": "2021-09-30",
  "end": "2026-08-31",
  "periods": 60,
  "alpha": { "value": 0.0021, "std_error": 0.0035, "t_stat": 0.6, "annualized": 0.0252 },
  "betas": {
    "MKT_RF": { "value": 1.21, "std_error": 0.14, "t_stat": 8.64 },
    "SMB": { "value": -0.35, "std_error": 0.31, "t_stat": -1.13 },
    "HML": { "value": 0.42, "std_error": 0.22, "t_stat": 1.91 },
    "RMW": { "value": 0.18, "std_error": 0.37, "t_stat": 0.49 },
    "CMA": { "value": -0.27, "std_error": 0.41, "t_stat": -0.66 }
  },
  "r_squared": 0.58,
  "adj_r_squared": 0.54,
  "residual_volatility": 0.21,
  "warnings": [],
  "source": "Kenneth R. French Data Library, https://..."
}
```

以上数字仅为示例。

- `alpha.value` 为每个周期的值；`alpha.annualized` 将其乘以 12（月度）或 252（日度）。
- `t_stat` = 值 / 标准误。绝对值小于 2 表示该系数与零没有明显差异。
- `residual_volatility`：因子无法解释部分的年化标准差（该上市品种的特有风险）。

| 状态码 | 情况 |
|---|---|
| `404` | 未知的上市品种，或没有存储日度价格 |
| `422` | 周期太少，或参数超出范围 |
| `503` | 无法下载因子文件或欧洲央行汇率，或没有数据库 |

---

## 汇率 {#exchange-rates}

为了将价格换算为美元，Fonrex 在 `fx_rates` 表中按日保存自 1999 年以来欧元的**欧洲央行参考汇率**（免费，无需密钥）。两种货币之间的汇率通过欧元换算：每英镑美元数 = (每欧元 USD) / (每欧元 GBP)。在 `FX_RATES_REFRESH_HOURS` 小时（默认 12 小时）内读取过的货币不会再次请求；更新时只请求新的日期。

暴露路由会下载它需要的汇率。如需提前加载（默认 USD、GBP、CHF、SEK、DKK、NOK、JPY、CAD、AUD 和 HKD）：

```bash
docker compose exec fonrex-api python scripts/load_fx_rates.py
docker compose exec fonrex-api python scripts/load_fx_rates.py --currency USD GBP CHF --force
```

## 设置 {#settings}

| 变量 | 默认值 | 说明 |
|---|---|---|
| `FACTORS_REFRESH_DAYS` | `7` | 因子文件重新下载前的天数（1 到 90）；因子库大约每月更新一次 |
| `FRENCH_LIBRARY_URL` | `https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp` | 因子库文件的地址；仅在使用镜像时设置 |
| `FX_RATES_REFRESH_HOURS` | `12` | 再次请求某货币欧洲央行汇率前的小时数（1 到 720） |

## 在 OpenBB Workspace 中 {#in-openbb-workspace}

两个小组件展示这些路由：**Fonrex Factor Exposure**（表格）和 **Fonrex Factor Returns**（累计收益图）。请参阅 [OpenBB 参考](./openbb.md)。
