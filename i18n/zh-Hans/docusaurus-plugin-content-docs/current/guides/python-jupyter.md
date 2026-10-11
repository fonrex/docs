---
id: "python-jupyter"
title: "在 Python 和 Jupyter 中使用 Fonrex"
sidebar_label: "Python & Jupyter"
description: "将 Fonrex 实例中的价格加载到 pandas，并替换 notebook 中的 OpenBB 价格调用"
---

# 在 Python 和 Jupyter 中使用 Fonrex

Fonrex 是一个 HTTP API：没有可以导入的 `fonrex` Python 包，Fonrex 也不是 OpenBB Platform 的数据提供方（`obb`）。在 Python 中，使用 `requests` 调用您的实例，并根据返回的 JSON 构建 pandas 对象。十几行代码即可替代 `obb.equity.price.historical(...)` 这样的调用。

## 前提条件

- 一个正在运行的实例——请参阅[安装](../getting-started/installation.md)。
- 在启动 Jupyter 之前于环境变量中设置 API 密钥。读取价格只需要**只读**密钥：

```bash
export FONREX_URL=http://localhost:5000
export FONREX_API_KEY=frx_live_...
jupyter lab
```

- 所需的上市品种已在目录中（见下一节）。

## 1. 将上市品种加入目录

Fonrex 按金融工具（以 ISIN 标识）的**上市品种**存储价格。不在目录中的 ticker 没有价格：`GET /eod/{ticker}` 会返回 `404`，并附带 `"reason": "No listing found for ticker ..."`。

下面的示例使用八只美国股票和 SPY ETF。将它们写入一个 CSV 文件（[下载](pathname:///notebooks/us-hedging-listings.csv)）：

```csv
name,ticker,isin,productType,currency
Newmont Corporation,NEM,US6516391066,STOCK,USD
Royal Gold Inc,RGLD,US7802871084,STOCK,USD
SSR Mining Inc,SSRM,CA7847301032,STOCK,USD
Coeur Mining Inc,CDE,US1921085049,STOCK,USD
Eli Lilly and Co,LLY,US5324571083,STOCK,USD
UnitedHealth Group Inc,UNH,US91324P1021,STOCK,USD
Johnson & Johnson,JNJ,US4781601046,STOCK,USD
Merck & Co Inc,MRK,US58933Y1055,STOCK,USD
SPDR S&P 500 ETF Trust,SPY,US78462F1030,ETF,USD
```

通过标准输入将文件发送到容器，然后导入。这样文件由容器的用户创建，该用户可以读取它；如果使用 `docker compose cp`，文件会保留您本机的权限，导入可能会因 `Permission denied` 而失败。

```bash
docker compose exec -T fonrex-api sh -c 'cat > /tmp/us-hedging-listings.csv' < us-hedging-listings.csv
docker compose exec fonrex-api python import_assets.py --file /tmp/us-hedging-listings.csv
```

CSV 规则请参阅[导入资产](import-assets.md)。

## 2. 将价格读入 pandas

带 `from` 和 `to` 参数的 `GET /eod/{ticker}` 返回某个时间窗口内的日线数据。如果数据库在该窗口内没有任何日线，该路由会先从 Yahoo Finance 采集（使用为该上市品种验证过的代码），因此某个 ticker 的首次调用需要几秒钟。

仅凭 ticker 并不总能确定唯一的金融工具。在默认目录中，`NEM` 既是以 USD 计价的 Newmont、其以 AUD 计价的澳大利亚上市线，也是以 EUR 计价的 Nemetschek；`MRK` 也对应 Merck KGaA，`CDE` 也对应 City Developments。请用 **ISIN**（`isin`）指定每个金融工具，用**货币**（`currency`）指定上市品种：两者结合即可确定唯一的上市品种。

```python
import os

import pandas as pd
import requests

FONREX_URL = os.environ.get("FONREX_URL", "http://localhost:5000")
FONREX_API_KEY = os.environ["FONREX_API_KEY"]


def fonrex_prices(instruments, start_date, end_date, currency="USD"):
    """Daily closing prices of several listings, one column per ticker.

    ``instruments`` maps each ticker to the ISIN of its instrument.
    """
    session = requests.Session()
    session.headers["X-API-KEY"] = FONREX_API_KEY
    closes = {}
    for ticker, isin in instruments.items():
        response = session.get(
            f"{FONREX_URL}/eod/{ticker}",
            params={"from": start_date, "to": end_date, "isin": isin, "currency": currency},
            timeout=120,  # the first call ingests the prices from Yahoo Finance
        )
        if response.status_code != 200:
            raise RuntimeError(f"{ticker}: {response.status_code} {response.text}")
        bars = pd.DataFrame(response.json()["data"])
        closes[ticker] = bars.set_index(pd.to_datetime(bars["Date"]))["Close"]
    data = pd.DataFrame(closes).sort_index(axis=1)
    data.index.name = "date"
    data.columns.name = "symbol"
    return data


data = fonrex_prices(
    {"NEM": "US6516391066", "LLY": "US5324571083", "SPY": "US78462F1030"},
    "2020-01-01",
    "2022-12-31",
)
```

每条日线包含 `Date`、`Open`、`High`、`Low`、`Close`、`Adj Close` 和 `Volume`。响应中还会给出实际读取的 `listing`（`ticker`、`isin`、`currency`、`exchange`）——请参阅 [`GET /eod/{ticker}`](../api-reference/assets.md)。

:::tip 不传 ISIN 时
`isin` 是可选的。不传时，Fonrex 在带有该 ticker 的上市品种中，优先选择主上市品种，然后按货币的字母顺序选择：既不传 `isin` 也不传 `currency` 时，`/eod/NEM` 返回以 AUD 计价的澳大利亚上市线。仅传 `currency="USD"` 时，示例中的九个 ticker 恰好是唯一的，但默认目录中仍有 196 个 ticker 与货币的组合属于多个金融工具。不传 `isin` 时，请检查响应中的 `listing.isin`。
:::

## 在 notebook 中替换 OpenBB

| OpenBB | Fonrex |
|---|---|
| `from openbb import obb` | `import requests` 以及上面的 `fonrex_prices()` 函数 |
| `obb.equity.price.historical(symbols, start_date=..., end_date=..., provider="yfinance")` | `fonrex_prices(instruments, start_date, end_date)`，其中 `instruments` 将每个 ticker 映射到其 ISIN |
| `.pivot(columns="symbol", values="close")` | 已经完成：每个代码一列，索引为 `date` |
| `obb.user.preferences.output_type = "dataframe"` | 不需要 |

notebook 中处理 DataFrame 的其余部分（`pct_change()`、回归、绘图）无需修改。

:::note Close 还是 Adj Close
`Close` 是成交收盘价，仅按拆股调整——这是 OpenBB 的 `yfinance` 提供方的默认值，因此该 notebook 给出的数字与使用 OpenBB 时相同。`Adj Close` 还按股息进行了调整：需要包含股息的收益率时请使用它，这也是衡量 alpha 和 beta 的常用选择。
:::

## 示例 notebook：beta 对冲

[beta-hedging-fonrex.ipynb](pathname:///notebooks/beta-hedging-fonrex.ipynb) 构建一个由黄金股（NEM、RGLD、SSRM、CDE）和医疗保健股（LLY、UNH、JNJ、MRK）组成的等权重投资组合，通过 OLS 回归（`statsmodels`）估计其相对于 SPY 的 alpha 和 beta，然后构建一个 beta 约为零的 beta 对冲投资组合。

其中唯一与 Fonrex 相关的部分是价格加载：

```python
instruments = {
    "NEM": "US6516391066",   # Newmont
    "RGLD": "US7802871084",  # Royal Gold
    "SSRM": "CA7847301032",  # SSR Mining
    "CDE": "US1921085049",   # Coeur Mining
    "LLY": "US5324571083",   # Eli Lilly
    "UNH": "US91324P1021",   # UnitedHealth
    "JNJ": "US4781601046",   # Johnson & Johnson
    "MRK": "US58933Y1055",   # Merck & Co
    "SPY": "US78462F1030",   # SPDR S&P 500 ETF
}
data = fonrex_prices(instruments, start_date="2020-01-01", end_date="2022-12-31")

benchmark_returns = data.pop("SPY").pct_change().dropna()
portfolio_returns = data.pct_change().dropna().sum(axis=1)
```

导入第 1 步中的上市品种，设置 `FONREX_API_KEY`，然后在 Jupyter 中打开该 notebook。

## 故障排除

| 响应 | 原因 |
|---|---|
| `401` | 缺少 `FONREX_API_KEY`，或它不是该实例的密钥 |
| `400`，附带 `The ISIN ... is not valid` | 该 ISIN 不是 12 个字符（两个字母，后跟十个字母或数字） |
| `404`，附带 `No listing found for ticker` | 目录中没有具有该 ticker、该 ISIN 和该货币的上市品种：请导入它，或检查 ISIN |
| `404`，附带其他 `reason` | 采集失败，例如没有以该上市品种货币报价的 Yahoo 代码 |
| `404` `No data found` 且没有 `reason`，或行数少于预期 | 数据库中已存有该上市品种的其他日期：`/eod` 只会采集空窗口，且采集从最后一个已存储日期之后继续。请使用完全访问密钥重新获取该窗口：`POST /historical/ingest?ticker=NEM&isin=US6516391066&currency=USD&from_date=2020-01-01&to_date=2022-12-31&force_refresh=true` |

## 相关页面

- [历史价格 API](../api-reference/historical.md)
- [采集历史数据](ingest-historical-data.md)
- [量化与算法交易者路径](../pathways/quant-trader.md)
