---
id: "quant-trader"
title: "Parcours Quant & Algo-Trader"
sidebar_label: "Quant & Algo-Trader"
description: "D'une instance vide aux backtests : ingérer les prix par cotation, calculer les indicateurs côté serveur, alimenter Zipline"
---

# Parcours Quant & Algo-Trader

Ce parcours vous mène d'une instance vide à un backtest : prix quotidiens stockés par cotation dans TimescaleDB, indicateurs calculés par l'API, et un bundle Zipline qui lit votre base de données.

| Étape | Ce que vous utilisez |
|---|---|
| Prix | `POST /historical/ingest`, `scripts/ingest_all.py`, `GET /eod` |
| Indicateurs | `GET /technical/{ticker}` et `/multi`, 18 indicateurs (pandas-ta) |
| Screening | `GET /technical/screen` |
| Backtesting | `zipline_bundle` (zipline-reloaded) ou pandas |

## 1. Démarrer une instance

```bash
git clone https://github.com/fonrex/fonrex.git && cd fonrex
cp .env.example .env
export FONREX_API_KEY="frx_live_$(openssl rand -hex 24)"
sed -i.bak "s/^FONREX_API_KEY=.*/FONREX_API_KEY=$FONREX_API_KEY/" .env && rm .env.bak
mkdir -p logs && docker compose up -d
AUTH="X-API-KEY: $FONREX_API_KEY"
```

## 2. Importer des instruments et ingérer les prix

```bash
docker compose exec fonrex-api python import_assets.py --file data/stocks.csv
curl -s -X POST -H "$AUTH" "http://localhost:5000/historical/ingest?ticker=AIR.PA"
```

L'ingestion récupère dix ans de barres quotidiennes depuis Yahoo Finance avec le symbole vérifié de la cotation (TradingView en solution de repli), datées par séance : les prix négociés ajustés des splits, et un `adj_close` ajusté aussi des dividendes, gardés sur une seule base d'ajustement quand un split ou un dividende survient. Pour tout le catalogue : `docker compose exec fonrex-api python scripts/ingest_all.py`. Détails : [Ingérer des données historiques](../guides/ingest-historical-data.md).

## 3. Calculer des indicateurs

```bash
curl -s -H "$AUTH" "http://localhost:5000/technical/AIR.PA?indicator=rsi&period=14"
curl -s -H "$AUTH" "http://localhost:5000/technical/AIR.PA/multi?indicators=sma_50,sma_200,macd,bbands_20"
curl -s -H "$AUTH" "http://localhost:5000/technical/screen?indicator=rsi&operator=lt&value=30"
```

Les indicateurs sont calculés sur les prix stockés avec pandas-ta et mis en cache dans Redis. Voir la [référence des indicateurs techniques](../api-reference/technical-indicators.md).

## 4. Backtester

Avec Zipline, enregistrez le bundle et ingérez-le depuis votre base de données :

```bash
pip install zipline-reloaded
export DATABASE_URL="postgresql://fonrex:<POSTGRES_PASSWORD>@localhost:5432/fonrex"
python -m zipline_bundle ingest --start 2020-01-01 --end 2025-12-31 --tickers AIR.PA,BNP.PA --calendar XPAR
```

Ou chargez les prix dans pandas via `GET /eod/{ticker}` — voir [Python & Jupyter](../guides/python-jupyter.md), avec un exemple de notebook. Voir [Backtesting avec Zipline](../guides/backtesting-zipline.md).

## 5. Mesurer l'exposition aux facteurs {#5-measure-factor-exposure}

```bash
curl -s -H "$AUTH" "http://localhost:5000/factors/exposure/AIR.PA?model=carhart"
```

Les prix stockés sont régressés sur les facteurs Fama/French de leur région (en dollars US) : bêtas, t-stats, alpha annualisé, R². Voir [Facteurs Fama/French](../api-reference/factors.md).

## Étapes suivantes

- [API des prix historiques](../api-reference/historical.md)
- [Streaming temps réel](../api-reference/realtime.md) pour les ticks d'une minute
- [Modèle de données](../architecture/data-model.md)
