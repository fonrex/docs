---
id: "backtesting-zipline"
title: "Backtesting with Zipline & Backtrader"
sidebar_label: "Backtesting Integration"
description: "How to export Fonrex historical data for backtesting quantitative strategies with Zipline and Backtrader"
---

# Backtesting with Zipline & Backtrader

Fonrex provides clean OHLCV historical feeds that can be ingested into Python backtesting frameworks such as **Backtrader** or **Zipline-reloaded**.

## Fetching Data into Pandas DataFrames

Using Python, fetch historical candles directly from Fonrex into a Pandas DataFrame formatted for backtesting:

```python
import pandas as pd
import requests

def fetch_fonrex_ohlcv(ticker: str, limit: int = 1000) -> pd.DataFrame:
    url = f"http://localhost:5000/eod/{ticker}"
    params = {"period": "1y", "resolution": "d", "limit": limit, "format": "json"}
    response = requests.get(url, params=params)
    data = response.json()["data"]
    
    df = pd.DataFrame(data)
    df["time"] = pd.to_datetime(df["time"])
    df.set_index("time", inplace=True)
    df.sort_index(inplace=True)
    return df

# Fetch Airbus SE daily prices
df = fetch_fonrex_ohlcv("AIR.PA")
print(df.tail())
```

## Integrating with Backtrader

Pass the Fonrex DataFrame directly into Backtrader:

```python
import backtrader as bt

class SmaCrossStrategy(bt.Strategy):
    def __init__(self):
        self.sma_fast = bt.indicators.SMA(period=10)
        self.sma_slow = bt.indicators.SMA(period=30)
        self.crossover = bt.indicators.CrossOver(self.sma_fast, self.sma_slow)

    def next(self):
        if not self.position and self.crossover > 0:
            self.buy()
        elif self.position and self.crossover < 0:
            self.close()

cerebro = bt.Cerebro()
data_feed = bt.feeds.PandasData(dataname=df)
cerebro.adddata(data_feed)
cerebro.addstrategy(SmaCrossStrategy)
cerebro.run()
```
