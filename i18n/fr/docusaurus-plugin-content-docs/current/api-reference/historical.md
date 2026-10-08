---
id: "historical"
title: "Référence API Ingestion historique"
sidebar_label: "Prix historiques"
description: "Ingérer les cours de clôture dans TimescaleDB et les relire"
---

# Référence API Ingestion historique

Les prix sont enregistrés par **cotation**, résolution (`1D`, `1W`, `1M`) et séance dans l'hypertable `prices_eod`. Les routes d'ingestion modifient des données : elles exigent une clé **à accès complet** (une clé en lecture seule reçoit `403`).

---

## <span className="api-method post">POST</span> `/historical/ingest`

Ingérer l'historique d'une cotation. Les paramètres sont des **paramètres de requête** (query).

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `ticker` | string | — | Ticker à ingérer (obligatoire) |
| `resolution` | string | `1D` | `1D`, `1W` ou `1M` |
| `source` | string | `auto` | `auto` (Yahoo Finance, puis TradingView), `yfinance` ou `tradingview` |
| `force_refresh` | boolean | `false` | Récupérer à nouveau toute la plage, remplacer les barres enregistrées sur cette plage et rechercher à nouveau le symbole source |
| `from_date`, `to_date` | date | — | Fenêtre `YYYY-MM-DD`. Sans elles : dix ans lors d'une première ingestion, sinon à partir du lendemain de la dernière séance enregistrée |
| `currency`, `exchange` | string | — | Choisir la cotation lorsque plusieurs partagent le ticker (la principale sinon) |

```bash
curl -s -X POST -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/historical/ingest?ticker=AIR.PA"
```

```json
{
  "ticker": "AIR.PA",
  "resolution": "1D",
  "status": "success",
  "source_used": "yfinance",
  "provider_symbol": "AIR.PA",
  "records_added": 2531,
  "from_date": "2016-10-10",
  "to_date": "2026-10-07",
  "duration_ms": 1840,
  "error": null,
  "note": null
}
```

| Champ | Signification |
|---|---|
| `status` | `success`, `up_to_date` (rien à récupérer) ou `failed` |
| `source_used` | `yfinance` ou `tradingview` ; en cas d'échec, la source demandée (`auto`…) |
| `provider_symbol` | Le symbole demandé à la source : le symbole Yahoo vérifié pour la cotation, ou le symbole TradingView |
| `note` | Pourquoi Yahoo n'a pas été la source, lorsque les prix viennent de TradingView |
| `error` | Pourquoi rien n'a pu être ingéré, par ex. aucun symbole Yahoo coté dans la devise de la cotation |

---

## <span className="api-method post">POST</span> `/historical/ingest/bulk`

Ingérer plusieurs tickers en parallèle. Corps JSON :

```json
{
  "tickers": ["AIR.PA", "BNP.PA", "MC.PA"],
  "resolution": "1D",
  "source": "auto",
  "force_refresh": false,
  "concurrency": 5
}
```

`concurrency` est compris entre 1 et 20. Chaque ticker désigne sa cotation principale. La réponse est `{"status": "completed", "results": [...]}` avec un résultat par ticker, au format ci-dessus.

---

## <span className="api-method get">GET</span> `/ticker/{symbol}/history`

Les barres OHLCV d'une cotation, lues uniquement en base : cette route n'ingère jamais. Les barres sont renvoyées de la plus récente à la plus ancienne.

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `symbol` | string | — | Ticker |
| `start_date`, `end_date` | date | — | Fenêtre `YYYY-MM-DD` |
| `interval` | string | `1D` | `1D`, `1W`, `1M` (ou `daily`, `weekly`, `monthly`) |
| `currency`, `exchange` | string | — | Choisir la cotation |

```bash
curl -s -H "X-API-KEY: $FONREX_API_KEY" \
  "http://localhost:5000/ticker/AIR.PA/history?start_date=2026-09-28&end_date=2026-10-02"
```

```json
{
  "ticker": "AIR.PA",
  "interval": "1D",
  "count": 5,
  "data": [
    { "time": "2026-10-02T00:00:00Z", "open": 149.07, "high": 151.07, "low": 147.07, "close": 150.07, "adj_close": 150.07, "volume": 1395000 },
    { "time": "2026-10-01T00:00:00Z", "open": 147.97, "high": 149.97, "low": 145.97, "close": 148.97, "adj_close": 148.97, "volume": 1394000 }
  ]
}
```

`time` est la date de la séance, à minuit UTC. Les réponses sont mises en cache 24 heures et invalidées lorsque le ticker est ingéré à nouveau.

---

## Barres hebdomadaires et mensuelles

En plus des barres `1W` et `1M` que vous pouvez ingérer, la base maintient deux agrégats continus calculés à partir des barres journalières de chaque cotation, `prices_weekly` et `prices_monthly`. Ils sont rafraîchis chaque jour et répondent à partir des barres journalières pour la période récente.

Voir [Ingérer des données historiques](../guides/ingest-historical-data.md) pour le pipeline et le choix du symbole source.
