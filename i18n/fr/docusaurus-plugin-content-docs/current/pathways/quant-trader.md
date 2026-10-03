---
id: "quant-trader"
title: "Parcours Quant & Algo-Trader"
sidebar_label: "Quant & Algo-Trader"
description: "Guide technique d'intégration pour analystes quantitatifs : ingestion de séries temporelles, indicateurs Pandas-TA et backtesting Zipline"
---

# Parcours Quant & Algo-Trader

Ce parcours fournit un guide technique d'intégration pour les **Analystes Quantitatifs et Traders Algorithmiques**. Il couvre la configuration de l'infrastructure locale, l'ingestion des séries temporelles OHLCV dans TimescaleDB, le calcul des indicateurs techniques côté serveur via Pandas-TA et l'intégration avec le moteur de backtesting Zipline en Python.

| Composant | Technologie | Spécification |
|---|---|---|
| **Ingestion de données** | Hypertables TimescaleDB | Stockage partitionné des séries temporelles OHLCV |
| **Indicateurs techniques** | Moteur Pandas-TA | 18+ indicateurs calculés côté serveur (SMA, EMA, RSI, MACD, Bollinger) |
| **Moteur de backtest** | Adaptateur Zipline | Client DataBundle Python natif |

---

## 1. Déploiement de l'infrastructure locale

Lancez le serveur d'application Fonrex ainsi que les conteneurs TimescaleDB et Redis à l'aide de Docker Compose :

```bash
git clone https://github.com/fonrex/fonrex.git
cd fonrex
cp .env.example .env
docker compose up -d
```

Vérifiez le statut du serveur :

```http
GET /health
```

Réponse JSON attendue :

```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "alembic_version": "011_provider_monitoring"
}
```

---

## 2. Ingestion des données historiques

Importez les données de cours historiques (OHLCV) dans les hypertables TimescaleDB via l'endpoint d'ingestion :

```http
POST /api/v1/historical/ingest
Content-Type: application/json

{
  "symbol": "AAPL",
  "interval": "1d",
  "provider": "yfinance",
  "start_date": "2023-01-01"
}
```

> **Note** : Pour automatiser l'ingestion par lots sur plusieurs symboles, consultez le [Guide d'ingestion des données historiques](/docs/guides/ingest-historical-data).

---

## 3. Calcul des indicateurs techniques côté serveur

Interrogez le moteur Pandas-TA pour calculer des indicateurs directement sur les données stockées :

```http
GET /api/v1/indicators/sma?symbol=AAPL&period=20&interval=1d
```

Format de réponse :

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

## 4. Connexion à Zipline pour le Backtesting

Utilisez l'adaptateur client Python Fonrex dans votre stratégie Zipline :

```python
from fonrex_client import FonrexDataIngestor
import zipline

ingestor = FonrexDataIngestor(base_url="http://localhost:5000")
ingestor.register_bundle(name="fonrex-us-equities", symbols=["AAPL", "MSFT", "NVDA"])

print("Bundle Zipline enregistré avec succès.")
```

---

## Prochaines étapes

- Consulter la [Référence API Indicators](/docs/api-reference/technical-indicators)
- Consulter la [Référence API Historical](/docs/api-reference/historical)
- Consulter le [Guide Backtesting Zipline](/docs/guides/backtesting-zipline)
