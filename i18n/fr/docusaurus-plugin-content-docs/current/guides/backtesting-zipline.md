---
id: "backtesting-zipline"
title: "Backtesting avec Zipline & Backtrader"
sidebar_label: "Intégration du Backtesting"
description: "Comment exporter les données historiques Fonrex pour le backtesting de stratégies quantitatives avec Zipline et Backtrader"
---


# Backtesting avec Zipline & Backtrader

Fonrex provides clean OHLCV historical feeds that can be ingested into Python backtesting frameworks such as **Backtrader** or **Zipline-reloaded**.

## Récupérer des Données dans des DataFrames Pandas

En utilisant Python, récupérez directement les bougies historiques Fonrex dans un DataFrame Pandas formaté pour le backtesting :

```python
import pandas as pd
import requests

def fetch_fonrex_ohlcv(ticker: str, limit: int = 1000) -> pd.DataFrame:
    url = f"http://localhost:5000/eod/{ticker}"
    params = {"resolution": "d", "limit": limit, "format": "json"}
    response = requests.get(url, params=params)
    data = response.json()["data"]
    
    df = pd.DataFrame(data)
    df["time"] = pd.to_datetime(df["time"])
    df.set_index("time", inplace=True)
    df.sort_index(inplace=True)
    return df

# Récupérer les prix quotidiens d'Airbus SE
df = fetch_fonrex_ohlcv("AIR.PA")
print(df.tail())
```

## Intégration avec Backtrader

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
