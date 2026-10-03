---
id: "quant-trader"
title: "📈 Parcours : Quant & Algo-Trader"
sidebar_label: "📈 Quant & Algo-Trader"
description: "Guide étape par étape pour les analystes quantitatifs : ingestion de données historiques, indicateurs Pandas-TA et backtesting Zipline."
---

# 📈 Parcours : Quant & Algo-Trader

Bienvenue dans le parcours dédié aux **Analystes Quantitatifs et Traders Algorithmiques**. Ce guide vous accompagne de l'installation de Fonrex jusqu'à l'exécution d'indicateurs techniques et l'intégration avec votre moteur de backtesting en Python.

> [!TIP]
> **Objectif du parcours :** Configurer un pipeline de données financières auto-hébergé, calculer 18+ indicateurs sur des séries OHLCV et connecter vos scripts Zipline / Backtrader en moins de 10 minutes.

---

### ⏱️ Durée estimée : 10 minutes

---

## 📌 Étape 1 : Déploiement de l'instance locale

Lancez Fonrex avec TimescaleDB et Redis à l'aide de Docker Compose :

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
docker compose up -d
```

Vérifiez le fonctionnement de l'API :
```bash
curl http://localhost:5000/health
```

---

## 📌 Étape 2 : Ingestion de données historiques

Importez l'historique des cours (OHLCV) pour vos tickers cibles via l'endpoint d'ingestion :

```bash
curl -X POST http://localhost:5000/api/v1/historical/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "interval": "1d",
    "provider": "yfinance",
    "start_date": "2023-01-01"
  }'
```

*(Consultez le [Guide d'ingestion de données historiques](/docs/guides/ingest-historical-data) pour automatiser l'ingestion par lots).*

---

## 📌 Étape 3 : Calcul d'indicateurs techniques (Pandas-TA)

Interrogez le moteur d'indicateurs intégrés pour récupérer des moyennes mobiles (SMA/EMA), RSI, MACD ou bandes de Bollinger :

```bash
curl "http://localhost:5000/api/v1/indicators/sma?symbol=AAPL&period=20&interval=1d"
```

Exemple de réponse JSON :
```json
{
  "symbol": "AAPL",
  "indicator": "SMA",
  "period": 20,
  "data": [
    { "timestamp": "2024-01-15T00:00:00Z", "value": 185.42 },
    { "timestamp": "2024-01-16T00:00:00Z", "value": 186.10 }
  ]
}
```

---

## 📌 Étape 4 : Connexion à Zipline pour le Backtesting

Utilisez l'adaptateur Fonrex Zipline dans vos algorithmes de trading en Python :

```python
from fonrex_client import FonrexDataIngestor
import zipline

ingestor = FonrexDataIngestor(base_url="http://localhost:5000")
ingestor.register_bundle(name="fonrex-us-equities", symbols=["AAPL", "MSFT", "NVDA"])

print("✅ Bundle Zipline prêt pour le backtest !")
```

*(Suivez le [Guide complet de Backtesting avec Zipline](/docs/guides/backtesting-zipline) pour configurer la stratégie d'exécution).*

---

## 🎯 Prochaines étapes suggérées

- 📖 [Référence de l'API Indicators](/docs/api-reference/technical-indicators)
- 📊 [Référence des cours historiques](/docs/api-reference/historical)
- 💡 [Guide d'importation d'actifs par masse](/docs/guides/import-assets)
