---
id: "backtesting-zipline"
title: "Backtesting avec Zipline"
sidebar_label: "Backtesting (Zipline)"
description: "Exécuter des backtests zipline-reloaded sur les prix de votre base Fonrex, ou les charger dans pandas"
---

# Backtesting avec Zipline

Fonrex fournit un bundle de données [`zipline-reloaded`](https://github.com/stefan-jansen/zipline-reloaded), `zipline_bundle/`, qui lit directement les prix quotidiens de votre base de données : pas d'export CSV, pas de jeu de données parallèle. L'API n'importe jamais Zipline : installez-le uniquement là où vous exécutez les backtests.

## Prérequis

- Des prix ingérés dans votre instance (`POST /historical/ingest`, `scripts/ingest_all.py`).
- Le dépôt Fonrex et `zipline-reloaded` dans le même environnement Python :

```bash
pip install zipline-reloaded
```

- Un accès à la base de données. Avec Docker Compose, elle est publiée sur `127.0.0.1:5432` de l'hôte :

```bash
export DATABASE_URL="postgresql://fonrex:<POSTGRES_PASSWORD>@localhost:5432/fonrex"
```

## Enregistrer et ingérer le bundle

```bash
mkdir -p ~/.zipline
cp zipline_bundle/extension.py ~/.zipline/extension.py
zipline bundles            # fonrex <no ingestions>
zipline ingest -b fonrex
```

Ou sans le fichier d'extension :

```bash
python -m zipline_bundle ingest --start 2020-01-01 --end 2025-12-31 \
    --tickers AAPL,MSFT --calendar NYSE

# What the bundle would contain (Zipline not needed)
python -m zipline_bundle preview --start 2024-01-01 --end 2024-12-31
```

| Variable | Défaut | Description |
|---|---|---|
| `DATABASE_URL` | l'adresse de `.env.example` | Base de données lue par le bundle (`postgresql+asyncpg://` est accepté) |
| `FONREX_BUNDLE_NAME` | `fonrex` | Nom du bundle |
| `FONREX_BUNDLE_TICKERS` | *(vide)* | Tickers séparés par des virgules ; vide = tous les instruments ayant des prix quotidiens dans la période |
| `FONREX_BUNDLE_CALENDAR` | `NYSE` | Calendrier de trading : `XPAR`, `XETR`, `XLON`, `XSWX`… pour les autres marchés |

Pour plusieurs marchés, enregistrez un bundle par calendrier :

```python
from zipline_bundle import register_fonrex_bundle

register_fonrex_bundle(bundle_name="fonrex_us", tickers=["AAPL", "MSFT"], calendar_name="NYSE")
register_fonrex_bundle(bundle_name="fonrex_paris", tickers=["AIR.PA", "BNP.PA"], calendar_name="XPAR")
```

## Exécuter un backtest

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

## Contenu du bundle

- **Barres quotidiennes uniquement**, issues de `prices_eod`.
- **Une cotation par instrument** : la cotation principale, sinon une cotation active ; les autres cotations (autres devises) ne sont pas exposées.
- **Prix ajustés** : `adj_close` sert de clôture Zipline. Les tables de splits et de dividendes sont écrites vides.
- **Alignement sur le calendrier** : les barres en dehors des séances du calendrier sont écartées.
- **`sid` stables** : attribués dans l'ordre alphabétique des symboles.

## Sans Zipline : pandas

Pour Backtrader, vectorbt ou votre propre code, lisez les prix via l'API :

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

Les colonnes sont `open`, `high`, `low`, `close`, `adj close` et `volume`, avec une ligne par séance.
