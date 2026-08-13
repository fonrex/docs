---
id: "historical"
title: "Référence API Ingestion Historique"
sidebar_label: "Ingestion Historique"
description: "Endpoints pour le backfill de données historiques OHLCV, l'ingestion en masse et les requêtes historiques"
---


# Référence API Ingestion Historique

L'API d'historique fournit des méthodes pour ingérer, effectuer des backfills et consulter les données historiques de bougies OHLCV quotidiennes dans le stockage TimescaleDB.

---

## <span className="api-method post">POST</span> `/historical/ingest`

Déclencher l'ingestion historique ou le backfill pour un actif individuel.

### Corps de la Requête

```json
{
  "ticker": "BNP.PA",
  "resolution": "d",
  "from_date": "2020-01-01",
  "to_date": "2026-08-01",
  "force": false
}
```

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ticker` | `string` | ✅ | — | Symbole ticker à ingérer |
| `resolution` | `string` | ❌ | `d` | Résolution des bougies (`d`, `w`, `m`) |
| `from_date` | `string` | ❌ | — | Date de début (`AAAA-MM-JJ`) |
| `to_date` | `string` | ❌ | — | Date de fin (`AAAA-MM-JJ`) |
| `force` | `boolean` | ❌ | `false` | Re-télécharger et écraser les enregistrements existants en base de données |

### Exemple de Réponse

```json
{
  "status": "success",
  "ticker": "BNP.PA",
  "records_added": 1650,
  "source": "YahooFinance",
  "duration_ms": 1240
}
```

---

## <span className="api-method post">POST</span> `/historical/ingest/bulk`

Déclencher une ingestion en masse sur plusieurs tickers avec contrôle de la concurrence.

### Corps de la Requête

```json
{
  "tickers": ["AIR.PA", "BNP.PA", "TTE.PA", "MC.PA"],
  "resolution": "d",
  "concurrency": 4
}
```

### Exemple de Réponse

```json
{
  "total": 4,
  "successful": 4,
  "failed": 0,
  "details": [
    { "ticker": "AIR.PA", "status": "success", "records_added": 250 },
    { "ticker": "BNP.PA", "status": "success", "records_added": 250 }
  ]
}
```

---

## <span className="api-method get">GET</span> `/ticker/{symbol}/history`

Consulter les bougies historiques OHLCV depuis la table `prices_eod`. Ingère automatiquement les données manquantes si `auto_ingest=true`.

### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `symbol` | `string` | ✅ | — | Symbole de l'instrument |
| `resolution` | `string` | ❌ | `d` | Résolution (`d`, `w`, `m`) |
| `limit` | `integer` | ❌ | `500` | Nombre de bougies historiques |
| `auto_ingest` | `boolean` | ❌ | `true` | Effectuer automatiquement un backfill des bougies manquantes depuis yfinance |

### Exemples

#### cURL
```bash
curl -s "http://localhost:5000/ticker/AAPL/history?limit=10"
```

#### Python
```python
import requests

resp = requests.get("http://localhost:5000/ticker/AAPL/history", params={"limit": 10})
bars = resp.json()["data"]
print("Fetched bars:", len(bars))
```
