---
id: "backtesting-zipline"
title: "使用 Zipline 进行回测"
sidebar_label: "回测（Zipline）"
description: "基于 Fonrex 数据库中的价格运行 zipline-reloaded 回测，或将价格加载到 pandas"
---

# 使用 Zipline 进行回测

Fonrex 提供一个 [`zipline-reloaded`](https://github.com/stefan-jansen/zipline-reloaded) 数据包（bundle）`zipline_bundle/`，它直接读取数据库中的日线价格：无需导出 CSV，也无需维护一份平行数据集。API 本身从不导入 Zipline：只需在运行回测的环境中安装它。

## 前提条件

- 您的实例中已采集价格（`POST /historical/ingest`、`scripts/ingest_all.py`）。
- Fonrex 仓库和 `zipline-reloaded` 位于同一个 Python 环境中：

```bash
pip install zipline-reloaded
```

- 能够访问数据库。使用 Docker Compose 时，数据库发布在主机的 `127.0.0.1:5432` 上：

```bash
export DATABASE_URL="postgresql://fonrex:<POSTGRES_PASSWORD>@localhost:5432/fonrex"
```

## 注册并导入 bundle

```bash
mkdir -p ~/.zipline
cp zipline_bundle/extension.py ~/.zipline/extension.py
zipline bundles            # fonrex <no ingestions>
zipline ingest -b fonrex
```

也可以不使用 extension 文件：

```bash
python -m zipline_bundle ingest --start 2020-01-01 --end 2025-12-31 \
    --tickers AAPL,MSFT --calendar NYSE

# What the bundle would contain (Zipline not needed)
python -m zipline_bundle preview --start 2024-01-01 --end 2024-12-31
```

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DATABASE_URL` | `.env.example` 中的地址 | bundle 读取的数据库（也接受 `postgresql+asyncpg://`） |
| `FONREX_BUNDLE_NAME` | `fonrex` | bundle 名称 |
| `FONREX_BUNDLE_TICKERS` | *（空）* | 以逗号分隔的 ticker；为空表示时间窗口内所有具有日线价格的金融工具 |
| `FONREX_BUNDLE_CALENDAR` | `NYSE` | 交易日历：其他市场可使用 `XPAR`、`XETR`、`XLON`、`XSWX`… |

如需覆盖多个市场，请为每个日历注册一个 bundle：

```python
from zipline_bundle import register_fonrex_bundle

register_fonrex_bundle(bundle_name="fonrex_us", tickers=["AAPL", "MSFT"], calendar_name="NYSE")
register_fonrex_bundle(bundle_name="fonrex_paris", tickers=["AIR.PA", "BNP.PA"], calendar_name="XPAR")
```

## 运行回测

```python
import pandas as pd
from zipline import run_algorithm
from zipline.api import order_target_percent, symbol

def initialize(context):
    context.asset = symbol("AIR.PA")

def handle_data(context, data):
    order_target_percent(context.asset, 1.0)

result = run_algorithm(
    start=pd.Timestamp("2024-01-02"),
    end=pd.Timestamp("2024-12-31"),
    initialize=initialize,
    handle_data=handle_data,
    capital_base=100_000,
    bundle="fonrex_paris",
)
```

## bundle 包含的内容

- **仅日线 K 线**，来自 `prices_eod`。
- **每个金融工具一个上市品种**：优先选择主上市品种，其次选择一个活跃的上市品种；其他上市品种（其他货币）不会暴露。
- **复权价格**：使用 `adj_close`（已针对拆股和分红调整）作为 Zipline 的收盘价，K 线的开盘价、最高价和最低价按同一系数缩放；没有 `adj_close` 的 K 线（TradingView）保留其原有价格。拆股表和分红表写入为空。
- **日历对齐**：不在该日历交易日内的 K 线会被丢弃。
- **稳定的 `sid`**：按代码（symbol）的字母顺序分配。

## 不使用 Zipline：pandas

对于 Backtrader、vectorbt 或您自己的代码，可以通过 API 读取价格：

```python
import os
import pandas as pd
import requests

def fonrex_ohlcv(ticker: str, period: str = "5y") -> pd.DataFrame:
    response = requests.get(
        f"http://localhost:5000/eod/{ticker}",
        params={"period": period},
        headers={"X-API-KEY": os.environ["FONREX_API_KEY"]},
        timeout=60,
    )
    response.raise_for_status()
    frame = pd.DataFrame(response.json()["data"])
    frame["Date"] = pd.to_datetime(frame["Date"])
    return frame.set_index("Date").rename(columns=str.lower)

df = fonrex_ohlcv("AIR.PA")
print(df.tail())
```

列为 `open`、`high`、`low`、`close`、`adj close` 和 `volume`，每个交易日一行。
